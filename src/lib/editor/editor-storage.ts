import type { EditorDocument, EditorDocumentSource } from "../../types/editor";
import { saveEditorDocumentToHistory } from "../history/history-storage";

const EDITOR_DOCUMENT_KEY = "planify:editor:document";

function createId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEditorDocument(params: {
  source: EditorDocumentSource;
  title: string;
  subtitle?: string;
  type: string;
  content: string;
  raw?: unknown;
}): EditorDocument {
  const now = new Date().toISOString();

  return {
    id: createId(),
    source: params.source,
    title: params.title,
    subtitle: params.subtitle,
    type: params.type,
    content: params.content,
    raw: params.raw,
    createdAt: now,
    updatedAt: now,
  };
}

export function saveEditorDocument(document: EditorDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized: EditorDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(EDITOR_DOCUMENT_KEY, JSON.stringify(normalized));
  saveEditorDocumentToHistory(normalized);
}

export function loadEditorDocument(): EditorDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(EDITOR_DOCUMENT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as EditorDocument;
  } catch {
    return null;
  }
}

export function clearEditorDocument(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EDITOR_DOCUMENT_KEY);
}
