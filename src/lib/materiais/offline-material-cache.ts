export const OFFLINE_MATERIAL_CACHE_KEY = "planify:last-material-offline";

export type OfflineMaterialCache = {
  title: string;
  html: string;
  toolId: string;
  tema: string;
  savedAt: string;
};

export function saveOfflineMaterialCache(entry: OfflineMaterialCache): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(OFFLINE_MATERIAL_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota or private mode */
  }
}

export function loadOfflineMaterialCache(): OfflineMaterialCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(OFFLINE_MATERIAL_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<OfflineMaterialCache>;
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.html !== "string" ||
      !parsed.html.trim()
    ) {
      return null;
    }

    return {
      title: parsed.title,
      html: parsed.html,
      toolId: String(parsed.toolId || "material"),
      tema: String(parsed.tema || parsed.title),
      savedAt: String(parsed.savedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}
