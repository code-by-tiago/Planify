import fs from "node:fs";
import path from "node:path";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PlanningAiResult, PlanningMatrixItem, PlanningSkill } from "./planning-ai-service";
import { extractAnnualItemsForTrimester } from "@/lib/planejamentos/planning-trimestral-from-annual";
import {
  matrixItemsFromTrimestralPlano,
  runTrimestralPipelineOnItems,
} from "@/lib/planejamentos/planning-trimestral-pipeline";
import {
  deriveExpectativaAprendizagem,
  enrichObjetoConhecimento,
  enrichUnidadeTematica,
  formatHabilidadesBnccAnual,
  resolveWeeklyPeriodsFromPayload,
} from "@/lib/planejamentos/planning-annual-field-enrichment";
import {
  finalizeMatrixLessonAllocation,
  formatMatrixAulaLabel,
  formatMatrixPeriodosLabel,
} from "./planning-lesson-allocation";
import {
  getOfficialPlanningTemplatePath,
  type OfficialPlanningTemplateTipo,
} from "./official-planning-templates";

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
  turma?: string;
  className?: string;
  matrizPlanejamento?: PlanningAiResult["planejamento"] | { conteudos?: PlanningMatrixItem[] };
  /** Pacote ZIP: um trimestre a incluir (1–3). Omitido = 1º trimestre. */
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

function getOfficialTemplatePath(tipo: OfficialPlanningTemplateTipo): string {
  return getOfficialPlanningTemplatePath(tipo);
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
  const component = getString(payload, ["componenteCurricular", "componente"]);
  return enrichUnidadeTematica(item.conteudo, component, item.habilidades || []);
}

function formatExpectativasAprendizagem(item: PlanningMatrixItem): string {
  return deriveExpectativaAprendizagem(item.conteudo, item.habilidades || []);
}

function weeklyPeriodsForPayload(payload: OfficialPlanningPayload): number {
  return resolveWeeklyPeriodsFromPayload(getString(payload, ["cargaHoraria"], ""));
}

function projectText(payload: OfficialPlanningPayload, items: PlanningMatrixItem[]): string {
  const contentList = items.map((item) => item.conteudo).join("; ");
  const custom = getString(payload, ["observacoes"], "");

  if (items.length === 1) {
    const conteudo = normalizeText(items[0].conteudo);

    if (custom) {
      return `Projetos e integração vinculados a ${conteudo}: ${custom}`;
    }

    return `Atividades integradoras relacionadas a ${conteudo}: leitura, pesquisa, produção, socialização e participação coletiva.`;
  }

  if (custom && contentList) {
    return `Projetos e integração vinculados a ${contentList}: ${custom}`;
  }

  if (custom) {
    return custom;
  }

  return `Integração entre os conteúdos do período (${contentList}) por meio de leitura, pesquisa, produção, socialização, resolução de problemas e participação coletiva.`;
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

function sumMatrixPeriodos(items: PlanningMatrixItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, Number(item.periodos) || 0), 0);
}

function formatTrimestralCargaHoraria(matrix: PlanningMatrixItem[]): string {
  const byTrimester = [1, 2, 3].map((trimestre) =>
    sumMatrixPeriodos(extractAnnualItemsForTrimester(matrix, trimestre)),
  );
  const nonZero = byTrimester.filter((value) => value > 0);

  if (nonZero.length === 0) {
    return "";
  }

  if (nonZero.every((value) => value === nonZero[0])) {
    return `${nonZero[0]} períodos`;
  }

  return byTrimester
    .map((value, index) => (value > 0 ? `${index + 1}º: ${value} períodos` : ""))
    .filter(Boolean)
    .join(" · ");
}

function identificationValueForLabel(
  labelText: string,
  payload: OfficialPlanningPayload,
  matrix: PlanningMatrixItem[],
): string | null {
  const normalized = normalizeSearch(labelText);

  if (!normalized) {
    return null;
  }

  if (normalized === "componente" || normalized.includes("componente curricular")) {
    return getString(payload, ["componenteCurricular", "componente"], "");
  }

  if (
    normalized.includes("ano/serie") ||
    normalized.includes("ano serie") ||
    (normalized.includes("ano") && normalized.includes("serie"))
  ) {
    return getString(payload, ["anoSerie", "serie", "ano"], "");
  }

  if (normalized.includes("professor")) {
    return getString(payload, ["professor"], "");
  }

  if (normalized === "turma" || normalized.endsWith(" turma")) {
    return getString(payload, ["turma", "className", "anoSerie", "serie"], "");
  }

  if (normalized.includes("periodo de desenvolvimento")) {
    return `${getTrimestre(payload)}º trimestre`;
  }

  if (normalized.includes("data de inicio") || normalized.includes("data de fim")) {
    return `${getTrimestre(payload)}º trimestre`;
  }

  if (normalized.includes("carga horaria anual")) {
    const total = sumMatrixPeriodos(matrix);
    if (total > 0) {
      return `${total} períodos`;
    }

    const parsed = normalizeText(getString(payload, ["cargaHoraria"], "")).match(/\d+/);
    return parsed ? `${parsed[0]} períodos` : null;
  }

  if (normalized.includes("carga horaria trimestral")) {
    if (getTipo(payload) === "trimestral") {
      const total = sumMatrixPeriodos(matrix);
      return total > 0 ? `${total} períodos` : null;
    }

    const formatted = formatTrimestralCargaHoraria(matrix);
    return formatted || null;
  }

  if (normalized.includes("carga horaria semanal")) {
    const annualTotal = sumMatrixPeriodos(matrix);
    if (annualTotal > 0) {
      const weekly = Math.max(1, Math.round(annualTotal / 40));
      return `${weekly} períodos`;
    }

    const weekly = resolveWeeklyPeriodsFromPayload(getString(payload, ["cargaHoraria"], ""));
    return weekly > 0 ? `${weekly} períodos` : null;
  }

  if (normalized.includes("escola") || normalized.includes("unidade escolar")) {
    return getString(payload, ["escola"], "");
  }

  if (normalized.includes("etapa")) {
    return getString(payload, ["etapa"], "");
  }

  return null;
}

function isIdentificationTable(table: TableInfo): boolean {
  const text = normalizeSearch(table.text);

  return (
    table.rows.length <= 3 &&
    text.includes("componente") &&
    (text.includes("professor") || text.includes("turma") || text.includes("carga horaria"))
  );
}

function fillLabelCellValue(label: string, value: string): string {
  const safeLabel = label.trim();
  const safeValue = value.trim();

  if (!safeLabel) {
    return safeValue;
  }

  if (!safeValue) {
    return safeLabel;
  }

  return `${safeLabel}\n${safeValue}`;
}

function fillIdentificationTables(documentXml: string, payload: OfficialPlanningPayload): string {
  const matrix = getMatrix(payload);
  const tables = parseTables(documentXml);
  const identificationSummary: Record<string, string> = {};

  const replacements = tables.map((table) => {
    if (!isIdentificationTable(table)) {
      return table.xml;
    }

    const rowReplacements = table.rows.map((row) => {
      if (row.cells.length >= 6 && row.cells.length % 2 === 0) {
        const pairedValues = row.cells.map((cell, index) => {
          if (index % 2 === 1) {
            const label = row.cells[index - 1]?.text?.trim() || "";
            const value = identificationValueForLabel(label, payload, matrix);
            if (!value) {
              return null;
            }
            identificationSummary[label.slice(0, 40)] = value;
            return value;
          }
          return null;
        });

        if (pairedValues.some((value) => value !== null)) {
          return replaceCellsInRow(row.xml, pairedValues);
        }
      }

      const values = row.cells.map((cell) => {
        const label = cell.text.trim();
        if (!label) {
          return null;
        }

        const value = identificationValueForLabel(label, payload, matrix);
        if (!value) {
          return null;
        }

        identificationSummary[label.slice(0, 40)] = value;
        return fillLabelCellValue(label, value);
      });

      if (values.every((value) => value === null)) {
        return row.xml;
      }

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

      if (isWeekDistributionRow(row)) {
        score -= 1000;
      }

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

function findTrimestralTableHeaderRow(table: TableInfo): RowInfo {
  const tableText = normalizeSearch(table.text);

  if (tableText.includes("experiencias de aprendizagem")) {
    const sectionHeader = table.rows.find(
      (row) => normalizeSearch(row.text) === "experiencias de aprendizagem",
    );

    if (sectionHeader) {
      return sectionHeader;
    }
  }

  return findHeaderRow(table);
}

function isWeekDistributionRow(row: RowInfo): boolean {
  const normalized = normalizeSearch(row.text);

  return (
    normalized.includes("semana") &&
    normalized.includes("data") &&
    row.cells.length >= 6
  );
}

function isTemplatePlaceholderText(text: string): boolean {
  return normalizeText(text).startsWith("[");
}

function resolvePlaceholderFieldValue(
  placeholder: string,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
  items: PlanningMatrixItem[],
): string | null {
  const normalized = normalizeSearch(placeholder);
  const trimItem = trimestralMatrixItem(item);
  const scope = items.length > 0 ? items : [item];

  if (normalized.includes("data de inicio") || normalized.includes("data de fim")) {
    return `${getTrimestre(payload)}º trimestre`;
  }

  if (
    normalized.includes("descreva os instrumentos") ||
    normalized.includes("descreva aqui quais instrumentos") ||
    (normalized.includes("instrumento") && normalized.includes("coletar"))
  ) {
    return trimItem.avaliacao || evaluationText(scope);
  }

  if (
    normalized.includes("descreva aqui caso") ||
    normalized.includes("indique os projetos")
  ) {
    return projectText(payload, scope);
  }

  if (normalized.includes("observar na atividade") || normalized.includes("identificar a aprendizagem")) {
    return trimItem.evidencias;
  }

  if (normalized.includes("trabalho em grupo") || normalized.includes("plenaria")) {
    return trimItem.metodologia;
  }

  if (normalized.includes("livros, impressos") || normalized.includes("links e etc")) {
    return trimestralMateriaisRecursosValue(trimItem) || null;
  }

  if (normalized.includes("atividades planejadas") || normalized.includes("encontro")) {
    return trimItem.etapas || trimItem.metodologia || null;
  }

  if (normalized.includes("de acordo com a matriz")) {
    return (
      formatExpectativasAprendizagem(trimItem) ||
      enrichObjetoConhecimento(trimItem.conteudo, trimItem.habilidades || [])
    );
  }

  if (normalized.includes("a partir da matriz")) {
    return formatExpectativasAprendizagem(trimItem);
  }

  return null;
}

function isProjectOrEvaluationRow(row: RowInfo): boolean {
  const text = normalizeSearch(row.text);

  return (
    text.includes("projeto interdisciplinar") ||
    text.includes("temas integradores") ||
    text.includes("tema integrador") ||
    text.includes("instrumento") ||
    text.includes("avaliacao") ||
    text.includes("observacao") ||
    text.includes("indique os projetos") ||
    text.includes("descreva os instrumentos")
  );
}

function isProjectOrEvaluationContentRow(row: RowInfo): boolean {
  const label = normalizeText(row.cells[0]?.text || "");
  const normalized = normalizeSearch(label);

  if (
    normalized.includes("indique os projetos") ||
    normalized.includes("descreva os instrumentos") ||
    normalized.includes("descreva aqui caso") ||
    normalized.includes("descreva aqui quais instrumentos")
  ) {
    return true;
  }

  if (label.startsWith("[")) {
    return (
      normalized.includes("projeto") ||
      normalized.includes("instrumento") ||
      normalized.includes("avaliacao") ||
      normalized.includes("interdisciplinar") ||
      normalized.includes("observar") ||
      normalized.includes("descreva")
    );
  }

  return row.cells.some((cell) => isTemplatePlaceholderText(cell.text));
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

function isInstructionPlaceholderRow(row: RowInfo): boolean {
  const text = row.text;

  return (
    text.includes("[de acordo com") ||
    text.includes("[indique a carga") ||
    text.includes("[numere a aula") ||
    text.includes("[a partir da Matriz")
  );
}

function fillTrimesterSummaryRow(
  row: RowInfo,
  items: PlanningMatrixItem[],
): string {
  const total = sumMatrixPeriodos(items);
  if (total <= 0) {
    return row.xml;
  }

  const totalLabel = `${total} períodos`;
  const values = row.cells.map((cell, index) => {
    if (row.cells.length >= 6 && (index === 4 || index === 5)) {
      return totalLabel;
    }

    if (isInstructionPlaceholderRow({ ...row, text: cell.text })) {
      return "";
    }

    return null;
  });

  return replaceCellsInRow(row.xml, values);
}

function valuesForPlanningRow(
  payload: OfficialPlanningPayload,
  item: PlanningMatrixItem,
  headerCells: CellInfo[],
  compactSkills: boolean,
): Array<string | null> {
  const weeklyPeriods = weeklyPeriodsForPayload(payload);
  const objeto = enrichObjetoConhecimento(item.conteudo, item.habilidades || []);

  return headerCells.map((cell, index) => {
    const kind = classifyColumn(cell.text, index);

    switch (kind) {
      case "unidade":
        return unitFor(payload, item);
      case "conteudo":
        return objeto;
      case "habilidades":
        return compactSkills
          ? codesWithShortDescriptions(item.habilidades)
          : formatHabilidadesBnccAnual(item.habilidades || []);
      case "expectativas":
        return formatExpectativasAprendizagem(item);
      case "carga":
        return formatMatrixPeriodosLabel(item, weeklyPeriods);
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
  if (!isProjectOrEvaluationContentRow(row)) {
    return row.xml;
  }

  const labelNormalized = normalizeSearch(row.cells[0]?.text || "");
  const rowNormalized = normalizeSearch(row.text);
  const isInstrumentRow =
    (labelNormalized.includes("instrumento") && !isTemplatePlaceholderText(row.cells[0]?.text || "")) ||
    rowNormalized.includes("descreva aqui quais instrumentos") ||
    rowNormalized.includes("descreva os instrumentos");

  const value = isInstrumentRow ? evaluationText(items) : projectText(payload, items);

  if (row.cells.length === 1 && isTemplatePlaceholderText(row.cells[0]?.text || "")) {
    return replaceCellsInRow(row.xml, [value]);
  }

  if (row.cells.length >= 2) {
    const values = row.cells.map((cell, index) => {
      if (index === 1) {
        return value;
      }

      if (isTemplatePlaceholderText(cell.text)) {
        return "";
      }

      return null;
    });

    return replaceCellsInRow(row.xml, values);
  }

  return replaceCellsInRow(row.xml, [value]);
}

type TrimestralPlanningBlock = {
  start: number;
  end: number;
  tables: TableInfo[];
};

function chooseTrimestralPlanningBlock(tables: TableInfo[]): TrimestralPlanningBlock | null {
  if (tables.length >= 4) {
    const planningTables = tables.slice(1, 4);
    const combined = normalizeSearch(planningTables.map((table) => table.text).join(" "));

    if (
      combined.includes("unidade") &&
      combined.includes("objeto") &&
      combined.includes("experiencia") &&
      combined.includes("projeto interdisciplinar")
    ) {
      return {
        start: planningTables[0].start,
        end: planningTables[planningTables.length - 1].end,
        tables: planningTables,
      };
    }
  }

  const single = chooseTrimestralPlanningTable(tables);
  if (!single) {
    return null;
  }

  return {
    start: single.start,
    end: single.end,
    tables: [single],
  };
}

function fillOneTrimestralBlock(
  block: TrimestralPlanningBlock,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  const filledTables = block.tables.map((table) => fillOneTrimestralTable(table, item, payload));

  return filledTables.join("<w:p><w:r><w:t xml:space=\"preserve\"> </w:t></w:r></w:p>");
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
    const includeSummaryRow = items.length > 0;
    const expanded = expandTableDataRows(
      table,
      header,
      initialDataRows,
      items.length + (includeSummaryRow ? 1 : 0),
    );
    const dataRows = expanded.dataRows;

    const rowReplacements = expanded.rows.map((row) => {
      const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

      if (dataIndex === 0 && includeSummaryRow) {
        if (isInstructionPlaceholderRow(row)) {
          return fillTrimesterSummaryRow(row, items);
        }
        return fillTrimesterSummaryRow(row, items);
      }

      if (dataIndex > 0 && includeSummaryRow) {
        const item = items[dataIndex - 1];

        if (!item) {
          return clearCellsInRow(row.xml);
        }

        return replaceCellsInRow(
          row.xml,
          valuesForPlanningRow(payload, item, header.cells, false),
        );
      }

      if (dataIndex >= 0 && !includeSummaryRow) {
        const item = items[dataIndex];

        if (!item) {
          return clearCellsInRow(row.xml);
        }

        return replaceCellsInRow(
          row.xml,
          valuesForPlanningRow(payload, item, header.cells, false),
        );
      }

      if (row.start > header.start && isProjectOrEvaluationContentRow(row)) {
        return fillProjectAndEvaluationRows(row, items, payload);
      }

      if (row.start > header.start) {
        const footerFill = fillTrimestralLabelRow(
          row,
          items[0] || items[items.length - 1],
          payload,
        );
        if (footerFill !== row.xml) {
          return footerFill;
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

function trimestralMateriaisRecursosValue(item: PlanningMatrixItem): string {
  const materiais = normalizeText(item.materiais || "");
  const recursos = normalizeText(item.recursos || "");

  if (materiais && recursos) {
    return `${materiais} ${recursos}`;
  }

  return materiais || recursos;
}

/** Trimestral usa os mesmos valores da matriz anual — sem re-enriquecimento. */
function trimestralMatrixItem(item: PlanningMatrixItem): PlanningMatrixItem {
  return item;
}

function labelValue(label: string, item: PlanningMatrixItem, payload: OfficialPlanningPayload): string | null {
  const text = normalizeSearch(label);
  const trimItem = trimestralMatrixItem(item);

  if (text.includes("trimestre") && text.includes("aula")) {
    const weeklyPeriods = weeklyPeriodsForPayload(payload);
    return `${getTrimestre(payload)}º trimestre — Aula ${formatMatrixAulaLabel(trimItem)} · ${formatMatrixPeriodosLabel(trimItem, weeklyPeriods)}`;
  }

  if (text.includes("aula")) {
    return formatMatrixAulaLabel(trimItem);
  }

  if (text.includes("carga") || text.includes("periodo")) {
    return formatMatrixPeriodosLabel(trimItem, weeklyPeriodsForPayload(payload));
  }

  if (text.includes("unidade")) {
    return unitFor(payload, trimItem);
  }

  if (text.includes("objeto") || text.includes("conteudo") || text.includes("conhecimento")) {
    return enrichObjetoConhecimento(trimItem.conteudo, trimItem.habilidades || []);
  }

  if (text.includes("habilidade")) {
    return formatHabilidadesBnccAnual(trimItem.habilidades || []);
  }

  if (text.includes("expectativa")) {
    return formatExpectativasAprendizagem(trimItem);
  }

  if (text.includes("objetivo") && !text.includes("expectativa")) {
    return formatExpectativasAprendizagem(trimItem);
  }

  if (text.includes("experiencia") && text.includes("aprendizagem")) {
    return null;
  }

  if (text.includes("organizacao") && text.includes("metodologia")) {
    return trimItem.metodologia || null;
  }

  if (text.includes("metodologia") || text.includes("procedimento")) {
    return trimItem.metodologia || null;
  }

  if (text.includes("materiais") && text.includes("recursos")) {
    return trimestralMateriaisRecursosValue(trimItem) || null;
  }

  if (text.includes("materiais")) {
    return trimItem.materiais || null;
  }

  if (text.includes("recursos")) {
    return trimItem.recursos || null;
  }

  if (text.includes("momento") || text.includes("etapa")) {
    return trimItem.etapas || null;
  }

  if (text.includes("evidencia")) {
    return trimItem.evidencias || null;
  }

  if (text.includes("instrumento") || text.includes("avaliacao")) {
    return trimItem.avaliacao || null;
  }

  if (text.includes("projeto interdisciplinar") || text.includes("tema integrador") || text.includes("temas integradores")) {
    return projectText(payload, [trimItem]);
  }

  return null;
}

function isTrimestralSectionHeader(text: string): boolean {
  const normalized = normalizeSearch(text);

  return normalized === "experiencias de aprendizagem";
}

type TrimestralExperienciasField =
  | "semana"
  | "metodologia"
  | "materiais"
  | "etapas"
  | "evidencias"
  | "instrumentos";

const TRIMESTRAL_EXPERIENCIAS_WEEK_COLUMNS = 5;

function weekFieldFromPipeline(
  item: PlanningMatrixItem,
  weekIndex: number,
  field: TrimestralExperienciasField,
): string {
  const semana = item.semanas?.[weekIndex];
  if (!semana) {
    return "";
  }

  switch (field) {
    case "semana":
      return "";
    case "metodologia":
      return semana.metodologia;
    case "materiais":
      return semana.materiais;
    case "etapas":
      return semana.etapas;
    case "evidencias":
      return semana.evidencias;
    case "instrumentos":
      return semana.instrumentos;
    default:
      return "";
  }
}

function classifyTrimestralExperienciasRow(row: RowInfo): TrimestralExperienciasField | null {
  if (isWeekDistributionRow(row)) {
    return "semana";
  }

  if (row.cells.length < 6) {
    return null;
  }

  const label = normalizeSearch(row.cells[0]?.text || "");

  if (label.includes("organizacao") && label.includes("metodologia")) {
    return "metodologia";
  }

  if (label.includes("materiais") && label.includes("recursos")) {
    return "materiais";
  }

  if (label.includes("momento") || label.includes("etapa")) {
    return "etapas";
  }

  if (label.includes("evidencia")) {
    return "evidencias";
  }

  if (label.includes("instrumento") && label.includes("avaliacao")) {
    return "instrumentos";
  }

  return null;
}

function fillTrimestralExperienciasRow(
  row: RowInfo,
  item: PlanningMatrixItem,
  _weeklyPeriods: number,
): string {
  const field = classifyTrimestralExperienciasRow(row);
  if (!field) {
    return row.xml;
  }

  const values: Array<Primitive | null> = [null, null, null, null, null, null];

  for (let weekIndex = 0; weekIndex < TRIMESTRAL_EXPERIENCIAS_WEEK_COLUMNS; weekIndex += 1) {
    const col = weekIndex + 1;
    const value = normalizeText(weekFieldFromPipeline(item, weekIndex, field));

    if (value) {
      values[col] = value;
    } else if (isTemplatePlaceholderText(row.cells[col]?.text || "")) {
      values[col] = "";
    }
  }

  return replaceCellsInRow(row.xml, values);
}

function isTrimestralExperienciasTable(table: TableInfo): boolean {
  return normalizeSearch(table.text).includes("experiencias de aprendizagem");
}

function isTrimestralAulaTitleRow(row: RowInfo): boolean {
  const text = normalizeSearch(row.text);

  return (
    row.cells.length <= 2 &&
    text.includes("trimestre") &&
    /\baula\s*n/.test(text) &&
    !text.includes("[") &&
    !text.includes("descreva")
  );
}

function fillTrimestralLabelRow(
  row: RowInfo,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  const cellCount = row.cells.length;

  if (cellCount === 1) {
    const labelText = row.cells[0]?.text || "";
    const normalizedLabel = normalizeSearch(labelText);

    if (isTrimestralSectionHeader(labelText)) {
      return row.xml;
    }

    if (
      !labelText.trim().startsWith("[") &&
      (normalizedLabel.includes("projeto interdisciplinar") ||
        normalizedLabel.includes("temas integradores") ||
        normalizedLabel.includes("temas integradores e competencias") ||
        (normalizedLabel.includes("instrumentos de avaliacao") && !labelText.trim().startsWith("[")) ||
        (normalizedLabel.includes("instrumento") &&
          normalizedLabel.includes("avaliacao") &&
          !labelText.trim().startsWith("[")))
    ) {
      return row.xml;
    }

    if (labelText.trim().startsWith("[")) {
      const placeholderValue = resolvePlaceholderFieldValue(
        labelText,
        item,
        payload,
        [item],
      );
      if (placeholderValue) {
        return replaceCellsInRow(row.xml, [placeholderValue]);
      }
    }

    const value = labelValue(labelText, item, payload);
    if (!value) {
      return row.xml;
    }

    if (normalizedLabel.includes("trimestre") && normalizedLabel.includes("aula")) {
      return replaceCellsInRow(row.xml, [value]);
    }

    if (
      normalizedLabel.includes("projeto interdisciplinar") ||
      normalizedLabel.includes("tema integrador") ||
      normalizedLabel.includes("temas integradores") ||
      labelText.trim().startsWith("[")
    ) {
      return replaceCellsInRow(row.xml, [value]);
    }

    return row.xml;
  }

  if (cellCount === 2) {
    const labelText = row.cells[0]?.text || "";
    const rightText = row.cells[1]?.text || "";
    let value =
      labelValue(labelText, item, payload) ||
      (isTemplatePlaceholderText(rightText)
        ? resolvePlaceholderFieldValue(rightText, item, payload, [item])
        : null) ||
      (isTemplatePlaceholderText(labelText)
        ? resolvePlaceholderFieldValue(labelText, item, payload, [item])
        : null);

    if (value && isTemplatePlaceholderText(rightText)) {
      return replaceCellsInRow(row.xml, [null, value]);
    }

    return value ? replaceCellsInRow(row.xml, [null, value]) : row.xml;
  }

  if (cellCount === 4) {
    const values: Array<Primitive | null> = [null, null, null, null];
    const leftLabel = row.cells[0]?.text || "";
    const rightLabel = row.cells[2]?.text || "";
    const leftPlaceholder = row.cells[1]?.text || "";
    const rightPlaceholder = row.cells[3]?.text || "";

    const leftValue =
      labelValue(leftLabel, item, payload) ||
      (isTemplatePlaceholderText(leftPlaceholder)
        ? resolvePlaceholderFieldValue(leftPlaceholder, item, payload, [item])
        : null);
    const rightValue =
      labelValue(rightLabel, item, payload) ||
      (isTemplatePlaceholderText(rightPlaceholder)
        ? resolvePlaceholderFieldValue(rightPlaceholder, item, payload, [item])
        : null);

    if (leftValue) values[1] = leftValue;
    if (rightValue) values[3] = rightValue;

    if (leftValue || rightValue) {
      return replaceCellsInRow(row.xml, values);
    }

    return row.xml;
  }

  if (cellCount >= 6) {
    const label = row.cells[0]?.text || "";
    const value =
      labelValue(label, item, payload) ||
      row.cells
        .map((cell) => cell.text)
        .filter((text) => isTemplatePlaceholderText(text))
        .map((text) => resolvePlaceholderFieldValue(text, item, payload, [item]))
        .find(Boolean) ||
      null;

    if (!value) {
      return row.xml;
    }

    const values = row.cells.map((cell, index) => {
      if (index === 1) {
        return value;
      }
      const cellText = cell.text.trim();
      if (cellText.startsWith("[")) {
        return "";
      }
      return null;
    });
    return replaceCellsInRow(row.xml, values);
  }

  return row.xml;
}

function isTrimestralUnidadeObjetoRow(row: RowInfo): boolean {
  const text = normalizeSearch(row.text);

  return (
    row.cells.length === 4 &&
    text.includes("unidade") &&
    (text.includes("objeto") || text.includes("conhecimento"))
  );
}

function isTrimestralMatrixLabelDataRow(row: RowInfo): boolean {
  const label = normalizeSearch(row.cells[0]?.text || "");

  if (row.cells.length === 2 && label.includes("habilidade")) {
    return true;
  }

  if (row.cells.length === 2 && (label.includes("expectativa") || label.includes("objetivo"))) {
    return true;
  }

  return isTrimestralUnidadeObjetoRow(row);
}

function fillOneTrimestralTable(
  table: TableInfo,
  item: PlanningMatrixItem,
  payload: OfficialPlanningPayload,
): string {
  const header = findTrimestralTableHeaderRow(table);
  const hasColumnHeader = isPlanningHeaderText(header.text);
  const dataRows = hasColumnHeader
    ? table.rows.filter((row) => isDataRowAfterHeader(row, header))
    : [];
  const isExperiencias = isTrimestralExperienciasTable(table);

  const rowReplacements = table.rows.map((row) => {
    if (isTrimestralAulaTitleRow(row)) {
      const trimItem = trimestralMatrixItem(item);
      const value = `${getTrimestre(payload)}º trimestre — Aula ${formatMatrixAulaLabel(trimItem)}`;
      return replaceCellsInRow(row.xml, [value]);
    }

    if (isExperiencias && classifyTrimestralExperienciasRow(row)) {
      return fillTrimestralExperienciasRow(row, item, weeklyPeriodsForPayload(payload));
    }

    if (isTrimestralMatrixLabelDataRow(row)) {
      const labelFill = fillTrimestralLabelRow(row, item, payload);
      if (labelFill !== row.xml) {
        return labelFill;
      }
    }

    const dataIndex = dataRows.findIndex((dataRow) => dataRow.start === row.start);

    if (dataIndex === 0) {
      return replaceCellsInRow(row.xml, valuesForPlanningRow(payload, item, header.cells, false));
    }

    if (dataIndex > 0) {
      return clearCellsInRow(row.xml);
    }

    if (row.start > header.start) {
      const labelFill = fillTrimestralLabelRow(row, item, payload);
      if (labelFill !== row.xml) {
        return labelFill;
      }
    }

    if (row.start > header.start && isProjectOrEvaluationContentRow(row)) {
      return fillProjectAndEvaluationRows(row, [item], payload);
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
  const block = chooseTrimestralPlanningBlock(tables);

  if (!block) {
    throw new Error(
      "Não localizei no modelo trimestral a tabela de Objetos de Conhecimento, Habilidades, Metodologia, Recursos e Avaliação.",
    );
  }

  const filledBlocks = baseItems
    .map((item) => fillOneTrimestralBlock(block, item, payload))
    .join("<w:p><w:r><w:t xml:space=\"preserve\"> </w:t></w:r></w:p>");

  const merged = documentXml.slice(0, block.start) + filledBlocks + documentXml.slice(block.end);

  return sweepUnresolvedPlaceholders(merged, baseItems, payload);
}

function sweepUnresolvedPlaceholders(
  documentXml: string,
  items: PlanningMatrixItem[],
  payload: OfficialPlanningPayload,
): string {
  const item = items[0] || items[items.length - 1];
  const tables = parseTables(documentXml);

  const tableReplacements = tables.map((table) => {
    const rowReplacements = table.rows.map((row) => {
      if (isWeekDistributionRow(row) || classifyTrimestralExperienciasRow(row)) {
        return row.xml;
      }

      const hasPlaceholder = row.cells.some((cell) => isTemplatePlaceholderText(cell.text));

      if (!hasPlaceholder) {
        return row.xml;
      }

      const labelFill = fillTrimestralLabelRow(row, item, payload);
      if (labelFill !== row.xml) {
        return labelFill;
      }

      if (isProjectOrEvaluationContentRow(row)) {
        return fillProjectAndEvaluationRows(row, [item], payload);
      }

      return row.xml;
    });

    if (rowReplacements.every((xml, index) => xml === table.rows[index]?.xml)) {
      return table.xml;
    }

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

  if (tableReplacements.every((xml, index) => xml === tables[index]?.xml)) {
    return documentXml;
  }

  return replaceInXml(
    documentXml,
    tables.map((table) => ({
      start: table.start,
      end: table.end,
      xml: table.xml,
    })),
    tableReplacements,
  );
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
  const matrix = getMatrix(payload);

  output = fillIdentificationTables(output, payload);

  if (getTipo(payload) === "trimestral") {
    output = fillTrimestralPlanningTable(output, payload);
  } else {
    output = fillAnnualPlanningTables(output, payload);
    output = sweepUnresolvedPlaceholders(output, matrix, payload);
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

function trimestralMatrizHasPipeline(matriz: PlanningAiResult["planejamento"] | undefined): boolean {
  return Boolean(
    matriz?.conteudos?.some((item) =>
      item.semanas?.some((semana) => Boolean(semana.etapas?.trim())),
    ),
  );
}

function ensureTrimestralPipelineMatriz(
  payload: OfficialPlanningPayload,
): OfficialPlanningPayload {
  if (getTipo(payload) !== "trimestral") {
    return payload;
  }

  const matriz = payload.matrizPlanejamento;
  if (!matriz?.conteudos?.length || trimestralMatrizHasPipeline(matriz)) {
    return payload;
  }

  const trimestre = Number(getTrimestre(payload)) || 1;

  const plano = runTrimestralPipelineOnItems(matriz.conteudos, trimestre, {
    cargaHoraria: getString(payload, ["cargaHoraria"], ""),
    componenteCurricular: getString(payload, ["componenteCurricular", "componente"], ""),
  });

  return {
    ...payload,
    matrizPlanejamento: {
      ...matriz,
      conteudos: matrixItemsFromTrimestralPlano(plano, trimestre),
    },
  };
}

export function buildOfficialPlanningDocx(
  payload: OfficialPlanningPayload,
  options?: { documentType?: string | null; documentId?: string | null },
): Buffer {
  const normalizedPayload = ensureTrimestralPipelineMatriz(
    normalizeOfficialPlanningPayload(
      payload,
      options?.documentType,
      options?.documentId,
    ),
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

  entries.set("word/document.xml", fillOfficialTemplateXml(originalXml, normalizedPayload));

  return buildZipFromEntries(entries);
}
