import fs from "node:fs";
import path from "node:path";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PlanningAiResult, PlanningMatrixItem, PlanningSkill } from "./planning-ai-service";
import { extractAnnualItemsForTrimester } from "@/lib/planejamentos/planning-trimestral-from-annual";
import {
  finalizeMatrixLessonAllocation,
  formatMatrixAulaLabel,
  formatMatrixPeriodosLabel,
} from "./planning-lesson-allocation";

type Primitive = string | number | boolean | null | undefined;
type UnknownRecord = Record<string, unknown>;

export type OfficialPlanningPayload = {
  tipoPlanejamento?: string;
  tipo?: string;
  modo?: string;
  escola?: string;
  professor?: string;
  etapa?: string;
  anoSerie?: string;
  serie?: string;
  ano?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  componente?: string;
  cargaHoraria?: string | number;
  trimestre?: string | number;
  conteudos?: string | string[];
  conteudo?: string;
  objetivosGerais?: string;
  objetivos?: string;
  observacoes?: string;
  matrizPlanejamento?: PlanningAiResult["planejamento"] | { conteudos?: PlanningMatrixItem[] };
  /** Pacote ZIP: trimestres a incluir (1–3). Omitido = os três. */
  trimestresExtraidos?: number[];
  /** Pacote ZIP: matrizes trimestrais já extraídas do anual (chave "1" | "2" | "3"). */
  matrizesTrimestrais?: Record<
    string,
    PlanningAiResult["planejamento"] | { conteudos?: PlanningMatrixItem[] }
  >;
};

type ZipFileEntry = {
  path: string;
  content: string | Buffer;
};

type XmlRange = {
  start: number;
  end: number;
  xml: string;
};

type CellInfo = XmlRange & {
  text: string;
};

type RowInfo = XmlRange & {
  cells: CellInfo[];
  text: string;
};

type TableInfo = XmlRange & {
  rows: RowInfo[];
  text: string;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(input: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value & 0xffff, 0);
  return buffer;
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function buildZip(files: ZipFileEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const now = getDosDateTime();

  for (const file of files) {
    const fileName = Buffer.from(file.path.replace(/\\/g, "/"), "utf8");
    const uncompressed = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, "utf8");
    const compressed = deflateRawSync(uncompressed);
    const checksum = crc32(uncompressed);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(8),
      u16(now.time),
      u16(now.date),
      u32(checksum),
      u32(compressed.length),
      u32(uncompressed.length),
      u16(fileName.length),
      u16(0),
      fileName,
    ]);

    localParts.push(localHeader, compressed);

    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(8),
      u16(now.time),
      u16(now.date),
      u32(checksum),
      u32(compressed.length),
      u32(uncompressed.length),
      u16(fileName.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      fileName,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);

  return Buffer.concat([
    localData,
    centralDirectory,
    Buffer.concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralDirectory.length),
      u32(localData.length),
      u16(0),
    ]),
  ]);
}

function readZip(buffer: Buffer): Map<string, Buffer> {
  let eocdOffset = -1;

  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error("DOCX inválido: diretório ZIP não encontrado.");
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map<string, Buffer>();
  let pointer = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) {
      throw new Error("DOCX inválido: cabeçalho central ZIP corrompido.");
    }

    const compression = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const fileNameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localHeaderOffset = buffer.readUInt32LE(pointer + 42);
    const fileName = buffer
      .subarray(pointer + 46, pointer + 46 + fileNameLength)
      .toString("utf8");

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

    if (compression === 0) {
      entries.set(fileName, Buffer.from(compressedData));
    } else if (compression === 8) {
      entries.set(fileName, inflateRawSync(compressedData));
    }

    pointer += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function buildZipFromEntries(entries: Map<string, Buffer | string>): Buffer {
  return buildZip(
    Array.from(entries.entries()).map(([entryPath, content]) => ({
      path: entryPath,
      content,
    })),
  );
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeSearch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function escapeXml(value: Primitive): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getString(payload: OfficialPlanningPayload, keys: string[], fallback = ""): string {
  const source = payload as UnknownRecord;

  for (const key of keys) {
    const value = source[key];

    if (value !== null && value !== undefined && normalizeText(value)) {
      return normalizeText(value);
    }
  }

  return fallback;
}

function parseNumber(value: unknown, fallback: number): number {
  const match = normalizeText(value).match(/\d+/);
  const parsed = match ? Number(match[0]) : NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTipo(payload: OfficialPlanningPayload): "anual" | "trimestral" {
  const value = normalizeSearch(
    payload.tipoPlanejamento || payload.tipo || payload.modo || "anual",
  );

  return value.includes("tri") ? "trimestral" : "anual";
}

function getTrimestre(payload: OfficialPlanningPayload): number {
  return Math.min(Math.max(parseNumber(payload.trimestre, 1), 1), 3);
}

function splitContents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitContents(item));
  }

  return normalizeText(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOfficialTemplatePath(tipo: "anual" | "trimestral"): string {
  const file = path.join(
    process.cwd(),
    "data",
    "modelos-oficiais",
    tipo === "anual" ? "modelo-anual.docx" : "modelo-trimestral.docx",
  );

  if (!fs.existsSync(file)) {
    throw new Error(
      `Modelo oficial ${tipo} não encontrado em data/modelos-oficiais (${file}).`,
    );
  }

  return file;
}

function findRanges(xml: string, tag: string): XmlRange[] {
  const result: XmlRange[] = [];
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml))) {
    result.push({
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
    });
  }

  return result;
}

function textFromXml(xml: string): string {
  return decodeXml(
    xml
      .replace(/<w:tab\/>/g, " ")
      .replace(/<w:br\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function parseCells(rowXml: string, rowStart: number): CellInfo[] {
  return findRanges(rowXml, "w:tc").map((cell) => ({
    ...cell,
    start: rowStart + cell.start,
    end: rowStart + cell.end,
    text: textFromXml(cell.xml),
  }));
}

function parseRows(tableXml: string, tableStart: number): RowInfo[] {
  return findRanges(tableXml, "w:tr").map((rowRange) => {
    const start = tableStart + rowRange.start;
    const end = tableStart + rowRange.end;
    const cells = parseCells(rowRange.xml, start);

    return {
      ...rowRange,
      start,
      end,
      cells,
      text: textFromXml(rowRange.xml),
    };
  });
}

function parseTables(documentXml: string): TableInfo[] {
  return findRanges(documentXml, "w:tbl").map((tableRange) => {
    const rows = parseRows(tableRange.xml, tableRange.start);

    return {
      ...tableRange,
      rows,
      text: textFromXml(tableRange.xml),
    };
  });
}

function replaceInXml(xml: string, ranges: XmlRange[], replacements: string[]): string {
  let output = xml;

  for (let index = ranges.length - 1; index >= 0; index -= 1) {
    output =
      output.slice(0, ranges[index].start) +
      replacements[index] +
      output.slice(ranges[index].end);
  }

  return output;
}

function paragraphXml(value: Primitive): string {
  const lines = normalizeText(value || " ").split("\n");

  return lines
    .map((line) => {
      const safeLine = line.length > 0 ? line : " ";
      return `<w:p>
        <w:pPr>
          <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:lang w:val="pt-BR" w:eastAsia="pt-BR" w:bidi="pt-BR"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(safeLine)}</w:t>
        </w:r>
      </w:p>`;
    })
    .join("");
}

function replaceCellContent(cellXml: string, value: Primitive): string {
  const open = cellXml.match(/<w:tc(?:\s[^>]*)?>/)?.[0] || "<w:tc>";
  const tcPr = cellXml.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/)?.[0] || "";

  return `${open}${tcPr}${paragraphXml(value)}</w:tc>`;
}

function replaceCellsInRow(rowXml: string, values: Array<Primitive | null>): string {
  const cells = findRanges(rowXml, "w:tc");
  let output = rowXml;

  for (let index = cells.length - 1; index >= 0; index -= 1) {
    if (values[index] === null || values[index] === undefined) {
      continue;
    }

    const cell = cells[index];
    output =
      output.slice(0, cell.start) +
      replaceCellContent(cell.xml, values[index]) +
      output.slice(cell.end);
  }

  return output;
}

function clearCellsInRow(rowXml: string): string {
  const cells = findRanges(rowXml, "w:tc");
  return replaceCellsInRow(
    rowXml,
    cells.map(() => ""),
  );
}

function codesOnly(skills: PlanningSkill[]): string {
  return skills
    .slice(0, 3)
    .map((skill) => normalizeText(skill.codigo))
    .filter(Boolean)
    .join("; ");
}

function codesWithShortDescriptions(skills: PlanningSkill[]): string {
  return skills
    .slice(0, 3)
    .map((skill) => {
      const code = normalizeText(skill.codigo);
      const desc = normalizeText(skill.descricao);
      return desc ? `${code} — ${desc}` : code;
    })
    .filter(Boolean)
    .join("\n");
}

function shortText(value: string, max = 260): string {
  const text = normalizeText(value).replace(/\s+/g, " ");

  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function fallbackMatrix(payload: OfficialPlanningPayload): PlanningMatrixItem[] {
  const contents = splitContents(payload.conteudos).length
    ? splitContents(payload.conteudos)
    : splitContents(payload.conteudo);

  const safeContents = contents.length ? contents : ["Conteúdo central"];
  const trimestre = getTrimestre(payload);

  const base = safeContents.map((conteudo, index) => ({
    conteudo,
    trimestre:
      getTipo(payload) === "trimestral"
        ? trimestre
        : Math.min(3, Math.floor((index / safeContents.length) * 3) + 1),
    numeroAula: index + 1,
    periodos: 0,
    aulaInicio: index + 1,
    aulaFim: index + 1,
    habilidades: [],
    objetivos: `Desenvolver aprendizagens relacionadas a ${conteudo}.`,
    metodologia: `Aula dialogada, problematização, prática orientada, registro e socialização das aprendizagens sobre ${conteudo}.`,
    recursos: "Quadro, caderno, material impresso, livro didático e recursos digitais disponíveis.",
    avaliacao: `Avaliação contínua por participação, registros e evidências de aprendizagem sobre ${conteudo}.`,
    evidencias: "Registros, atividades concluídas, respostas orais e escritas e devolutivas do professor.",
  }));

  return finalizeMatrixLessonAllocation(base, payload);
}

function getMatrix(payload: OfficialPlanningPayload): PlanningMatrixItem[] {
  const matrix = payload.matrizPlanejamento?.conteudos;

  if (Array.isArray(matrix) && matrix.length > 0) {
    return finalizeMatrixLessonAllocation(matrix, payload);
  }

  return fallbackMatrix(payload);
}

function expandTableDataRows(
  table: TableInfo,
  header: RowInfo,
  dataRows: RowInfo[],
  itemCount: number,
): { tableXml: string; rows: RowInfo[]; dataRows: RowInfo[] } {
  if (!dataRows.length || itemCount <= dataRows.length) {
    return { tableXml: table.xml, rows: table.rows, dataRows };
  }

  const lastDataRow = dataRows[dataRows.length - 1];
  const extraCount = itemCount - dataRows.length;
  const clonesXml = Array.from({ length: extraCount }, () => lastDataRow.xml).join("");
  const relativeEnd = lastDataRow.end - table.start;
  const tableXml = table.xml.slice(0, relativeEnd) + clonesXml + table.xml.slice(relativeEnd);
  const rows = parseRows(tableXml, table.start);

  return {
    tableXml,
    rows,
    dataRows: rows.filter((row) => isDataRowAfterHeader(row, header)),
  };
}

function unitFor(payload: OfficialPlanningPayload, item: PlanningMatrixItem): string {
  const component = normalizeSearch(getString(payload, ["componenteCurricular", "componente"]));
  const content = normalizeSearch(item.conteudo);

  if (component.includes("lingua portuguesa") || component.includes("portugues")) {
    if (content.includes("texto") || content.includes("dissert") || content.includes("argument")) {
      return "Produção textual e análise linguística";
    }

    if (content.includes("leitura") || content.includes("interpret")) {
      return "Leitura e interpretação";
    }

    return "Leitura, produção textual e oralidade";
  }

  if (component.includes("historia")) {
    return "Tempo, memória, cultura e sociedade";
  }

  if (component.includes("geografia")) {
    return "O sujeito e seu lugar no mundo";
  }

  if (component.includes("matematica")) {
    return "Números, álgebra, geometria e grandezas";
  }

  if (component.includes("ciencias")) {
    return "Matéria, energia, vida e evolução";
  }

  return getString(payload, ["areaConhecimento"], "Unidade temática");
}

function projectText(payload: OfficialPlanningPayload, items: PlanningMatrixItem[]): string {
  const contentList = items.map((item) => item.conteudo).join("; ");
  const custom = getString(payload, ["observacoes"], "");

  return custom || `Integração entre os conteúdos do período (${contentList}) por meio de leitura, pesquisa, produção, socialização, resolução de problemas e participação coletiva.`;
}

function evaluationText(items: PlanningMatrixItem[]): string {
  const unique = Array.from(
    new Set(
      items
        .map((item) => normalizeText(item.avaliacao || item.evidencias))
        .filter(Boolean),
    ),
  );

  return unique.length
    ? unique.join("\n")
    : "Observação contínua, registros, atividades concluídas, participação, produções individuais/coletivas e devolutivas do professor.";
}

function fieldValueForText(text: string, payload: OfficialPlanningPayload): string | null {
  const normalized = normalizeSearch(text);

  if (normalized.includes("escola") || normalized.includes("unidade escolar")) {
    return getString(payload, ["escola"], "Escola não informada");
  }

  if (normalized.includes("professor")) {
    return getString(payload, ["professor"], "Professor(a) não informado(a)");
  }

  if (normalized.includes("componente") || normalized.includes("disciplina")) {
    return getString(payload, ["componenteCurricular", "componente"], "Componente curricular");
  }

  if (normalized.includes("area do conhecimento") || normalized === "area") {
    return getString(payload, ["areaConhecimento"], "Área do conhecimento");
  }

  if (
    normalized.includes("serie") ||
    normalized.includes("ano/turma") ||
    normalized.includes("ano serie") ||
    normalized.includes("turma")
  ) {
    return getString(payload, ["anoSerie", "serie", "ano"], "Ano/Série");
  }

  if (normalized.includes("etapa")) {
    return getString(payload, ["etapa"], "Etapa não informada");
  }

  if (normalized.includes("carga horaria")) {
    return getString(payload, ["cargaHoraria"], "Carga horária");
  }

  if (normalized.includes("trimestre")) {
    return `${getTrimestre(payload)}º trimestre`;
  }

  return null;
}

function fillIdentificationTables(documentXml: string, payload: OfficialPlanningPayload): string {
  const tables = parseTables(documentXml);
  const replacements = tables.map((table) => {
    const rowReplacements = table.rows.map((row) => {
      if (row.cells.length < 2) {
        return row.xml;
      }

      const firstText = row.cells[0]?.text || "";
      const secondText = row.cells[1]?.text || "";
      const byFirst = fieldValueForText(firstText, payload);
      const bySecond = fieldValueForText(secondText, payload);

      if (byFirst) {
        return replaceCellsInRow(row.xml, [null, byFirst]);
      }

      if (bySecond) {
        return replaceCellsInRow(row.xml, [bySecond, null]);
      }

      return row.xml;
    });

    return replaceInXml(
      table.xml,
      table.rows.map((row) => ({
        start: row.start - table.start,
        end: row.end - table.start,
        xml: row.xml,
      })),
      rowReplacements,
    );
  });

  return replaceInXml(documentXml, tables, replacements);
}

function isPlanningHeaderText(text: string): boolean {
  const normalized = normalizeSearch(text);

  return (
    normalized.includes("unidade") &&
    (normalized.includes("objeto") || normalized.includes("conteudo") || normalized.includes("conhec")) &&
    normalized.includes("habilidade") &&
    (normalized.includes("aula") || normalized.includes("carga") || normalized.includes("periodo"))
  );
}

function isAnnualPlanningTable(table: TableInfo): boolean {
  return isPlanningHeaderText(table.text);
}

function trimesterFromTableText(text: string, fallback: number): number {
  const normalized = normalizeSearch(text);

  if (normalized.includes("1 trimestre") || normalized.includes("1º trimestre")) return 1;
  if (normalized.includes("2 trimestre") || normalized.includes("2º trimestre")) return 2;
  if (normalized.includes("3 trimestre") || normalized.includes("3º trimestre")) return 3;

  return Math.min(Math.max(fallback, 1), 3);
}

function findHeaderRow(table: TableInfo): RowInfo {
  const candidates = table.rows
    .map((row) => {
      const text = normalizeSearch(row.text);
      let score = row.cells.length;

      if (text.includes("unidade")) score += 8;
      if (text.includes("objeto") || text.includes("conteudo")) score += 8;
      if (text.includes("habilidade")) score += 8;
      if (text.includes("expectativa") || text.includes("objetivo")) score += 5;
      if (text.includes("aula")) score += 5;
      if (text.includes("carga") || text.includes("periodo")) score += 4;

      return { row, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.row || table.rows[0];
}

function isProjectOrEvaluationRow(row: RowInfo): boolean {
  const text = normalizeSearch(row.text);

  return (
    text.includes("projeto interdisciplinar") ||
    text.includes("temas integradores") ||
    text.includes("tema integrador") ||
    text.includes("instrumento") ||
    text.includes("avaliacao") ||
    text.includes("observacao")
  );
}

function isDataRowAfterHeader(row: RowInfo, header: RowInfo): boolean {
  if (row.start <= header.start) {
    return false;
  }

  if (isProjectOrEvaluationRow(row)) {
    return false;
  }

  return row.cells.length >= Math.max(3, Math.min(header.cells.length, 6));
}

function classifyColumn(headerText: string, index: number): string {
  const text = normalizeSearch(headerText);

  if (text.includes("unidade")) return "unidade";
  if (text.includes("objeto") || text.includes("conteudo") || text.includes("conhec")) return "conteudo";
  if (text.includes("habilidade")) return "habilidades";
  if (text.includes("expectativa") || text.includes("objetivo")) return "expectativas";
  if (text.includes("carga") || text.includes("periodo")) return "carga";
  if (text.includes("aula")) return "aula";
  if (text.includes("metodologia") || text.includes("procedimento")) return "metodologia";
  if (text.includes("recurso")) return "recursos";
  if (text.includes("avaliacao") || text.includes("evidencia")) return "avaliacao";

  const fallback = ["unidade", "conteudo", "habilidades", "expectativas", "carga", "aula"];
  return fallback[index] || "extra";
}

function valuesForPlanningRow(
  payload: OfficialPlanningPayload,
  item: PlanningMatrixItem,
  headerCells: CellInfo[],
  compactSkills: boolean,
): Array<string | null> {
  return headerCells.map((cell, index) => {
    const kind = classifyColumn(cell.text, index);

    switch (kind) {
      case "unidade":
        return unitFor(payload, item);
      case "conteudo":
        return item.conteudo;
      case "habilidades":
        return codesWithShortDescriptions(item.habilidades);
      case "expectativas":
        return shortText(item.objetivos, 320);
      case "carga":
        return formatMatrixPeriodosLabel(item);
      case "aula":
        return formatMatrixAulaLabel(item);
      case "metodologia":
        return shortText(item.metodologia, 360);
      case "recursos":
        return shortText(item.recursos, 260);
      case "avaliacao":
        return shortText(`${item.evidencias}\n${item.avaliacao}`, 360);
      default:
        return "";
    }
  });
}

function fillProjectAndEvaluationRows(
  row: RowInfo,
  items: PlanningMatrixItem[],
  payload: OfficialPlanningPayload,
): string {
  const text = normalizeSearch(row.text);

  let value: string | null = null;

  if (
    text.includes("projeto interdisciplinar") ||
    text.includes("temas integradores") ||
    text.includes("tema integrador") ||
    text.includes("observacao")
  ) {
    value = projectText(payload, items);
  }

  if (text.includes("instrumento") || text.includes("avaliacao")) {
    value = evaluationText(items);
  }

  if (!value) {
    return row.xml;
  }

  if (row.cells.length >= 2) {
    return replaceCellsInRow(row.xml, [null, value]);
  }

  return replaceCellsInRow(row.xml, [value]);
}

function fillAnnualPlanningTables(documentXml: string, payload: OfficialPlanningPayload): string {
  const matrix = getMatrix(payload);
  const tables = parseTables(documentXml);
  const annualTables = tables.filter(isAnnualPlanningTable);

  if (annualTables.length === 0) {
    throw new Error(
      "Não localizei no modelo anual a tabela com Unidade Temática, Objetos de Conhecimento, Habilidades, Previsão de carga horária e Aula nº.",
    );
  }

  const replacements = annualTables.map((table, tableIndex) => {
    const trimester = trimesterFromTableText(table.text, tableIndex + 1);
    const header = findHeaderRow(table);
    const initialDataRows = table.rows.filter((row) => isDataRowAfterHeader(row, header));
    const items = extractAnnualItemsForTrimester(matrix, trimester);
    const expanded = expandTableDataRows(table, header, initialDataRows, items.length);
    const dataRows = expanded.dataRows;

    const rowReplacements = expanded.rows.map((row) => {
      const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

      if (dataIndex >= 0) {
        const item = items[dataIndex];

        if (!item) {
          return clearCellsInRow(row.xml);
        }

        return replaceCellsInRow(row.xml, valuesForPlanningRow(payload, item, header.cells, true));
      }

      if (row.start > header.start && isProjectOrEvaluationRow(row)) {
        return fillProjectAndEvaluationRows(row, items, payload);
      }

      return row.xml;
    });

    return replaceInXml(
      expanded.tableXml,
      expanded.rows.map((row) => ({
        start: row.start - table.start,
        end: row.end - table.start,
        xml: row.xml,
      })),
      rowReplacements,
    );
  });

  return replaceInXml(documentXml, annualTables, replacements);
}

function isTrimestralPlanningTable(table: TableInfo): boolean {
  const text = normalizeSearch(table.text);

  return (
    (text.includes("objeto") || text.includes("conteudo") || text.includes("conhec")) &&
    text.includes("habilidade") &&
    (text.includes("metodologia") ||
      text.includes("procedimento") ||
      text.includes("recurso") ||
      text.includes("avaliacao") ||
      text.includes("evidencia") ||
      text.includes("aula") ||
      text.includes("expectativa"))
  );
}

function chooseTrimestralPlanningTable(tables: TableInfo[]): TableInfo | null {
  const candidates = tables
    .filter(isTrimestralPlanningTable)
    .map((table) => ({
      table,
      score:
        table.rows.length +
        Math.max(0, ...table.rows.map((row) => row.cells.length)) +
        (normalizeSearch(table.text).includes("habilidade") ? 10 : 0) +
        (normalizeSearch(table.text).includes("objeto") ? 8 : 0) +
        (normalizeSearch(table.text).includes("metodologia") ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.table || null;
}

function labelValue(label: string, item: PlanningMatrixItem, payload: OfficialPlanningPayload): string | null {
  const text = normalizeSearch(label);

  if (text.includes("trimestre") && text.includes("aula")) {
    return `${getTrimestre(payload)}º trimestre — Aula ${formatMatrixAulaLabel(item)} · ${formatMatrixPeriodosLabel(item)}`;
  }

  if (text.includes("aula")) {
    return formatMatrixAulaLabel(item);
  }

  if (text.includes("carga") || text.includes("periodo")) {
    return formatMatrixPeriodosLabel(item);
  }

  if (text.includes("unidade")) {
    return unitFor(payload, item);
  }

  if (text.includes("objeto") || text.includes("conteudo") || text.includes("conhecimento")) {
    return item.conteudo;
  }

  if (text.includes("habilidade")) {
    return codesWithShortDescriptions(item.habilidades);
  }

  if (text.includes("objetivo") || text.includes("expectativa")) {
    return item.objetivos;
  }

  if (text.includes("metodologia") || text.includes("procedimento") || text.includes("etapa")) {
    return item.metodologia;
  }

  if (text.includes("recurso")) {
    return item.recursos;
  }

  if (text.includes("avaliacao") || text.includes("evidencia") || text.includes("instrumento")) {
    return `${item.evidencias}\n${item.avaliacao}`;
  }

  if (text.includes("projeto interdisciplinar") || text.includes("tema integrador") || text.includes("temas integradores")) {
    return projectText(payload, [item]);
  }

  return null;
}

function fillLabelRow(row: RowInfo, item: PlanningMatrixItem, payload: OfficialPlanningPayload): string {
  if (row.cells.length === 1) {
    const value = labelValue(row.cells[0]?.text || "", item, payload);

    return value ? replaceCellsInRow(row.xml, [value]) : row.xml;
  }

  if (row.cells.length >= 2) {
    const leftText = row.cells[0]?.text || "";
    const rightText = row.cells[1]?.text || "";
    const byLeft = labelValue(leftText, item, payload);
    const byRight = labelValue(rightText, item, payload);

    if (byLeft) {
      return replaceCellsInRow(row.xml, [null, byLeft]);
    }

    if (byRight) {
      return replaceCellsInRow(row.xml, [byRight, null]);
    }
  }

  return row.xml;
}

function fillOneTrimestralTable(
  table: TableInfo,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  const header = findHeaderRow(table);
  const hasColumnHeader = isPlanningHeaderText(header.text);
  const dataRows = hasColumnHeader
    ? table.rows.filter((row) => isDataRowAfterHeader(row, header))
    : [];

  const rowReplacements = table.rows.map((row) => {
    const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

    if (dataIndex === 0) {
      return replaceCellsInRow(row.xml, valuesForPlanningRow(payload, item, header.cells, false));
    }

    if (dataIndex > 0) {
      return clearCellsInRow(row.xml);
    }

    if (row.start > header.start && isProjectOrEvaluationRow(row)) {
      return fillProjectAndEvaluationRows(row, [item], payload);
    }

    return fillLabelRow(row, item, payload);
  });

  return replaceInXml(
    table.xml,
    table.rows.map((row) => ({
      start: row.start - table.start,
      end: row.end - table.start,
      xml: row.xml,
    })),
    rowReplacements,
  );
}

function resolveTrimestralMatrixItems(
  matrix: PlanningMatrixItem[],
  trimester: number,
): PlanningMatrixItem[] {
  const markedTrimesters = new Set(
    matrix
      .map((item) => Number(item.trimestre))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3),
  );

  // Matriz já extraída de um único trimestre (pacote anual + trimestres no editor).
  if (markedTrimesters.size === 1) {
    return matrix;
  }

  return extractAnnualItemsForTrimester(matrix, trimester);
}

function fillTrimestralPlanningTable(documentXml: string, payload: OfficialPlanningPayload): string {
  const matrix = getMatrix(payload);
  const trimester = getTrimestre(payload);
  const baseItems = resolveTrimestralMatrixItems(matrix, trimester);

  const tables = parseTables(documentXml);
  const table = chooseTrimestralPlanningTable(tables);

  if (!table) {
    throw new Error(
      "Não localizei no modelo trimestral a tabela de Objetos de Conhecimento, Habilidades, Metodologia, Recursos e Avaliação.",
    );
  }

  const filledTables = baseItems
    .map((item) => fillOneTrimestralTable(table, item, payload))
    .join("<w:p><w:r><w:t xml:space=\"preserve\"> </w:t></w:r></w:p>");

  return documentXml.slice(0, table.start) + filledTables + documentXml.slice(table.end);
}

function removeRedInstructionFormatting(documentXml: string): string {
  return documentXml
    .replace(/<w:color w:val="FF0000"\s*\/>/gi, "")
    .replace(/<w:color w:val="C00000"\s*\/>/gi, "")
    .replace(/<w:highlight w:val="red"\s*\/>/gi, "");
}

function replaceKnownOldSchoolName(documentXml: string, payload: OfficialPlanningPayload): string {
  const escola = getString(payload, ["escola"], "");

  if (!escola) {
    return documentXml;
  }

  return documentXml
    .replace(/COL[ÉE]GIO\s+ESTADUAL\s+PADRE\s+WERNER/gi, escapeXml(escola))
    .replace(/COL&Eacute;GIO\s+ESTADUAL\s+PADRE\s+WERNER/gi, escapeXml(escola));
}

function fillOfficialTemplateXml(documentXml: string, payload: OfficialPlanningPayload): string {
  let output = documentXml;

  output = fillIdentificationTables(output, payload);

  if (getTipo(payload) === "trimestral") {
    output = fillTrimestralPlanningTable(output, payload);
  } else {
    output = fillAnnualPlanningTables(output, payload);
  }

  output = replaceKnownOldSchoolName(output, payload);
  output = removeRedInstructionFormatting(output);

  return output;
}

export function getOfficialPlanningFilename(payload: OfficialPlanningPayload): string {
  const tipo = getTipo(payload);
  const componente = getString(payload, ["componenteCurricular", "componente"], "planejamento");
  const anoSerie = getString(payload, ["anoSerie", "serie", "ano"], "");

  const raw =
    tipo === "trimestral"
      ? `planejamento-trimestral-${getTrimestre(payload)}-${componente}-${anoSerie}`
      : `planejamento-anual-${componente}-${anoSerie}`;

  return (
    raw
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 90) || "planejamento-planify"
  );
}

export function buildOfficialPlanningDocx(payload: OfficialPlanningPayload): Buffer {
  if (!payload.matrizPlanejamento?.conteudos?.length) {
    throw new Error(
      "Gere o planejamento com IA antes de exportar. O Planify não preenche o modelo oficial sem matriz pedagógica.",
    );
  }

  const tipo = getTipo(payload);
  const templatePath = getOfficialTemplatePath(tipo);
  const templateBuffer = fs.readFileSync(templatePath);
  const entries = new Map<string, Buffer | string>(readZip(templateBuffer));
  const documentXml = entries.get("word/document.xml");

  if (!documentXml) {
    throw new Error("Modelo oficial inválido: word/document.xml não encontrado.");
  }

  const originalXml = Buffer.isBuffer(documentXml)
    ? documentXml.toString("utf8")
    : String(documentXml);

  entries.set("word/document.xml", fillOfficialTemplateXml(originalXml, payload));

  return buildZipFromEntries(entries);
}
