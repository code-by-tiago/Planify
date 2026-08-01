import { parseHTML } from "linkedom";

/** Extrai word/document.xml de DOCX gerado por buildSimpleDocx (método store, sem compressão). */
export function extractDocxDocumentXml(buffer: Buffer): string | null {
  let offset = 0;

  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }

    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer
      .subarray(offset + 30, offset + 30 + fileNameLength)
      .toString("utf8");
    const dataStart = offset + 30 + fileNameLength + extraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (name.replace(/\\/g, "/") === "word/document.xml" && compression === 0) {
      return data.toString("utf8");
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
  const rows = [...tableXml.matchAll(/<w:tr>([\s\S]*?)<\/w:tr>/g)];
  const body = rows
    .map((rowMatch) => {
      const cells = [...rowMatch[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)];
      const tds = cells
        .map((cellMatch) => {
          const text = paragraphText(cellMatch[1]);
          const bold = /<w:b\s*\/>/.test(cellMatch[1]) ? "font-weight:700;" : "";
          return `<td style="border:1px solid #cbd5e1;padding:8px;${bold}">${text}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

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
  );

  return `<article class="planify-doc" style="font-family:Arial,sans-serif;line-height:1.55;">${document.body.innerHTML}</article>`;
}
