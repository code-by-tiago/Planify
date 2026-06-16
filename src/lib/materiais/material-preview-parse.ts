/** Client-side parsers for generated material HTML — preview UI only, no engine changes. */

function parseDoc(html: string): Document | null {
  if (typeof DOMParser === "undefined") return null;
  try {
    return new DOMParser().parseFromString(html, "text/html");
  } catch {
    return null;
  }
}

export function parseSlidesFromHtml(html: string): string[] {
  const doc = parseDoc(html);
  if (!doc) return [];
  return Array.from(doc.querySelectorAll(".planify-slide")).map((node) => node.outerHTML);
}

export type ParsedQuestionPreview = {
  number: string;
  label: string;
  html: string;
};

export function parseQuestionsFromHtml(html: string): ParsedQuestionPreview[] {
  const doc = parseDoc(html);
  if (!doc) return [];
  const cards = doc.querySelectorAll(".planify-questao-card, article.planify-questao");
  return Array.from(cards).map((card, index) => {
    const badge = card.querySelector(".planify-questao-number-badge");
    const labelEl = card.querySelector(".planify-questao-number-label");
    const number = badge?.textContent?.trim() || String(index + 1);
    const label = labelEl?.textContent?.trim() || `Questão ${number}`;
    return { number, label, html: card.outerHTML };
  });
}

export type ParsedFlashcardPreview = {
  index: number;
  front: string;
  back: string;
};

export function parseFlashcardsFromHtml(html: string): ParsedFlashcardPreview[] {
  const doc = parseDoc(html);
  if (!doc) return [];
  return Array.from(doc.querySelectorAll(".planify-flashcard")).map((card, index) => {
    const divs = card.querySelectorAll(":scope > div");
    const front =
      divs[1]?.textContent?.trim() ||
      card.querySelector("div[style*='font-weight:800']")?.textContent?.trim() ||
      "";
    const back = divs[divs.length - 1]?.textContent?.trim() || "";
    return { index: index + 1, front, back };
  });
}

export type ParsedSectionPreview = {
  id: string;
  title: string;
  html: string;
};

export function parseSectionsFromHtml(html: string): ParsedSectionPreview[] {
  const doc = parseDoc(html);
  if (!doc) return [];

  const docSections = doc.querySelectorAll(".planify-doc-section");
  if (docSections.length > 0) {
    return Array.from(docSections).map((section, index) => {
      const title =
        section.querySelector("h2")?.textContent?.trim() ||
        `Seção ${index + 1}`;
      return {
        id: `sec-${index}`,
        title,
        html: section.outerHTML,
      };
    });
  }

  const topSections = Array.from(doc.querySelectorAll("main > section, .planify-export-document > section")).filter(
    (section) => {
      const cls = section.className || "";
      return (
        !cls.includes("planify-slide-deck") &&
        !cls.includes("planify-flashcards") &&
        !cls.includes("planify-mindmap") &&
        !cls.includes("planify-questoes-block")
      );
    },
  );

  return topSections.map((section, index) => {
    const title =
      section.querySelector("h2, h3")?.textContent?.trim() ||
      `Etapa ${index + 1}`;
    return {
      id: `sec-${index}`,
      title,
      html: section.outerHTML,
    };
  });
}

export function hasMindMapInHtml(html: string): boolean {
  const doc = parseDoc(html);
  return Boolean(doc?.querySelector(".planify-mindmap"));
}

export function extractSupplementHtml(html: string, excludeSelectors: string[]): string {
  const doc = parseDoc(html);
  if (!doc) return "";
  const main = doc.querySelector("main") || doc.body;
  excludeSelectors.forEach((selector) => {
    main.querySelectorAll(selector).forEach((node) => node.remove());
  });
  const remaining = main.innerHTML.trim();
  return remaining.length > 40 ? remaining : "";
}
