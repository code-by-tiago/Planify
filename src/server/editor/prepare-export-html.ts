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

function strengthenGameVisuals(root: Element) {
  for (const section of root.querySelectorAll("section")) {
    const html = section.innerHTML;
    if (
      html.includes("planify-game-table") ||
      html.includes("Cruzadinha") ||
      html.includes("Caça-palavras") ||
      html.includes("Bingo pedagógico")
    ) {
      section.classList.add("planify-game-section");
    }
  }

  for (const table of root.querySelectorAll("table.planify-game-table")) {
    const isCrosswordOrWordsearch =
      table.classList.contains("planify-game-table--crossword") ||
      table.classList.contains("planify-game-table--wordsearch");
    const isBingo = table.classList.contains("planify-game-table--bingo");
    const isGridGame = isCrosswordOrWordsearch || isBingo;

    table.setAttribute(
      "style",
      isGridGame
        ? isBingo
          ? "width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;"
          : "width:auto;border-collapse:separate;border-spacing:0;table-layout:fixed;"
        : "width:auto;border-collapse:collapse;table-layout:fixed;",
    );

    if (isBingo) {
      for (const cell of table.querySelectorAll("td, th")) {
        const isHeader = cell.tagName.toLowerCase() === "th";
        cell.setAttribute(
          "style",
          isHeader
            ? "box-shadow:inset 0 0 0 1px #111827;border:none;background:#e0f2fe;"
            : "box-shadow:inset 0 0 0 1px #111827;border:none;",
        );
      }
      continue;
    }

    if (!isCrosswordOrWordsearch) continue;

    for (const cell of table.querySelectorAll("td")) {
      const isBlock = cell.classList.contains("planify-game-cell--block");
      cell.setAttribute(
        "style",
        isBlock
          ? "box-shadow:inset 0 0 0 1px #94a3b8;border:none;background:#f1f5f9;"
          : "box-shadow:inset 0 0 0 1px #111827;border:none;",
      );
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
  strengthenGameVisuals(document.body);
  strengthenFlashcards(document.body);

  return document.body.innerHTML;
}
