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

export type EditorStoredPayload = {
  source?: EditorDocumentSource;
  subtitle?: string;
  raw?: unknown;
  id?: string;
};

function inferEditorSource(
  type: string | undefined,
  payload?: EditorStoredPayload,
  existing?: EditorDocument | null,
): EditorDocumentSource {
  if (payload?.source) {
    return payload.source;
  }

  if (existing?.source) {
    return existing.source;
  }

  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.startsWith("material:") || normalizedType.includes("material")) {
    return "material";
  }

  if (normalizedType.includes("planejamento")) {
    return "planejamento";
  }

  return "manual";
}

export function syncOpenDocumentToHistory(params: {
  title: string;
  content: string;
  type?: string;
  payload?: EditorStoredPayload;
}): EditorDocument {
  const existing = loadEditorDocument();
  const payload = params.payload;
  const id = String(payload?.id || existing?.id || "").trim() || createId();
  const type = params.type || existing?.type || "editor";

  const document: EditorDocument = {
    id,
    source: inferEditorSource(type, payload, existing),
    title: params.title.trim() || existing?.title || "Documento Planify",
    subtitle: payload?.subtitle || existing?.subtitle,
    type,
    content: params.content,
    raw: payload?.raw ?? existing?.raw,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveEditorDocument(document);
  return document;
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
    const parsed = JSON.parse(raw) as EditorDocument & {
      html?: string;
      payload?: EditorStoredPayload;
    };

    if (parsed.content && parsed.source) {
      return parsed;
    }

    const payload = parsed.payload;
    const type = parsed.type || "documento";
    const content = parsed.html || parsed.content || "";

    return {
      id: String(payload?.id || "").trim() || createId(),
      source: inferEditorSource(type, payload),
      title: parsed.title || "Documento Planify",
      subtitle: payload?.subtitle,
      type,
      content,
      raw: payload?.raw,
      createdAt: parsed.updatedAt || new Date().toISOString(),
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
