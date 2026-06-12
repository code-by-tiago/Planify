import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";

export type MaterialExportKind = "slides" | "quiz" | "planejamento" | "document";

export type ClassroomExportFormat = "pdf" | "docx";

/** Detecta provas, listas e jogos pelo HTML ou metadado do documento. */
export function isQuizMaterialHtml(html: string): boolean {
  if (!html?.trim()) return false;
  return /planify-questao/i.test(html);
}

/** Jogos visuais (cruzadinha, caça-palavras, bingo…) — PDF preserva a grade. */
export function isVisualGameHtml(html: string): boolean {
  if (!html?.trim()) return false;
  return /planify-game-table|planify-jogo-visual|planify-game-section/i.test(html);
}

/** Materiais com layout fixo que degradam em DOCX (flashcards, mapa mental). */
export function isFixedLayoutVisualHtml(html: string): boolean {
  if (!html?.trim()) return false;
  return /planify-flashcard|planify-mindmap/i.test(html);
}

/** Classifica o material para escolher o formato de exportação ao Classroom. */
export function detectMaterialExportKind(
  html: string,
  documentType?: string | null,
): MaterialExportKind {
  const type = String(documentType || "").toLowerCase();

  if (type.includes("slides") || isSlideDeckHtml(html)) {
    return "slides";
  }

  if (
    type.includes("prova") ||
    type.includes("lista") ||
    type.includes("quiz") ||
    type.includes("jogo") ||
    type.includes("flashcards") ||
    type.includes("mapa-mental") ||
    isQuizMaterialHtml(html) ||
    isVisualGameHtml(html) ||
    isFixedLayoutVisualHtml(html)
  ) {
    return "quiz";
  }

  if (type.includes("planejamento")) {
    return "planejamento";
  }

  if (
    /PLANEJAMENTO ANUAL|PLANEJAMENTO TRIMESTRAL|class="planify-doc"/i.test(html)
  ) {
    return "planejamento";
  }

  return "document";
}

/** Mapeia o tipo de material ao formato de arquivo enviado ao Google Drive/Classroom. */
export function resolveClassroomExportFormat(
  kind: MaterialExportKind,
): ClassroomExportFormat {
  switch (kind) {
    case "slides":
    case "quiz":
      return "pdf";
    default:
      return "docx";
  }
}

export function resolveClassroomExportForHtml(
  html: string,
  documentType?: string | null,
): ClassroomExportFormat {
  return resolveClassroomExportFormat(
    detectMaterialExportKind(html, documentType),
  );
}
