import { parseHTML } from "linkedom";
import {
  enhanceHtmlForExport,
  extractBackgroundColorFromStyle,
  normalizeInlineStyle,
} from "../../lib/editor/enhance-export-html";

function applyBgcolorOnStyledElements(root: Element) {
  const elements = root.querySelectorAll("[style]");

  for (const element of elements) {
    const style = element.getAttribute("style") || "";
    const normalized = normalizeInlineStyle(style);
    element.setAttribute("style", normalized);

    const bgColor = extractBackgroundColorFromStyle(normalized);

    if (bgColor) {
      element.setAttribute("bgcolor", bgColor);
    }
  }
}

function strengthenFlashcards(root: Element) {
  const cards = root.querySelectorAll(".planify-flashcard");

  for (const card of cards) {
    card.setAttribute(
      "style",
      [
        "display:block",
        "width:100%",
        "max-width:340px",
        "margin:0 0 16px",
        "border-radius:16px",
        "overflow:hidden",
        "background:#ffffff",
        "break-inside:avoid",
        "page-break-inside:avoid",
      ].join(";"),
    );
  }
}

const TEACHER_NOTES_SLIDE_RE =
  /<div[^>]*>\s*<span[^>]*>Notas do professor<\/span>[\s\S]*?<\/div>/gi;

const TEACHER_NOTES_SECTION_RE =
  /<section[^>]*>\s*<h2[^>]*>\s*Notas para o professor[\s\S]*?<\/section>/gi;

/** Remove blocos internos de uso do professor (notas, metadados de deck). */
export function stripTeacherOnlyExportBlocks(html: string): string {
  let cleaned = String(html || "")
    .replace(TEACHER_NOTES_SLIDE_RE, "")
    .replace(TEACHER_NOTES_SECTION_RE, "");

  cleaned = cleaned.replace(
    /<section[^>]*class=["'][^"']*planify-slide-deck[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi,
    (_full, inner) => {
      const withoutMeta = inner.replace(
        /<p[^>]*>\s*Apresentação\s*[·•][\s\S]*?<\/p>/gi,
        "",
      );
      return withoutMeta.trim();
    },
  );

  return cleaned;
}

export function prepareHtmlForExport(html: string): string {
  const enhanced = enhanceHtmlForExport(html);
  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${enhanced}</body></html>`,
  );

  applyBgcolorOnStyledElements(document.body);
  strengthenFlashcards(document.body);

  return document.body.innerHTML;
}
