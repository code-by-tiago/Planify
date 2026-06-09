import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PlanningMatrixItem, PlanningSkill } from "./planning-ai-service";
import type { OfficialPlanningPayload } from "./official-planning-docx";
import {
  finalizeMatrixLessonAllocation,
  formatMatrixAulaLabel,
  formatMatrixPeriodosLabel,
} from "./planning-lesson-allocation";

type Primitive = string | number | boolean | null | undefined;
type UnknownRecord = Record<string, unknown>;

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

export type UniversalFillStats = {
  placeholdersReplaced: number;
  labelFills: number;
  planningRowsFilled: number;
  hasPlaceholders: boolean;
};

export type UniversalFillResult = {
  success: boolean;
  documentXml: string;
  stats: UniversalFillStats;
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

function getMatrix(payload: OfficialPlanningPayload): PlanningMatrixItem[] {
  const matrix = payload.matrizPlanejamento?.conteudos;

  if (Array.isArray(matrix) && matrix.length > 0) {
    return finalizeMatrixLessonAllocation(matrix, payload);
  }

  const contents = splitContents(payload.conteudos).length
    ? splitContents(payload.conteudos)
    : splitContents(payload.conteudo);

  const base = (contents.length ? contents : ["Conteúdo central"]).map((conteudo, index) => ({
    conteudo,
    trimestre: getTrimestre(payload),
    numeroAula: index + 1,
    periodos: 0,
    aulaInicio: index + 1,
    aulaFim: index + 1,
    habilidades: [],
    objetivos: getString(payload, ["objetivosGerais", "objetivos"], ""),
    metodologia: "",
    recursos: "",
    avaliacao: "",
    evidencias: "",
  }));

  return finalizeMatrixLessonAllocation(base, payload);
}

function codesWithShortDescriptions(skills: PlanningSkill[]): string {
  return skills
    .slice(0, 6)
    .map((skill) => {
      const code = normalizeText(skill.codigo);
      const desc = normalizeText(skill.descricao);
      return desc ? `${code} — ${desc}` : code;
    })
    .filter(Boolean)
    .join("\n");
}

function uniqueLines(values: string[]): string {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean))).join(
    "\n",
  );
}

function aggregateMatrixField(
  matrix: PlanningMatrixItem[],
  field: keyof Pick<
    PlanningMatrixItem,
    "conteudo" | "objetivos" | "metodologia" | "recursos" | "avaliacao" | "evidencias"
  >,
): string {
  return uniqueLines(matrix.map((item) => normalizeText(item[field])));
}

function aggregateSkills(matrix: PlanningMatrixItem[]): string {
  const seen = new Set<string>();
  const skills: PlanningSkill[] = [];

  for (const item of matrix) {
    for (const skill of item.habilidades || []) {
      const key = normalizeSearch(skill.codigo || skill.descricao || "");

      if (!key || seen.has(key)) {
        continue;
      }

      seen.add(key);
      skills.push(skill);
    }
  }

  return codesWithShortDescriptions(skills);
}

function buildCronograma(matrix: PlanningMatrixItem[], payload: OfficialPlanningPayload): string {
  const trimestre = getTrimestre(payload);

  return matrix
    .map((item) => {
      const period =
        getTipo(payload) === "trimestral"
          ? `${trimestre}º trimestre`
          : `${Number(item.trimestre) || trimestre}º trimestre`;

      return `${period} · Aulas ${item.aulaInicio} a ${item.aulaFim}: ${item.conteudo}`;
    })
    .join("\n");
}

function buildPlaceholderMap(payload: OfficialPlanningPayload): Record<string, string> {
  const matrix = getMatrix(payload);
  const trimestre = getTrimestre(payload);

  return {
    ESCOLA: getString(payload, ["escola"], ""),
    PROFESSOR: getString(payload, ["professor"], ""),
    COMPONENTE: getString(payload, ["componenteCurricular", "componente"], ""),
    DISCIPLINA: getString(payload, ["componenteCurricular", "componente"], ""),
    ANO_SERIE: getString(payload, ["anoSerie", "serie", "ano"], ""),
    TURMA: getString(payload, ["turma", "anoSerie", "serie"], ""),
    TURNO: getString(payload, ["turno"], ""),
    TRIMESTRE: `${trimestre}º trimestre`,
    BIMESTRE: getString(payload, ["bimestre"], ""),
    ETAPA: getString(payload, ["etapa"], ""),
    CARGA_HORARIA: getString(payload, ["cargaHoraria"], ""),
    CONTEUDOS: aggregateMatrixField(matrix, "conteudo"),
    HABILIDADES: aggregateSkills(matrix),
    OBJETIVOS: getString(payload, ["objetivosGerais", "objetivos"], aggregateMatrixField(matrix, "objetivos")),
    METODOLOGIA: aggregateMatrixField(matrix, "metodologia"),
    RECURSOS: aggregateMatrixField(matrix, "recursos"),
    AVALIACAO: uniqueLines(
      matrix.map((item) => `${normalizeText(item.avaliacao)}\n${normalizeText(item.evidencias)}`),
    ),
    CRONOGRAMA: buildCronograma(matrix, payload),
    OBSERVACOES: getString(payload, ["observacoes"], ""),
    UNIDADE_TEMATICA: getString(payload, ["areaConhecimento"], ""),
    OBJETO_CONHECIMENTO: aggregateMatrixField(matrix, "conteudo"),
    CONTEUDO: aggregateMatrixField(matrix, "conteudo"),
    PROJETOS_INTERDISCIPLINARES: getString(payload, ["observacoes"], ""),
    TEMAS_INTEGRADORES: getString(payload, ["observacoes"], ""),
  };
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

function isPedagogicalRowLabel(text: string): boolean {
  const normalized = normalizeSearch(text);

  return (
    normalized.includes("habilidade") ||
    normalized.includes("objeto de conhecimento") ||
    normalized === "conteudo" ||
    normalized.includes("conteudos") ||
    normalized.includes("metodologia") ||
    normalized.includes("recurso") ||
    normalized.includes("avaliacao") ||
    normalized.includes("objetivo") ||
    normalized.includes("expectativa") ||
    normalized.includes("evidencia")
  );
}

function fieldValueForLabel(text: string, payload: OfficialPlanningPayload): string | null {
  const normalized = normalizeSearch(text);
  const matrix = getMatrix(payload);
  const trimestre = getTrimestre(payload);

  if (!normalized) {
    return null;
  }

  if (normalized.includes("escola") || normalized.includes("unidade escolar")) {
    return getString(payload, ["escola"], "");
  }

  if (normalized.includes("professor")) {
    return getString(payload, ["professor"], "");
  }

  if (
    normalized.includes("componente curricular") ||
    normalized.includes("componente") ||
    normalized.includes("disciplina")
  ) {
    return getString(payload, ["componenteCurricular", "componente"], "");
  }

  if (normalized.includes("area do conhecimento") || normalized === "area") {
    return getString(payload, ["areaConhecimento"], "");
  }

  if (
    normalized.includes("ano/serie") ||
    normalized.includes("ano serie") ||
    (normalized.includes("ano") && normalized.includes("serie"))
  ) {
    return getString(payload, ["anoSerie", "serie", "ano"], "");
  }

  if (normalized.includes("turma")) {
    return getString(payload, ["turma", "anoSerie", "serie"], "");
  }

  if (normalized.includes("turno")) {
    return getString(payload, ["turno"], "");
  }

  if (normalized.includes("etapa")) {
    return getString(payload, ["etapa"], "");
  }

  if (normalized.includes("carga horaria")) {
    return getString(payload, ["cargaHoraria"], "");
  }

  if (normalized.includes("bimestre")) {
    return getString(payload, ["bimestre"], "");
  }

  if (normalized.includes("trimestre")) {
    return `${trimestre}º trimestre`;
  }

  if (normalized.includes("unidade tematica")) {
    return getString(payload, ["areaConhecimento"], "");
  }

  if (
    normalized.includes("objeto de conhecimento") ||
    normalized === "conteudo" ||
    normalized.includes("conteudos")
  ) {
    return aggregateMatrixField(matrix, "conteudo");
  }

  if (normalized.includes("habilidade")) {
    return aggregateSkills(matrix);
  }

  if (normalized.includes("objetivo")) {
    return getString(payload, ["objetivosGerais", "objetivos"], aggregateMatrixField(matrix, "objetivos"));
  }

  if (normalized.includes("metodologia") || normalized.includes("procedimento")) {
    return aggregateMatrixField(matrix, "metodologia");
  }

  if (normalized.includes("recurso")) {
    return aggregateMatrixField(matrix, "recursos");
  }

  if (
    normalized.includes("avaliacao") ||
    normalized.includes("evidencia") ||
    normalized.includes("instrumento")
  ) {
    return uniqueLines(
      matrix.map((item) => `${normalizeText(item.avaliacao)}\n${normalizeText(item.evidencias)}`),
    );
  }

  if (normalized.includes("cronograma")) {
    return buildCronograma(matrix, payload);
  }

  if (
    normalized.includes("projeto interdisciplinar") ||
    normalized.includes("tema integrador") ||
    normalized.includes("temas integradores")
  ) {
    return getString(payload, ["observacoes"], "");
  }

  if (normalized.includes("observacao")) {
    return getString(payload, ["observacoes"], "");
  }

  return null;
}

function labelValueForMatrixCell(label: string, item: PlanningMatrixItem, payload: OfficialPlanningPayload): string | null {
  const normalized = normalizeSearch(label);

  if (normalized.includes("unidade tematica")) {
    return getString(payload, ["areaConhecimento"], "");
  }

  if (
    normalized.includes("objeto") ||
    normalized.includes("conteudo") ||
    normalized.includes("conhecimento")
  ) {
    return item.conteudo;
  }

  if (normalized.includes("habilidade")) {
    return codesWithShortDescriptions(item.habilidades);
  }

  if (normalized.includes("objetivo") || normalized.includes("expectativa")) {
    return item.objetivos;
  }

  if (normalized.includes("metodologia") || normalized.includes("procedimento")) {
    return item.metodologia;
  }

  if (normalized.includes("recurso")) {
    return item.recursos;
  }

  if (normalized.includes("avaliacao") || normalized.includes("evidencia")) {
    return `${item.evidencias}\n${item.avaliacao}`.trim();
  }

  if (normalized.includes("aula") && (normalized.includes("trimestre") || normalized.includes("carga"))) {
    return `Aula ${formatMatrixAulaLabel(item)} · ${formatMatrixPeriodosLabel(item)}`;
  }

  if (normalized.includes("aula")) {
    return formatMatrixAulaLabel(item);
  }

  if (normalized.includes("carga") || normalized.includes("periodo")) {
    return formatMatrixPeriodosLabel(item);
  }

  return null;
}

function classifyColumn(headerText: string, index: number): string {
  const text = normalizeSearch(headerText);

  if (text.includes("unidade")) return "unidade";
  if (text.includes("objeto") || text.includes("conteudo") || text.includes("conhec")) return "conteudo";
  if (text.includes("habilidade")) return "habilidades";
  if (text.includes("expectativa") || text.includes("objetivo")) return "objetivos";
  if (text.includes("carga") || text.includes("periodo")) return "carga";
  if (text.includes("aula")) return "aula";
  if (text.includes("metodologia") || text.includes("procedimento")) return "metodologia";
  if (text.includes("recurso")) return "recursos";
  if (text.includes("avaliacao") || text.includes("evidencia")) return "avaliacao";

  const fallback = ["unidade", "conteudo", "habilidades", "objetivos", "carga", "aula"];
  return fallback[index] || "extra";
}

function isPlanningHeaderText(text: string): boolean {
  const normalized = normalizeSearch(text);

  return (
    (normalized.includes("objeto") || normalized.includes("conteudo") || normalized.includes("conhec")) &&
    normalized.includes("habilidade")
  );
}

function findHeaderRow(table: TableInfo): RowInfo {
  const candidates = table.rows
    .map((row) => {
      const text = normalizeSearch(row.text);
      let score = row.cells.length;

      if (text.includes("unidade")) score += 8;
      if (text.includes("objeto") || text.includes("conteudo")) score += 8;
      if (text.includes("habilidade")) score += 8;
      if (text.includes("metodologia")) score += 5;
      if (text.includes("aula")) score += 5;

      return { row, score };
    })
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.row || table.rows[0];
}

function valuesForPlanningRow(
  item: PlanningMatrixItem,
  headerCells: CellInfo[],
  payload: OfficialPlanningPayload,
): Array<string | null> {
  return headerCells.map((cell, index) => {
    const kind = classifyColumn(cell.text, index);

    switch (kind) {
      case "unidade":
        return getString(payload, ["areaConhecimento"], "");
      case "conteudo":
        return item.conteudo;
      case "habilidades":
        return codesWithShortDescriptions(item.habilidades);
      case "objetivos":
        return item.objetivos;
      case "carga":
        return formatMatrixPeriodosLabel(item);
      case "aula":
        return formatMatrixAulaLabel(item);
      case "metodologia":
        return item.metodologia;
      case "recursos":
        return item.recursos;
      case "avaliacao":
        return `${item.evidencias}\n${item.avaliacao}`.trim();
      default:
        return "";
    }
  });
}

function fillPlaceholders(documentXml: string, payload: OfficialPlanningPayload): {
  xml: string;
  count: number;
  hasPlaceholders: boolean;
} {
  const values = buildPlaceholderMap(payload);
  const placeholderPattern = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;
  const hasPlaceholders = placeholderPattern.test(documentXml);
  placeholderPattern.lastIndex = 0;

  let count = 0;
  let output = documentXml;

  output = output.replace(placeholderPattern, (match, key: string) => {
    const normalizedKey = String(key || "").toUpperCase();
    const value = values[normalizedKey];

    if (value === undefined) {
      return match;
    }

    count += 1;
    return escapeXml(value);
  });

  return { xml: output, count, hasPlaceholders };
}

function fillLabelTables(documentXml: string, payload: OfficialPlanningPayload): {
  xml: string;
  count: number;
} {
  const tables = parseTables(documentXml);
  const matrix = getMatrix(payload);
  let count = 0;

  const replacements = tables.map((table) => {
    let matrixRowIndex = 0;

    const rowReplacements = table.rows.map((row) => {
      if (row.cells.length < 2) {
        if (row.cells.length === 1) {
          const value = fieldValueForLabel(row.cells[0]?.text || "", payload);

          if (value) {
            count += 1;
            return replaceCellsInRow(row.xml, [value]);
          }
        }

        return row.xml;
      }

      const firstText = row.cells[0]?.text || "";
      const secondText = row.cells[1]?.text || "";
      const item = matrix[matrixRowIndex % Math.max(matrix.length, 1)];

      if (item && (isPedagogicalRowLabel(firstText) || isPedagogicalRowLabel(secondText))) {
        const byFirst = labelValueForMatrixCell(firstText, item, payload);
        const bySecond = labelValueForMatrixCell(secondText, item, payload);

        if (byFirst) {
          count += 1;
          matrixRowIndex += 1;
          return replaceCellsInRow(row.xml, [null, byFirst]);
        }

        if (bySecond) {
          count += 1;
          matrixRowIndex += 1;
          return replaceCellsInRow(row.xml, [bySecond, null]);
        }
      }

      const byFirst = fieldValueForLabel(firstText, payload);
      const bySecond = fieldValueForLabel(secondText, payload);

      if (byFirst) {
        count += 1;
        return replaceCellsInRow(row.xml, [null, byFirst]);
      }

      if (bySecond) {
        count += 1;
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

  return {
    xml: replaceInXml(documentXml, tables, replacements),
    count,
  };
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
    dataRows: rows.filter((row) => row.start > header.start && row.cells.length >= 3),
  };
}

function fillPlanningTables(documentXml: string, payload: OfficialPlanningPayload): {
  xml: string;
  count: number;
} {
  const matrix = getMatrix(payload);
  const tipo = getTipo(payload);
  const trimestre = getTrimestre(payload);
  const items =
    tipo === "trimestral"
      ? matrix.filter((item) => Number(item.trimestre) === trimestre).length
        ? matrix.filter((item) => Number(item.trimestre) === trimestre)
        : matrix
      : matrix;

  const tables = parseTables(documentXml);
  let count = 0;

  const replacements = tables.map((table) => {
    const header = findHeaderRow(table);
    const hasColumnHeader = isPlanningHeaderText(header.text);

    if (!hasColumnHeader) {
      let matrixRowIndex = 0;

      const rowReplacements = table.rows.map((row) => {
        if (row.cells.length < 2) {
          return row.xml;
        }

        const left = row.cells[0]?.text || "";
        const right = row.cells[1]?.text || "";
        const item = items[matrixRowIndex % Math.max(items.length, 1)];

        if (!item) {
          return row.xml;
        }

        const byLeft = labelValueForMatrixCell(left, item, payload);
        const byRight = labelValueForMatrixCell(right, item, payload);

        if (byLeft) {
          count += 1;
          matrixRowIndex += 1;
          return replaceCellsInRow(row.xml, [null, byLeft]);
        }

        if (byRight) {
          count += 1;
          matrixRowIndex += 1;
          return replaceCellsInRow(row.xml, [byRight, null]);
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

    const initialDataRows = table.rows.filter(
      (row) => row.start > header.start && row.cells.length >= 3,
    );
    const expanded = expandTableDataRows(table, header, initialDataRows, items.length);
    const dataRows = expanded.dataRows;

    const rowReplacements = expanded.rows.map((row) => {
      const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

      if (dataIndex >= 0 && items[dataIndex]) {
        count += 1;
        return replaceCellsInRow(
          row.xml,
          valuesForPlanningRow(items[dataIndex], header.cells, payload),
        );
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

  return {
    xml: replaceInXml(documentXml, tables, replacements),
    count,
  };
}

export function validateCustomDocxBuffer(buffer: Buffer, maxBytes: number): void {
  if (!buffer.length) {
    throw new Error("Envie um arquivo .docx válido.");
  }

  if (buffer.length > maxBytes) {
    throw new Error("O modelo da escola deve ter no máximo 10 MB.");
  }

  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error("O arquivo enviado não é um DOCX válido.");
  }

  const entries = readZip(buffer);

  if (!entries.has("word/document.xml")) {
    throw new Error("DOCX inválido: word/document.xml não encontrado.");
  }
}

function evaluateFillSuccess(stats: UniversalFillStats): boolean {
  if (stats.hasPlaceholders) {
    return stats.placeholdersReplaced > 0;
  }

  return stats.labelFills >= 2 || stats.planningRowsFilled >= 1;
}

export function tryFillUniversalTemplate(
  documentXml: string,
  payload: OfficialPlanningPayload,
): UniversalFillResult {
  const placeholders = fillPlaceholders(documentXml, payload);
  const labels = fillLabelTables(placeholders.xml, payload);
  const planning = fillPlanningTables(labels.xml, payload);

  const stats: UniversalFillStats = {
    placeholdersReplaced: placeholders.count,
    labelFills: labels.count,
    planningRowsFilled: planning.count,
    hasPlaceholders: placeholders.hasPlaceholders,
  };

  return {
    success: evaluateFillSuccess(stats),
    documentXml: planning.xml,
    stats,
  };
}

export function buildUniversalPlanningDocx(
  templateBuffer: Buffer,
  payload: OfficialPlanningPayload,
): { buffer: Buffer; stats: UniversalFillStats; success: boolean } {
  validateCustomDocxBuffer(templateBuffer, 10 * 1024 * 1024);

  const entries = new Map<string, Buffer | string>(readZip(templateBuffer));
  const documentXml = entries.get("word/document.xml");

  if (!documentXml) {
    throw new Error("DOCX inválido: word/document.xml não encontrado.");
  }

  const originalXml = Buffer.isBuffer(documentXml)
    ? documentXml.toString("utf8")
    : String(documentXml);

  const fillResult = tryFillUniversalTemplate(originalXml, payload);
  entries.set("word/document.xml", fillResult.documentXml);

  return {
    buffer: buildZipFromEntries(entries),
    stats: fillResult.stats,
    success: fillResult.success,
  };
}
