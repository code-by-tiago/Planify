/** Legado: usado apenas por POST /api/documentos/docx com JSON estruturado. */
export const EDITOR_DOCX_SUBTITLE = "Documento editado no Editor Planify";
export const EDITOR_DOCX_BADGE = "Planify";
export const EDITOR_DOCX_SECTION_TITLE = "Conteúdo editado";

export function normalizeEditorPlainText(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function buildEditorDocxDocumentInput(title: string, plainTextContent: string) {
  const content = normalizeEditorPlainText(plainTextContent);

  return {
    title: title.trim() || "Documento Planify",
    subtitle: EDITOR_DOCX_SUBTITLE,
    badge: EDITOR_DOCX_BADGE,
    sections: [
      {
        title: EDITOR_DOCX_SECTION_TITLE,
        content: content || "Documento sem conteúdo.",
      },
    ],
  };
}
