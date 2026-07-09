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

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer
      .subarray(offset + 30, offset + 30 + fileNameLength)
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

function paragraphStyle(paragraphXml: string): string | null {
  const match = paragraphXml.match(/<w:pStyle w:val="([^"]+)"/);
  return match?.[1] ?? null;
}

function paragraphText(paragraphXml: string): string {
  const parts: string[] = [];
  const textMatches = paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);

  for (const match of textMatches) {
    parts.push(decodeXmlText(match[1] || ""));
  }

  return parts.join("").replace(/\s+/g, " ").trim();
}

function tableToHtml(tableXml: string): string {
  const rows = [...tableXml.matchAll(/<w:tr[\s>][\s\S]*?<\/w:tr>/g)];
  const body = rows
    .map((rowMatch) => {
      const cells = [...rowMatch[0].matchAll(/<w:tc[\s>][\s\S]*?<\/w:tc>/g)];
      const tds = cells
        .map((cellMatch) => {
          const text = paragraphText(cellMatch[0]);
          const bold = /<w:b[\s/]/.test(cellMatch[0]) ? "font-weight:700;" : "";
          return `<td style="border:1px solid #cbd5e1;padding:8px;${bold}">${text || "&nbsp;"}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${body}</table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const chunks: string[] = [];
  const tokenRegex = /<(w:p|w:tbl)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(bodyXml)) !== null) {
    const block = match[0];

    if (block.startsWith("<w:tbl")) {
      chunks.push(tableToHtml(block));
      continue;
    }

    const style = paragraphStyle(block);
    const text = paragraphText(block);
    if (!text) continue;

    const safe = escapeHtml(text);

    if (style === "Title" || style === "TitleChar") {
      chunks.push(`<h1 style="margin:0 0 12px;">${safe}</h1>`);
    } else if (style === "Subtitle") {
      chunks.push(`<p style="color:#475569;margin:0 0 16px;">${safe}</p>`);
    } else if (style === "Heading1" || style === "heading 1") {
      chunks.push(`<h2 style="color:#0f766e;margin:24px 0 8px;">${safe}</h2>`);
    } else if (style === "Heading2" || style === "heading 2") {
      chunks.push(`<h3 style="margin:16px 0 8px;">${safe}</h3>`);
    } else if (style === "Badge" || style === "Small") {
      chunks.push(`<p style="color:#64748b;font-size:12px;margin:0 0 8px;">${safe}</p>`);
    } else if (text.startsWith("• ") || text.startsWith("- ")) {
      chunks.push(`<p style="margin:4px 0 4px 16px;">${safe}</p>`);
    } else {
      chunks.push(`<p style="margin:8px 0;">${safe}</p>`);
    }
  }

  if (chunks.length === 0) {
    return `<article><h1>${escapeHtml(fallbackTitle)}</h1><p>Documento sem texto legível na prévia. Baixe o arquivo original para abrir no Word ou Google Docs.</p></article>`;
  }

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${chunks.join("")}</body></html>`,
  );

  return `<article class="planify-doc" style="font-family:Arial,sans-serif;line-height:1.55;">${document.body.innerHTML}</article>`;
}
