import { parseHTML } from "linkedom";

type Primitive = string | number | boolean | null | undefined;

function escapeXml(value: Primitive): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanText(value: Primitive): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function textRuns(value: Primitive) {
  const lines = cleanText(value).split("\n");

  return lines
    .map((line, index) => {
      const escaped = escapeXml(line);
      const text = `<w:t xml:space="preserve">${escaped}</w:t>`;

      if (index === 0) {
        return text;
      }

      return `<w:br/>${text}`;
    })
    .join("");
}

function paragraph(value: Primitive, style?: string) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";

  return `<w:p>${styleXml}<w:r>${textRuns(text)}</w:r></w:p>`;
}

function bullet(value: Primitive) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  return `<w:p>
    <w:pPr>
      <w:pStyle w:val="ListParagraph"/>
      <w:ind w:left="720"/>
    </w:pPr>
    <w:r><w:t xml:space="preserve">• ${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function tableXml(table: Element): string {
  const rows = Array.from(table.querySelectorAll("tr"));

  if (rows.length === 0) {
    return "";
  }

  const rowXml = rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("th,td"));

      if (cells.length === 0) {
        return "";
      }

      const cellsXml = cells
        .map((cell) => {
          const isHeader = cell.tagName.toUpperCase() === "TH";
          const text = cleanText(cell.textContent || "");
          const shade = isHeader
            ? `<w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/>`
            : "";

          return `<w:tc>
            <w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${shade}</w:tcPr>
            <w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>
          </w:tc>`;
        })
        .join("");

      return `<w:tr>${cellsXml}</w:tr>`;
    })
    .join("");

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="9000" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
    </w:tblPr>
    ${rowXml}
  </w:tbl>`;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG"]);

const BLOCK_CONTAINERS = new Set([
  "ARTICLE",
  "SECTION",
  "MAIN",
  "DIV",
  "FIGURE",
  "HEADER",
  "FOOTER",
  "UL",
  "OL",
  "DL",
]);

function elementText(element: Element): string {
  return cleanText(element.textContent || "");
}

function hasElementChildren(element: Element): boolean {
  return Array.from(element.children).some(
    (child) => !SKIP_TAGS.has(child.tagName.toUpperCase()),
  );
}

function flashcardParts(card: Element): string[] {
  const chunks = Array.from(card.querySelectorAll("div, p, span, strong"))
    .map((node) => cleanText(node.textContent || ""))
    .filter(Boolean);

  const unique = [...new Set(chunks)].filter((item) => item.length > 1);

  if (unique.length === 0) {
    const fallback = elementText(card);
    return fallback ? [paragraph(fallback, "Heading1")] : [];
  }

  return unique.map((text, index) =>
    paragraph(text, index === 0 ? "Heading1" : undefined),
  );
}

function walkNode(node: Node, parts: string[]): void {
  if (node.nodeType === 3) {
    return;
  }

  if (node.nodeType !== 1) {
    return;
  }

  const element = node as Element;
  const tag = element.tagName.toUpperCase();

  if (SKIP_TAGS.has(tag)) {
    return;
  }

  if (element.classList.contains("planify-flashcard")) {
    parts.push(...flashcardParts(element));
    return;
  }

  if (element.classList.contains("planify-questao")) {
    const number = element.querySelector(".planify-questao-number");
    if (number) {
      parts.push(paragraph(elementText(number), "Heading1"));
    }

    const statement = element.querySelector(".planify-questao-statement");
    if (statement) {
      parts.push(paragraph(elementText(statement)));
    }

    const options = element.querySelectorAll(".planify-questao-options li");
    if (options.length) {
      for (const option of options) {
        parts.push(bullet(elementText(option)));
      }
    } else if (element.querySelector(".planify-answer-lines")) {
      parts.push(paragraph(" "));
      parts.push(paragraph(" "));
    }

    return;
  }

  if (
    element.classList.contains("planify-slide-deck") &&
    element.querySelector(".planify-slide")
  ) {
    for (const child of element.childNodes) {
      walkNode(child, parts);
    }
    return;
  }

  const firstHeading = element.children[0];
  if (
    firstHeading &&
    (firstHeading.tagName === "H2" || firstHeading.tagName === "H3") &&
    /notas para o professor/i.test(firstHeading.textContent || "")
  ) {
    return;
  }

  if (tag === "TABLE") {
    const table = tableXml(element);
    if (table) parts.push(table);
    return;
  }

  if (tag === "H1") {
    parts.push(paragraph(elementText(element), "Title"));
    return;
  }

  if (tag === "H2" || tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
    parts.push(paragraph(elementText(element), "Heading1"));
    return;
  }

  if (tag === "LI") {
    parts.push(bullet(elementText(element)));
    return;
  }

  if (tag === "P" || tag === "BLOCKQUOTE" || tag === "PRE") {
    parts.push(paragraph(elementText(element)));
    return;
  }

  if (tag === "HR") {
    parts.push(paragraph("—"));
    return;
  }

  if (BLOCK_CONTAINERS.has(tag)) {
    if (!hasElementChildren(element)) {
      const text = elementText(element);
      if (text) parts.push(paragraph(text));
      return;
    }

    for (const child of element.childNodes) {
      walkNode(child, parts);
    }
    return;
  }

  const text = elementText(element);
  if (text) {
    parts.push(paragraph(text));
  }
}

export function htmlBodyToWordXmlParts(htmlBody: string): string[] {
  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${htmlBody}</body></html>`,
  );

  const parts: string[] = [];

  for (const child of document.body.childNodes) {
    walkNode(child, parts);
  }

  const normalized = parts.filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  const fallback = cleanText(document.body.textContent || "");

  if (fallback) {
    return fallback
      .split(/\n{2,}/)
      .map((chunk) => paragraph(chunk))
      .filter(Boolean);
  }

  return [paragraph("Documento sem conteúdo exportável.")];
}

export function buildNativeDocumentBodyXml(title: string, htmlBody: string): string {
  const parts = htmlBodyToWordXmlParts(htmlBody);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraph("PLANIFY", "Badge")}
    ${paragraph(cleanText(title) || "Documento Planify", "Title")}
    ${paragraph(`Exportado em ${new Date().toLocaleDateString("pt-BR")}`, "Small")}
    ${parts.join("")}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}
