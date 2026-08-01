import { parseHTML } from "linkedom";
import { normalizeEditorPlainText } from "../../lib/editor/editor-document-export";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

function readInnerText(node: Element): string {
  const tag = node.tagName.toUpperCase();

  if (SKIP_TAGS.has(tag)) {
    return "";
  }

  if (tag === "BR") {
    return "\n";
  }

  const inner = Array.from(node.childNodes)
    .map((child) => {
      if (child.nodeType === 3) {
        return child.textContent || "";
      }

      if (child.nodeType === 1) {
        return readInnerText(child as Element);
      }

      return "";
    })
    .join("");

  if (
    tag === "P" ||
    tag === "DIV" ||
    tag === "H1" ||
    tag === "H2" ||
    tag === "H3" ||
    tag === "H4" ||
    tag === "H5" ||
    tag === "H6" ||
    tag === "LI" ||
    tag === "TR" ||
    tag === "TABLE" ||
    tag === "SECTION" ||
    tag === "ARTICLE" ||
    tag === "FIGURE" ||
    tag === "BLOCKQUOTE" ||
    tag === "HEADER" ||
    tag === "FOOTER" ||
    tag === "MAIN" ||
    tag === "UL" ||
    tag === "OL" ||
    tag === "PRE" ||
    tag === "HR"
  ) {
    const trimmed = inner.trim();

    if (!trimmed) {
      return "\n";
    }

    return `${trimmed}\n`;
  }

  return inner;
}

export function extractBodyHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1]?.trim() || html.trim();
}

export function htmlToEditorPlainText(html: string): string {
  const bodyHtml = extractBodyHtml(html);
  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
  );
  const body = document.body;
  const linkedBody = body as unknown as {
    innerText?: string;
    textContent?: string | null;
  };

  const raw =
    typeof linkedBody.innerText === "string" && linkedBody.innerText.trim()
      ? linkedBody.innerText
      : readInnerText(body) || linkedBody.textContent || "";

  return normalizeEditorPlainText(raw);
}
