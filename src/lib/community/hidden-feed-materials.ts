const STORAGE_KEY = "planify:community:hidden-feed-materials";
const MAX_HIDDEN = 500;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function readHiddenIds(): string[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((id) => String(id)).filter(Boolean);
  } catch {
    return [];
  }
}

function writeHiddenIds(ids: string[]): void {
  if (!canUseStorage()) {
    return;
  }

  const unique = Array.from(new Set(ids)).slice(0, MAX_HIDDEN);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function getHiddenFeedMaterialIds(): Set<string> {
  return new Set(readHiddenIds());
}

export function setHiddenFeedMaterialIds(ids: Iterable<string>): void {
  writeHiddenIds([...ids]);
}

export function isFeedMaterialHidden(materialId: string): boolean {
  return getHiddenFeedMaterialIds().has(materialId);
}

export function hideFeedMaterial(materialId: string): void {
  const id = String(materialId || "").trim();
  if (!id) {
    return;
  }

  const next = readHiddenIds().filter((candidate) => candidate !== id);
  next.unshift(id);
  writeHiddenIds(next);
}

export function unhideFeedMaterial(materialId: string): void {
  const id = String(materialId || "").trim();
  if (!id) {
    return;
  }

  writeHiddenIds(readHiddenIds().filter((candidate) => candidate !== id));
}

export function clearHiddenFeedMaterials(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export async function fetchHiddenFeedMaterialIds(): Promise<string[]> {
  const response = await fetch("/api/community/hidden-feed-materials", {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    return readHiddenIds();
  }
  const ids = Array.isArray(data.materialIds)
    ? data.materialIds.map((id: unknown) => String(id)).filter(Boolean)
    : [];
  setHiddenFeedMaterialIds(ids);
  return ids;
}

export async function migrateLocalHiddenFeedMaterialsToServer(): Promise<void> {
  const localIds = readHiddenIds();
  if (localIds.length === 0) {
    return;
  }

  await fetch("/api/community/hidden-feed-materials", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync", materialIds: localIds }),
  }).catch(() => {});
}

export async function hideFeedMaterialOnServer(materialId: string): Promise<void> {
  const id = String(materialId || "").trim();
  if (!id) return;

  hideFeedMaterial(id);

  const response = await fetch("/api/community/hidden-feed-materials", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "hide", materialId: id }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data?.error?.message || "Não foi possível ocultar o material.");
  }
}

export async function unhideFeedMaterialOnServer(materialId: string): Promise<void> {
  const id = String(materialId || "").trim();
  if (!id) return;

  unhideFeedMaterial(id);

  const response = await fetch("/api/community/hidden-feed-materials", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unhide", materialId: id }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data?.error?.message || "Não foi possível restaurar o material.");
  }
}
