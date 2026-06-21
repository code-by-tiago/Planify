import fs from "node:fs";
import path from "node:path";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PlanningAiResult, PlanningMatrixItem, PlanningSkill } from "./planning-ai-service";
import { extractAnnualItemsForTrimester } from "@/lib/planejamentos/planning-trimestral-from-annual";
import {
  enrichTrimestralMatrixItem,
  formatExperienciasAprendizagem,
  formatMateriaisRecursosNecessarios,
} from "@/lib/planejamentos/planning-trimestral-fields";
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
  turma?: string;
  className?: string;
  etapa?: string;
  anoSerie?: string;
  serie?: string;
  ano?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  componente?: string;
  cargaHoraria?: string | number;
  cargaHorariaAnual?: string | number;
  cargaHorariaTrimestral?: string | number;
  cargaHorariaSemanal?: string | number;
  periodoDesenvolvimento?: string;
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

export function getOfficialPlanningTipo(
  payload: OfficialPlanningPayload,
): "anual" | "trimestral" {
  const value = normalizeSearch(
    payload.tipoPlanejamento || payload.tipo || payload.modo || "anual",
  );

  return value.includes("tri") ? "trimestral" : "anual";
}

function getTipo(payload: OfficialPlanningPayload): "anual" | "trimestral" {
  return getOfficialPlanningTipo(payload);
}

function inferTrimestreFromDocumentType(documentType?: string | null): number | null {
  const type = String(documentType || "").toLowerCase();
  const match = type.match(/trimestral[_:-]?([123])/) || type.match(/trimestre[_:-]?([123])/);
  const parsed = match ? Number(match[1]) : NaN;

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 3 ? parsed : null;
}

/** Garante tipo/trimestre corretos quando documentType ou id da aba indicam trimestral. */
export function normalizeOfficialPlanningPayload(
  payload: OfficialPlanningPayload,
  documentType?: string | null,
  documentId?: string | null,
): OfficialPlanningPayload {
  const normalized: OfficialPlanningPayload = { ...payload };
  const type = String(documentType || "").toLowerCase();
  const id = String(documentId || "").toLowerCase();

  if (
    type.includes("trimestral") ||
    type.includes("trimestre") ||
    /_trim[123]\b/.test(id) ||
    /\btrim[123]\b/.test(id)
  ) {
    normalized.tipoPlanejamento = "trimestral";
  } else if (type.includes("anual") && !type.includes("trimestral")) {
    if (!normalizeSearch(normalized.tipoPlanejamento || normalized.tipo || "").includes("tri")) {
      normalized.tipoPlanejamento = "anual";
    }
  }

  if (getOfficialPlanningTipo(normalized) === "trimestral") {
    const fromType = inferTrimestreFromDocumentType(documentType);
    const fromId =
      id.match(/_trim([123])\b/)?.[1] || id.match(/\btrim([123])\b/)?.[1];
    const parsed = Number(fromId || fromType || normalized.trimestre);

    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 3) {
      normalized.trimestre = parsed;
    }
  }

  return normalized;
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

function replaceParagraphContent(paragraphXml: string, value: Primitive): string {
  const open = paragraphXml.match(/<w:p(?:\s[^>]*)?>/)?.[0] || "<w:p>";
  const pPr = paragraphXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] || "";
  const rPr = paragraphXml.match(/<w:rPr[\s\S]*?<\/w:rPr>/)?.[0] || "";

  return `${open}${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(
    value,
  )}</w:t></w:r></w:p>`;
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

function totalPeriodos(items: PlanningMatrixItem[]): number {
  return items.reduce((total, item) => {
    const periodos = Number(item.periodos);
    return total + (Number.isFinite(periodos) && periodos > 0 ? periodos : 1);
  }, 0);
}

function formatPeriodos(total: number): string {
  const safeTotal = Math.max(1, Math.round(total));
  return safeTotal === 1 ? "1 período" : `${safeTotal} períodos`;
}

function annualCargaHoraria(payload: OfficialPlanningPayload): string {
  return (
    getString(payload, ["cargaHorariaAnual", "cargaHoraria"], "") ||
    formatPeriodos(totalPeriodos(getMatrix(payload)))
  );
}

function trimestralCargaHoraria(payload: OfficialPlanningPayload): string {
  const explicit = getString(payload, ["cargaHorariaTrimestral"], "");
  if (explicit) return explicit;

  const matrix = getMatrix(payload);
  const total =
    getTipo(payload) === "trimestral"
      ? totalPeriodos(matrix)
      : Math.max(1, Math.ceil(totalPeriodos(matrix) / 3));

  return formatPeriodos(total);
}

function semanalCargaHoraria(payload: OfficialPlanningPayload): string {
  const explicit = getString(payload, ["cargaHorariaSemanal"], "");
  if (explicit) return explicit;

  return formatPeriodos(
    Math.max(1, Math.round(parseNumber(trimestralCargaHoraria(payload), 13) / 13)),
  );
}

function periodoDesenvolvimento(payload: OfficialPlanningPayload): string {
  return (
    getString(payload, ["periodoDesenvolvimento"], "") ||
    `${getTrimestre(payload)}º trimestre`
  );
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

  if (normalized.includes("turma")) {
    return getString(payload, ["turma", "className", "anoSerie", "serie", "ano"], "Turma");
  }

  if (
    normalized.includes("serie") ||
    normalized.includes("ano/turma") ||
    normalized.includes("ano serie")
  ) {
    return getString(payload, ["anoSerie", "serie", "ano"], "Ano/Série");
  }

  if (normalized === "etapa" || normalized.includes("etapa de ensino")) {
    return getString(payload, ["etapa"], "Etapa não informada");
  }

  if (normalized.includes("periodo de desenvolvimento")) {
    return periodoDesenvolvimento(payload);
  }

  if (normalized.includes("carga horaria anual")) {
    return annualCargaHoraria(payload);
  }

  if (normalized.includes("carga horaria trimestral")) {
    return trimestralCargaHoraria(payload);
  }

  if (normalized.includes("carga horaria semanal")) {
    return semanalCargaHoraria(payload);
  }

  if (normalized === "carga horaria") {
    return getString(payload, ["cargaHoraria"], "Carga horária");
  }

  if (normalized === "trimestre") {
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

      const values: Array<Primitive | null> = row.cells.map(() => null);
      let filled = false;

      for (let index = 0; index < row.cells.length - 1; index += 1) {
        const value = fieldValueForText(row.cells[index]?.text || "", payload);
        const nextLooksLikeLabel = Boolean(
          fieldValueForText(row.cells[index + 1]?.text || "", payload),
        );

        if (value && !nextLooksLikeLabel) {
          values[index + 1] = value;
          filled = true;
        }
      }

      return filled ? replaceCellsInRow(row.xml, values) : row.xml;
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

/** Preenche os títulos livres do modelo trimestral atualizado sem tocar no layout. */
function fillStandaloneTemplateTokens(
  documentXml: string,
  payload: OfficialPlanningPayload,
): string {
  const paragraphs = findRanges(documentXml, "w:p");
  const escola = getString(payload, ["escola"], "Escola não informada");
  const area = getString(payload, ["areaConhecimento"], "Área do conhecimento");
  const replacements = paragraphs.map((paragraph) => {
    const text = normalizeSearch(textFromXml(paragraph.xml));

    if (text === "[nome da escola]") {
      return replaceParagraphContent(paragraph.xml, escola);
    }

    if (text === "[area de conhecimento]") {
      return replaceParagraphContent(paragraph.xml, area);
    }

    return paragraph.xml;
  });

  return replaceInXml(documentXml, paragraphs, replacements);
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
    let supportingMode: "project" | "evaluation" | null = null;

    const rowReplacements = expanded.rows.map((row) => {
      const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

      if (dataIndex >= 0) {
        const item = items[dataIndex];

        if (!item) {
          return clearCellsInRow(row.xml);
        }

        return replaceCellsInRow(row.xml, valuesForPlanningRow(payload, item, header.cells, true));
      }

      if (row.start > header.start) {
        const text = normalizeSearch(row.text);

        if (text.includes("[")) {
          const value =
            text.includes("instrumento") || text.includes("avaliacao")
              ? evaluationText(items)
              : projectText(payload, items);
          supportingMode = null;

          return replaceCellsInRow(
            row.xml,
            row.cells.map((_, index) =>
              index === row.cells.length - 1 ? value : null,
            ),
          );
        }

        if (
          text.includes("projeto interdisciplinar") ||
          text.includes("temas integradores") ||
          text.includes("tema integrador")
        ) {
          supportingMode = "project";
          return row.xml;
        }

        if (text.includes("instrumento") || text.includes("avaliacao")) {
          supportingMode = "evaluation";
          return row.xml;
        }

        if (supportingMode && !text) {
          const value =
            supportingMode === "project"
              ? projectText(payload, items)
              : evaluationText(items);
          supportingMode = null;

          return replaceCellsInRow(
            row.xml,
            row.cells.map((_, index) =>
              index === row.cells.length - 1 ? value : null,
            ),
          );
        }
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

function trimestralMatrixItem(item: PlanningMatrixItem): PlanningMatrixItem {
  return enrichTrimestralMatrixItem(item);
}

function labelValue(label: string, item: PlanningMatrixItem, payload: OfficialPlanningPayload): string | null {
  const text = normalizeSearch(label);
  const trimItem = trimestralMatrixItem(item);

  if (text.includes("trimestre") && text.includes("aula")) {
    return `${getTrimestre(payload)}º trimestre - Aula nº ${formatMatrixAulaLabel(trimItem)}`;
  }

  if (text.includes("aula")) {
    return formatMatrixAulaLabel(trimItem);
  }

  if (text.includes("carga") || text.includes("periodo")) {
    return formatMatrixPeriodosLabel(trimItem);
  }

  if (text.includes("unidade")) {
    return unitFor(payload, trimItem);
  }

  if (text.includes("objeto") || text.includes("conteudo") || text.includes("conhecimento")) {
    return trimItem.conteudo;
  }

  if (text.includes("habilidade")) {
    return codesWithShortDescriptions(trimItem.habilidades);
  }

  if (text.includes("expectativa")) {
    return trimItem.objetivos;
  }

  if (text.includes("objetivo") && !text.includes("expectativa")) {
    return trimItem.objetivos;
  }

  if (text.includes("experiencia") && text.includes("aprendizagem")) {
    return formatExperienciasAprendizagem(trimItem);
  }

  if (text.includes("organizacao") && text.includes("metodologia")) {
    return trimItem.metodologia;
  }

  if (text.includes("metodologia") || text.includes("procedimento")) {
    return trimItem.metodologia;
  }

  if (text.includes("materiais") && text.includes("recursos")) {
    return formatMateriaisRecursosNecessarios(trimItem);
  }

  if (text.includes("materiais")) {
    return trimItem.materiais || "";
  }

  if (text.includes("recursos")) {
    return trimItem.recursos;
  }

  if (text.includes("momento") || text.includes("etapa")) {
    return trimItem.etapas || "";
  }

  if (text.includes("evidencia")) {
    return trimItem.evidencias;
  }

  if (text.includes("instrumento") || text.includes("avaliacao")) {
    return trimItem.avaliacao;
  }

  if (text.includes("projeto interdisciplinar") || text.includes("tema integrador") || text.includes("temas integradores")) {
    return projectText(payload, [trimItem]);
  }

  return null;
}

/**
 * Rótulo da experiência no modelo trimestral atualizado. Cada aula ocupa uma
 * única linha da grade, mantendo a semana e a carga horária lado a lado com
 * os cinco campos pedagógicos da própria aula.
 */
function trimestralSemanaLabel(item: PlanningMatrixItem): string {
  const periodos = Math.max(
    1,
    Number(item.periodos) || Number(item.aulaFim) - Number(item.aulaInicio) + 1 || 1,
  );
  const periodoLabel = periodos === 1 ? "período" : "períodos";

  return `Semana ${formatMatrixAulaLabel(item)} (${periodos} ${periodoLabel})`;
}

function isUpdatedTrimestralExperienceHeader(row: RowInfo): boolean {
  if (row.cells.length < 6) return false;

  const headers = row.cells.map((cell) => normalizeSearch(cell.text));

  return (
    headers[1]?.includes("metodologia") &&
    headers[2]?.includes("materiais") &&
    (headers[3]?.includes("etapa") || headers[3]?.includes("momento")) &&
    headers[4]?.includes("evidencia") &&
    (headers[5]?.includes("instrumento") || headers[5]?.includes("avaliacao"))
  );
}

function isUpdatedTrimestralExperienceDataRow(row: RowInfo): boolean {
  if (row.cells.length < 6 || isUpdatedTrimestralExperienceHeader(row)) {
    return false;
  }

  return normalizeSearch(row.cells[0]?.text || "").includes("semana");
}

function updatedTrimestralExperienceValues(
  item: PlanningMatrixItem,
): Array<Primitive | null> {
  const trimItem = trimestralMatrixItem(item);

  return [
    trimestralSemanaLabel(trimItem),
    shortText(trimItem.metodologia, 520),
    shortText(formatMateriaisRecursosNecessarios(trimItem), 520),
    shortText(trimItem.etapas || trimItem.metodologia, 520),
    shortText(trimItem.evidencias, 520),
    shortText(trimItem.avaliacao, 520),
  ];
}

function fillTrimestralLabelRow(
  row: RowInfo,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  const cellCount = row.cells.length;

  if (isUpdatedTrimestralExperienceDataRow(row)) {
    return replaceCellsInRow(row.xml, updatedTrimestralExperienceValues(item));
  }

  if (cellCount === 1) {
    const value = labelValue(row.cells[0]?.text || "", item, payload);
    return value ? replaceCellsInRow(row.xml, [value]) : row.xml;
  }

  if (cellCount === 2) {
    const value = labelValue(row.cells[0]?.text || "", item, payload);
    return value ? replaceCellsInRow(row.xml, [null, value]) : row.xml;
  }

  if (cellCount === 4) {
    const values: Array<Primitive | null> = [null, null, null, null];
    const leftValue = labelValue(row.cells[0]?.text || "", item, payload);
    const rightValue = labelValue(row.cells[2]?.text || "", item, payload);

    if (leftValue) values[1] = leftValue;
    if (rightValue) values[3] = rightValue;

    if (leftValue || rightValue) {
      return replaceCellsInRow(row.xml, values);
    }

    return row.xml;
  }

  if (cellCount >= 6) {
    const label = row.cells[0]?.text || "";
    const rowText = normalizeSearch(row.text);

    if (!label.trim() && rowText.includes("semana")) {
      const trimItem = trimestralMatrixItem(item);
      const periodos = Math.max(1, Number(trimItem.periodos) || 1);
      const periodoLabel = periodos === 1 ? "período" : "períodos";
      const values = row.cells.map((_, index) =>
        index === 0 ? `Semana 1 (${periodos} ${periodoLabel})` : null,
      );
      return replaceCellsInRow(row.xml, values);
    }

    const value = labelValue(label, item, payload);

    if (!value) {
      return row.xml;
    }

    const values = row.cells.map((_, index) => (index === 1 ? value : null));
    return replaceCellsInRow(row.xml, values);
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

    return fillTrimestralLabelRow(row, item, payload);
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

function isTrimestralLessonDetailsTable(table: TableInfo): boolean {
  const text = normalizeSearch(table.text);

  return (
    (text.includes("objeto") || text.includes("conteudo") || text.includes("conhecimento")) &&
    text.includes("habilidade") &&
    text.includes("expectativa")
  );
}

function isTrimestralExperienceTable(table: TableInfo): boolean {
  const text = normalizeSearch(table.text);

  return (
    text.includes("experiencia") &&
    (text.includes("organizacao") || text.includes("metodologia")) &&
    text.includes("materiais") &&
    text.includes("evidencia") &&
    (text.includes("momento") || text.includes("etapa"))
  );
}

function isTrimestralProjectTable(table: TableInfo): boolean {
  const text = normalizeSearch(table.text);
  return text.includes("projeto interdisciplinar") || text.includes("temas integradores");
}

function weeklySteps(item: PlanningMatrixItem, weeks: number): string[] {
  const trimItem = trimestralMatrixItem(item);
  const steps = String(trimItem.etapas || "")
    .split(/\n+/)
    .map((step) => step.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  const fallback = shortText(trimItem.metodologia, 220);

  return Array.from(
    { length: weeks },
    (_, index) => steps[index] || steps[steps.length - 1] || fallback,
  );
}

function fillTrimestralExperienceTable(
  table: TableInfo,
  item: PlanningMatrixItem,
): string {
  const trimItem = trimestralMatrixItem(item);

  const rowReplacements = table.rows.map((row) => {
    if (isUpdatedTrimestralExperienceDataRow(row)) {
      return replaceCellsInRow(row.xml, updatedTrimestralExperienceValues(trimItem));
    }

    if (row.cells.length < 6) {
      return row.xml;
    }

    const text = normalizeSearch(row.text);
    const label = normalizeSearch(row.cells[0]?.text || "");
    const weeks = row.cells.length - 1;
    const values: Array<Primitive | null> = row.cells.map(() => null);

    if (!label && text.includes("semana")) {
      for (let week = 1; week <= weeks; week += 1) {
        values[week] = `Semana ${week}\nAula ${formatMatrixAulaLabel(trimItem)}`;
      }
      return replaceCellsInRow(row.xml, values);
    }

    let weeklyContent: string[] | null = null;

    if (label.includes("organizacao") || label.includes("metodologia")) {
      weeklyContent = Array.from({ length: weeks }, () => shortText(trimItem.metodologia, 220));
    } else if (label.includes("materiais") || label.includes("recursos")) {
      weeklyContent = Array.from({ length: weeks }, () =>
        shortText(formatMateriaisRecursosNecessarios(trimItem), 220),
      );
    } else if (label.includes("momento") || label.includes("etapa")) {
      weeklyContent = weeklySteps(trimItem, weeks);
    } else if (label.includes("evidencia")) {
      weeklyContent = Array.from({ length: weeks }, () => shortText(trimItem.evidencias, 220));
    } else if (label.includes("instrumento") || label.includes("avaliacao")) {
      weeklyContent = Array.from({ length: weeks }, () => shortText(trimItem.avaliacao, 220));
    }

    if (!weeklyContent) {
      return row.xml;
    }

    weeklyContent.forEach((value, index) => {
      values[index + 1] = value;
    });
    return replaceCellsInRow(row.xml, values);
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

function fillTrimestralProjectTable(
  table: TableInfo,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  let projectFilled = false;
  let evaluationLabelFilled = false;

  const rowReplacements = table.rows.map((row) => {
    const text = normalizeSearch(row.text);

    if (text.includes("[") || text.includes("descreva")) {
      projectFilled = true;
      return replaceCellsInRow(row.xml, [projectText(payload, [item])]);
    }

    if (!text && projectFilled && !evaluationLabelFilled) {
      evaluationLabelFilled = true;
      return replaceCellsInRow(row.xml, ["Instrumentos de avaliação"]);
    }

    if (!text && evaluationLabelFilled) {
      return replaceCellsInRow(row.xml, [evaluationText([item])]);
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
}

function fillReferenceTrimestralTemplate(
  documentXml: string,
  tables: TableInfo[],
  items: PlanningMatrixItem[],
  payload: OfficialPlanningPayload,
): string | null {
  const lessonTable = tables.find(isTrimestralLessonDetailsTable);
  const experienceTable = tables.find(isTrimestralExperienceTable);
  const projectTable = tables.find(isTrimestralProjectTable);

  if (
    !lessonTable ||
    !experienceTable ||
    !projectTable ||
    lessonTable.start >= experienceTable.start ||
    experienceTable.start >= projectTable.start
  ) {
    return null;
  }

  const betweenLessonAndExperience = documentXml.slice(lessonTable.end, experienceTable.start);
  const betweenExperienceAndProject = documentXml.slice(experienceTable.end, projectTable.start);
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const filledBlocks = items
    .map((item, index) => {
      const block = [
        fillOneTrimestralTable(lessonTable, item, payload),
        betweenLessonAndExperience,
        fillTrimestralExperienceTable(experienceTable, item),
        betweenExperienceAndProject,
        fillTrimestralProjectTable(projectTable, item, payload),
      ].join("");

      return index < items.length - 1 ? `${block}${pageBreak}` : block;
    })
    .join("");

  return documentXml.slice(0, lessonTable.start) + filledBlocks + documentXml.slice(projectTable.end);
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
  const referenceFilled = fillReferenceTrimestralTemplate(
    documentXml,
    tables,
    baseItems,
    payload,
  );

  if (referenceFilled) {
    return referenceFilled;
  }

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
  output = fillStandaloneTemplateTokens(output, payload);

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

export function buildOfficialPlanningDocx(
  payload: OfficialPlanningPayload,
  options?: { documentType?: string | null; documentId?: string | null },
): Buffer {
  const normalizedPayload = normalizeOfficialPlanningPayload(
    payload,
    options?.documentType,
    options?.documentId,
  );

  if (!normalizedPayload.matrizPlanejamento?.conteudos?.length) {
    throw new Error(
      "Gere o planejamento com IA antes de exportar. O Planify não preenche o modelo oficial sem matriz pedagógica.",
    );
  }

  const tipo = getTipo(normalizedPayload);
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

  entries.set(
    "word/document.xml",
    fillOfficialTemplateXml(originalXml, normalizedPayload),
  );

  return buildZipFromEntries(entries);
}
