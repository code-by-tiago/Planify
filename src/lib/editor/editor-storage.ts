import type { EditorDocument, EditorDocumentSource } from "../../types/editor";
import { saveEditorDocumentToHistory } from "../history/history-storage";

const EDITOR_DOCUMENT_KEY = "planify_editor_document";
const LEGACY_EDITOR_DOCUMENT_KEY = "planify:editor:document";
const EDITOR_CONTENT_KEY = "planify_editor_content";

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

  const editorPayload = {
    type: normalized.type,
    title: normalized.title,
    html: normalized.content,
    content: normalized.content,
    payload: {
      source: normalized.source,
      subtitle: normalized.subtitle,
      raw: normalized.raw,
      id: normalized.id,
    },
    updatedAt: normalized.updatedAt,
  };

  window.localStorage.setItem(EDITOR_DOCUMENT_KEY, JSON.stringify(editorPayload));
  window.localStorage.setItem(LEGACY_EDITOR_DOCUMENT_KEY, JSON.stringify(normalized));
  window.localStorage.setItem(EDITOR_CONTENT_KEY, normalized.content);
  saveEditorDocumentToHistory(normalized);
}

export function loadEditorDocument(): EditorDocument | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LEGACY_EDITOR_DOCUMENT_KEY) || window.localStorage.getItem(EDITOR_DOCUMENT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as EditorDocument & { html?: string; payload?: { source?: EditorDocumentSource; raw?: unknown } };

    if (parsed.content && parsed.source) {
      return parsed;
    }

    return {
      id: createId(),
      source: parsed.payload?.source || "material",
      title: parsed.title || "Documento Planify",
      subtitle: undefined,
      type: parsed.type || "documento",
      content: parsed.html || parsed.content || "",
      raw: parsed.payload?.raw,
      createdAt: new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearEditorDocument(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(EDITOR_DOCUMENT_KEY);
  window.localStorage.removeItem(LEGACY_EDITOR_DOCUMENT_KEY);
  window.localStorage.removeItem(EDITOR_CONTENT_KEY);
}
