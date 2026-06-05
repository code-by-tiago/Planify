import {
  buildHistoryContentPreview,
  historyItemNeedsPreviewNormalize,
} from "./history-preview";
import type { EditorDocument } from "../../types/editor";
import type { HistoryFilter, HistoryItem } from "../../types/history";
import { editorDocumentToHistoryItem } from "../../types/history";
import { saveHistoryItemToAPI } from "./history-api-client";

const HISTORY_KEY = "planify:history:items";
const MAX_HISTORY_ITEMS = 80;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function safeParseHistory(raw: string | null): HistoryItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as HistoryItem[];
  } catch {
    return [];
  }
}

function shouldSyncSupabase(): boolean {
  if (!canUseStorage()) {
    return false;
  }

  return window.localStorage.getItem("planify:history:sync-supabase") === "true";
}

export function setHistorySupabaseSync(enabled: boolean): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem("planify:history:sync-supabase", String(enabled));
}

export function getHistorySupabaseSync(): boolean {
  return shouldSyncSupabase();
}

function normalizeHistoryItem(item: HistoryItem): HistoryItem {
  const content = String(item.content || "");
  const createdAt = item.createdAt || item.updatedAt || new Date().toISOString();
  const updatedAt = item.updatedAt || createdAt;

  return {
    ...item,
    content,
    contentPreview: buildHistoryContentPreview(content),
    createdAt,
    updatedAt,
  };
}

export function loadHistoryItems(): HistoryItem[] {
  if (!canUseStorage()) {
    return [];
  }

  const parsed = safeParseHistory(window.localStorage.getItem(HISTORY_KEY));
  const normalized = parsed.map(normalizeHistoryItem);
  const shouldPersist = parsed.some((item, index) =>
    historyItemNeedsPreviewNormalize(item) ||
    item.contentPreview !== normalized[index]?.contentPreview,
  );

  if (shouldPersist) {
    saveHistoryItems(normalized);
  }

  return normalized;
}

export function saveHistoryItems(items: HistoryItem[]): void {
  if (!canUseStorage()) {
    return;
  }

  const normalized = items
    .filter((item) => item.id && item.title)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, MAX_HISTORY_ITEMS);

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
}

export function upsertHistoryItem(item: HistoryItem): HistoryItem[] {
  const current = loadHistoryItems();
  const withoutCurrent = current.filter((historyItem) => historyItem.id !== item.id);
  const next = [
    {
      ...item,
      contentPreview: buildHistoryContentPreview(item.content),
      updatedAt: item.updatedAt || new Date().toISOString(),
    },
    ...withoutCurrent,
  ];

  saveHistoryItems(next);

  if (shouldSyncSupabase()) {
    saveHistoryItemToAPI(next[0]).catch(() => {
      // Mantém o histórico local mesmo se a sincronização falhar.
    });
  }

  return next;
}

export function saveEditorDocumentToHistory(document: EditorDocument): HistoryItem[] {
  return upsertHistoryItem(editorDocumentToHistoryItem(document));
}

export function removeHistoryItem(id: string): HistoryItem[] {
  const next = loadHistoryItems().filter((item) => item.id !== id);
  saveHistoryItems(next);

  return next;
}

export function clearHistoryItems(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(HISTORY_KEY);
}

export function filterHistoryItems(items: HistoryItem[], filter: HistoryFilter): HistoryItem[] {
  const query = filter.query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      (item.subtitle || "").toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query);

    const matchesSource = filter.source === "todos" || item.source === filter.source;
    const matchesType = filter.type === "todos" || item.type === filter.type;
    const matchesStatus = filter.status === "todos" || item.status === filter.status;

    return matchesQuery && matchesSource && matchesType && matchesStatus;
  });
}

export function getHistoryTypeOptions(items: HistoryItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.type).filter(Boolean))).sort();
}
