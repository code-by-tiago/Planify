export type EditorDocumentSource =
  | "planejamento"
  | "material"
  | "manual"
  | "historico"
  | "biblioteca"
  | "marketplace";

export type EditorDocument = {
  id: string;
  source: EditorDocumentSource;
  title: string;
  subtitle?: string;
  type: string;
  content: string;
  raw?: unknown;
  createdAt: string;
  updatedAt: string;
};
