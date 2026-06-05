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

export function prepareHtmlForExport(html: string): string {
  const enhanced = enhanceHtmlForExport(html);
  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${enhanced}</body></html>`,
  );

  applyBgcolorOnStyledElements(document.body);
  strengthenFlashcards(document.body);

  return document.body.innerHTML;
}
