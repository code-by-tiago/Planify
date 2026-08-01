<<<<<<< HEAD
import { parseHTML } from "linkedom";

/** Extrai word/document.xml de DOCX gerado por buildSimpleDocx (método store, sem compressão). */
export function extractDocxDocumentXml(buffer: Buffer): string | null {
  let offset = 0;

  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }
=======
import { inflateRawSync } from "node:zlib";
import { parseHTML } from "linkedom";

/**
 * Lê entradas ZIP via diretório central (compatível com DOCX do Word,
 * inclusive com data descriptors / compressão deflate).
 */
function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset < 0) return new Map();

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map<string, Buffer>();
  let pointer = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (pointer + 46 > buffer.length || buffer.readUInt32LE(pointer) !== 0x02014b50) {
      break;
    }

    const compression = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const fileNameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localHeaderOffset = buffer.readUInt32LE(pointer + 42);
    const fileName = buffer
      .subarray(pointer + 46, pointer + 46 + fileNameLength)
      .toString("utf8")
      .replace(/\\/g, "/");

    if (localHeaderOffset + 30 > buffer.length) {
      pointer += 46 + fileNameLength + extraLength + commentLength;
      continue;
    }

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

    try {
      if (compression === 0) {
        entries.set(fileName, Buffer.from(compressedData));
      } else if (compression === 8) {
        entries.set(fileName, inflateRawSync(compressedData));
      }
    } catch {
      // ignora entrada corrompida
    }

    pointer += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

/** Extrai word/document.xml de DOCX (Planify ou Word real). */
export function extractDocxDocumentXml(buffer: Buffer): string | null {
  try {
    const entries = readZipEntries(buffer);
    const xml = entries.get("word/document.xml");
    if (xml) return xml.toString("utf8");
  } catch {
    // fallback abaixo
  }

  // Fallback: varredura linear de local headers (DOCX sem compressão / Planify)
  let offset = 0;
  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
>>>>>>> origin/aplicar-melhorias-na-producao

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer
      .subarray(offset + 30, offset + 30 + fileNameLength)
<<<<<<< HEAD
      .toString("utf8");
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (name.replace(/\\/g, "/") === "word/document.xml" && compression === 0) {
      return data.toString("utf8");
=======
      .toString("utf8")
      .replace(/\\/g, "/");
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (name === "word/document.xml") {
      try {
        if (compression === 0) return data.toString("utf8");
        if (compression === 8) return inflateRawSync(data).toString("utf8");
      } catch {
        return null;
      }
>>>>>>> origin/aplicar-melhorias-na-producao
    }

    offset = dataStart + compressedSize;
  }

  return null;
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

<<<<<<< HEAD
=======
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findNextTagStart(xml: string, tagLocalName: string, from = 0): number {
  const openNeedle = `<w:${tagLocalName}`;
  let pos = from;

  while (pos < xml.length) {
    const idx = xml.indexOf(openNeedle, pos);
    if (idx < 0) return -1;

    const next = xml[idx + openNeedle.length];
    if (next === ">" || next === " " || next === "/") {
      return idx;
    }

    pos = idx + 1;
  }

  return -1;
}

/** Extrai elementos OOXML balanceados (ex.: w:tbl, w:tr, w:tc, w:p). */
function extractBalancedElements(xml: string, tagLocalName: string): string[] {
  const openNeedle = `<w:${tagLocalName}`;
  const closeTag = `</w:${tagLocalName}>`;
  const results: string[] = [];
  let searchFrom = 0;

  while (searchFrom < xml.length) {
    const start = findNextTagStart(xml, tagLocalName, searchFrom);
    if (start < 0) break;

    const tagOpenEnd = xml.indexOf(">", start);
    if (tagOpenEnd < 0) break;

    if (xml[tagOpenEnd - 1] === "/") {
      results.push(xml.slice(start, tagOpenEnd + 1));
      searchFrom = tagOpenEnd + 1;
      continue;
    }

    let depth = 1;
    let pos = tagOpenEnd + 1;

    while (depth > 0 && pos < xml.length) {
      const nextOpen = findNextTagStart(xml, tagLocalName, pos);
      const nextClose = xml.indexOf(closeTag, pos);
      if (nextClose < 0) break;

      if (nextOpen >= 0 && nextOpen < nextClose) {
        const innerOpenEnd = xml.indexOf(">", nextOpen);
        if (innerOpenEnd >= 0 && xml[innerOpenEnd - 1] !== "/") {
          depth += 1;
        }
        pos = innerOpenEnd >= 0 ? innerOpenEnd + 1 : nextOpen + openNeedle.length;
      } else {
        depth -= 1;
        if (depth === 0) {
          const end = nextClose + closeTag.length;
          results.push(xml.slice(start, end));
          searchFrom = end;
        } else {
          pos = nextClose + closeTag.length;
        }
      }
    }

    if (depth !== 0) break;
  }

  return results;
}

function extractNextBlock(
  xml: string,
  from: number,
  tagNames: string[],
): { block: string; end: number } | null {
  let bestStart = -1;
  let bestTag: string | null = null;

  for (const tag of tagNames) {
    const idx = findNextTagStart(xml, tag, from);
    if (idx >= 0 && (bestStart < 0 || idx < bestStart)) {
      bestStart = idx;
      bestTag = tag;
    }
  }

  if (bestStart < 0 || !bestTag) return null;

  const [block] = extractBalancedElements(xml.slice(bestStart), bestTag);
  if (!block) return null;

  return { block, end: bestStart + block.length };
}

>>>>>>> origin/aplicar-melhorias-na-producao
function paragraphStyle(paragraphXml: string): string | null {
  const match = paragraphXml.match(/<w:pStyle w:val="([^"]+)"/);
  return match?.[1] ?? null;
}

function paragraphText(paragraphXml: string): string {
  const parts: string[] = [];
<<<<<<< HEAD
  const textMatches = paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);

  for (const match of textMatches) {
    parts.push(decodeXmlText(match[1] || ""));
=======
  let pos = 0;

  while (pos < paragraphXml.length) {
    const start = findNextTagStart(paragraphXml, "t", pos);
    if (start < 0) break;

    const openEnd = paragraphXml.indexOf(">", start);
    if (openEnd < 0) break;

    const closeTag = "</w:t>";
    const closeStart = paragraphXml.indexOf(closeTag, openEnd + 1);
    if (closeStart < 0) break;

    parts.push(decodeXmlText(paragraphXml.slice(openEnd + 1, closeStart)));
    pos = closeStart + closeTag.length;
>>>>>>> origin/aplicar-melhorias-na-producao
  }

  return parts.join("").replace(/\s+/g, " ").trim();
}

<<<<<<< HEAD
function tableToHtml(tableXml: string): string {
  const rows = [...tableXml.matchAll(/<w:tr>([\s\S]*?)<\/w:tr>/g)];
  const body = rows
    .map((rowMatch) => {
      const cells = [...rowMatch[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)];
      const tds = cells
        .map((cellMatch) => {
          const text = paragraphText(cellMatch[1]);
          const bold = /<w:b\s*\/>/.test(cellMatch[1]) ? "font-weight:700;" : "";
          return `<td style="border:1px solid #cbd5e1;padding:8px;${bold}">${text}</td>`;
=======
function cellColSpan(cellXml: string): number {
  const match = cellXml.match(/<w:gridSpan w:val="(\d+)"/);
  const value = match ? Number(match[1]) : 1;
  return Number.isFinite(value) && value > 1 ? value : 1;
}

function cellStartsRowSpan(cellXml: string): boolean {
  return /<w:vMerge[^>]*w:val="restart"/.test(cellXml);
}

function cellContinuesRowSpan(cellXml: string): boolean {
  if (/<w:vMerge[^>]*w:val="restart"/.test(cellXml)) return false;
  return /<w:vMerge\b/.test(cellXml);
}

function cellBackground(cellXml: string): string | null {
  const match = cellXml.match(/<w:shd[^>]*w:fill="([^"]+)"/);
  const fill = match?.[1]?.toUpperCase();
  if (!fill || fill === "AUTO" || fill === "FFFFFF") return null;
  return `#${fill}`;
}

function cellIsBold(cellXml: string): boolean {
  return /<w:b(?:\s|\/>| w:val="1")/.test(cellXml);
}

function stripCellWrapper(cellXml: string): string {
  return cellXml.replace(/^<w:tc(?:\s[^>]*)?>/, "").replace(/<\/w:tc>\s*$/, "");
}

function cellContentHtml(cellXml: string): string {
  let inner = stripCellWrapper(cellXml);
  const tcPrBlocks = extractBalancedElements(inner, "tcPr");
  for (const tcPr of tcPrBlocks) {
    inner = inner.replace(tcPr, "");
  }

  const parts: string[] = [];
  let pos = 0;

  while (pos < inner.length) {
    const next = extractNextBlock(inner, pos, ["tbl", "p"]);
    if (!next) break;

    const { block, end } = next;
    if (block.startsWith("<w:tbl")) {
      parts.push(tableToHtml(block));
    } else {
      const text = paragraphText(block);
      if (text) parts.push(escapeHtml(text));
    }

    pos = end;
  }

  return parts.join("<br />") || "&nbsp;";
}

function tableToHtml(tableXml: string): string {
  const rows = extractBalancedElements(tableXml, "tr");
  const rowCells = rows.map((rowXml) => extractBalancedElements(rowXml, "tc"));

  // Pré-calcula rowspan a partir de w:vMerge (restart + continue).
  const rowSpanMap: number[][] = rowCells.map((cells) => cells.map(() => 1));
  const skipCell: boolean[][] = rowCells.map((cells) => cells.map(() => false));

  for (let col = 0; col < 32; col += 1) {
    let spanStart = -1;
    for (let row = 0; row < rowCells.length; row += 1) {
      const cellXml = rowCells[row][col];
      if (!cellXml) {
        spanStart = -1;
        continue;
      }

      if (cellStartsRowSpan(cellXml)) {
        spanStart = row;
        rowSpanMap[row][col] = 1;
      } else if (spanStart >= 0 && cellContinuesRowSpan(cellXml)) {
        rowSpanMap[spanStart][col] += 1;
        skipCell[row][col] = true;
      } else {
        spanStart = -1;
      }
    }
  }

  const body = rowCells
    .map((cells, rowIndex) => {
      const tds = cells
        .map((cellXml, colIndex) => {
          if (skipCell[rowIndex]?.[colIndex]) {
            return "";
          }

          const text = cellContentHtml(cellXml);
          const bold = cellIsBold(cellXml) ? "font-weight:700;" : "";
          const background = cellBackground(cellXml);
          const bgStyle = background ? `background:${background};` : "";
          const colspan = cellColSpan(cellXml);
          const rowspan = rowSpanMap[rowIndex]?.[colIndex] ?? 1;
          const spanAttr = [
            colspan > 1 ? ` colspan="${colspan}"` : "",
            rowspan > 1 ? ` rowspan="${rowspan}"` : "",
          ].join("");
          return `<td style="border:1px solid #111827;padding:6px 8px;vertical-align:top;${bold}${bgStyle}"${spanAttr}>${text}</td>`;
>>>>>>> origin/aplicar-melhorias-na-producao
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

<<<<<<< HEAD
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${body}</table>`;
}

/** Converte DOCX Planify (buildSimpleDocx) em HTML para o editor. */
export function convertSimpleDocxToHtml(buffer: Buffer, fallbackTitle = "Material"): string {
  const documentXml = extractDocxDocumentXml(buffer);
  if (!documentXml) {
    return `<article><h1>${fallbackTitle}</h1><p>Não foi possível ler o conteúdo do documento.</p></article>`;
  }

  const bodyMatch = documentXml.match(/<w:body>([\s\S]*)<\/w:sectPr/);
  const bodyXml = bodyMatch?.[1] || "";
  const chunks: string[] = [];
  const tokenRegex = /<(w:p|w:tbl)>[\s\S]*?<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(bodyXml)) !== null) {
    const block = match[0];

    if (block.startsWith("<w:tbl>")) {
      chunks.push(tableToHtml(block));
      continue;
    }

    const style = paragraphStyle(block);
    const text = paragraphText(block);
    if (!text) continue;

    if (style === "Title") {
      chunks.push(`<h1 style="margin:0 0 12px;">${text}</h1>`);
    } else if (style === "Subtitle") {
      chunks.push(`<p style="color:#475569;margin:0 0 16px;">${text}</p>`);
    } else if (style === "Heading1") {
      chunks.push(`<h2 style="color:#0f766e;margin:24px 0 8px;">${text}</h2>`);
    } else if (style === "Badge" || style === "Small") {
      chunks.push(`<p style="color:#64748b;font-size:12px;margin:0 0 8px;">${text}</p>`);
    } else if (text.startsWith("• ")) {
      chunks.push(`<p style="margin:4px 0 4px 16px;">${text}</p>`);
    } else {
      chunks.push(`<p style="margin:8px 0;">${text}</p>`);
    }
  }

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${chunks.join("")}</body></html>`,
=======
  return `<table style="width:100%;border-collapse:collapse;margin:10px 0 16px;table-layout:fixed;">${body}</table>`;
}

function paragraphToHtml(block: string): string | null {
  const style = paragraphStyle(block);
  const text = paragraphText(block);
  if (!text) return null;

  const safe = escapeHtml(text);

  if (style === "Title" || style === "TitleChar") {
    return `<h1 style="margin:0 0 12px;text-align:center;font-weight:800;">${safe}</h1>`;
  }
  if (style === "Subtitle") {
    return `<p style="color:#475569;margin:0 0 16px;text-align:center;">${safe}</p>`;
  }
  if (style === "Heading1" || style === "heading 1") {
    return `<h2 style="color:#0f766e;margin:24px 0 8px;">${safe}</h2>`;
  }
  if (style === "Heading2" || style === "heading 2") {
    return `<h3 style="margin:16px 0 8px;">${safe}</h3>`;
  }
  if (style === "Badge" || style === "Small") {
    return `<p style="color:#64748b;font-size:12px;margin:0 0 8px;">${safe}</p>`;
  }
  if (text.startsWith("• ") || text.startsWith("- ")) {
    return `<p style="margin:4px 0 4px 16px;">${safe}</p>`;
  }

  return `<p style="margin:8px 0;">${safe}</p>`;
}

function bodyXmlToChunks(bodyXml: string): string[] {
  const chunks: string[] = [];
  let pos = 0;

  while (pos < bodyXml.length) {
    const remainder = bodyXml.slice(pos).trimStart();
    if (remainder.startsWith("<w:sectPr")) break;

    const next = extractNextBlock(bodyXml, pos, ["tbl", "p"]);
    if (!next) break;

    const { block, end } = next;
    if (block.startsWith("<w:tbl")) {
      chunks.push(tableToHtml(block));
    } else {
      const paragraphHtml = paragraphToHtml(block);
      if (paragraphHtml) chunks.push(paragraphHtml);
    }

    pos = end;
  }

  return chunks;
}

/** Converte DOCX (Planify ou Word) em HTML para prévia / editor / Google. */
export function convertSimpleDocxToHtml(buffer: Buffer, fallbackTitle = "Material"): string {
  const documentXml = extractDocxDocumentXml(buffer);
  if (!documentXml) {
    return `<article><h1>${escapeHtml(fallbackTitle)}</h1><p>Não foi possível ler o conteúdo do documento. Baixe o arquivo original para abrir no Word ou Google Docs.</p></article>`;
  }

  const bodyMatch =
    documentXml.match(/<w:body[^>]*>([\s\S]*?)(?:<w:sectPr[\s>][\s\S]*?<\/w:sectPr>)?\s*<\/w:body>/) ||
    documentXml.match(/<w:body[^>]*>([\s\S]*)<\/w:sectPr/);
  const bodyXml = bodyMatch?.[1] || "";
  const chunks = bodyXmlToChunks(bodyXml);

  if (chunks.length === 0) {
    return `<article><h1>${escapeHtml(fallbackTitle)}</h1><p>Documento sem texto legível na prévia. Baixe o arquivo original para abrir no Word ou Google Docs.</p></article>`;
  }

  const joined = chunks.join("");
  if (/<w:[a-z]/i.test(joined) || /&lt;w:[a-z]/i.test(joined)) {
    throw new Error(
      "Conversão DOCX→HTML gerou vazamento OOXML. O modelo oficial não pode ser aberto no editor neste estado.",
    );
  }

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${joined}</body></html>`,
>>>>>>> origin/aplicar-melhorias-na-producao
  );

  return `<article class="planify-doc" style="font-family:Arial,sans-serif;line-height:1.55;">${document.body.innerHTML}</article>`;
}
