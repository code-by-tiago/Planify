const STORAGE_KEY = "planify:community:saved-discussions";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function getSavedDiscussionIds(): Set<string> {
  return new Set(readIds());
}

export function isDiscussionSaved(id: string): boolean {
  return getSavedDiscussionIds().has(id);
}

export function toggleSavedDiscussion(id: string): boolean {
  const ids = getSavedDiscussionIds();
  const next = !ids.has(id);
  if (next) ids.add(id);
  else ids.delete(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  return next;
}
