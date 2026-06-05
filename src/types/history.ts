import { buildHistoryContentPreview } from "../lib/history/history-preview";
import type { EditorDocument, EditorDocumentSource } from "./editor";

export type HistoryItemStatus = "rascunho" | "pronto" | "arquivado";

export type HistoryItem = {
  id: string;
  title: string;
  subtitle?: string;
  source: EditorDocumentSource;
  type: string;
  status: HistoryItemStatus;
  contentPreview: string;
  content: string;
  raw?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type HistoryFilter = {
  query: string;
  source: "todos" | EditorDocumentSource;
  type: "todos" | string;
  status: "todos" | HistoryItemStatus;
};

export function editorDocumentToHistoryItem(document: EditorDocument): HistoryItem {
  return {
    id: document.id,
    title: document.title,
    subtitle: document.subtitle,
    source: document.source,
    type: document.type,
    status: "rascunho",
    contentPreview: buildHistoryContentPreview(document.content),
    content: document.content,
    raw: document.raw,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
