import type { HistoryItem } from "@/types/history";

const FOLDERS_KEY = "planify:material-folders";

export type MaterialFolder = {
  id: string;
  schoolLabel: string;
  classLabel: string;
  createdAt: string;
};

export type HistoryFolderMeta = {
  folderId?: string | null;
  schoolLabel?: string | null;
  classLabel?: string | null;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function safeParseFolders(raw: string | null): MaterialFolder[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MaterialFolder[]) : [];
  } catch {
    return [];
  }
}

export function loadMaterialFolders(): MaterialFolder[] {
  if (!canUseStorage()) return [];
  return safeParseFolders(window.localStorage.getItem(FOLDERS_KEY));
}

export function saveMaterialFolders(folders: MaterialFolder[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function folderKey(schoolLabel: string, classLabel: string): string {
  return `${schoolLabel.trim().toLowerCase()}::${classLabel.trim().toLowerCase()}`;
}

export function ensureMaterialFolder(input: {
  schoolLabel?: string | null;
  classLabel?: string | null;
}): MaterialFolder | null {
  const schoolLabel = String(input.schoolLabel || "").trim() || "Sem escola";
  const classLabel = String(input.classLabel || "").trim();
  if (!classLabel) return null;

  const folders = loadMaterialFolders();
  const existing = folders.find(
    (folder) =>
      folderKey(folder.schoolLabel, folder.classLabel) ===
      folderKey(schoolLabel, classLabel),
  );
  if (existing) return existing;

  const created: MaterialFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    schoolLabel,
    classLabel,
    createdAt: new Date().toISOString(),
  };
  saveMaterialFolders([created, ...folders]);
  return created;
}

export function getHistoryFolderMeta(item: HistoryItem): HistoryFolderMeta {
  const raw = (item.raw || {}) as Record<string, unknown>;
  return {
    folderId: (raw.folderId as string | null | undefined) ?? null,
    schoolLabel:
      (raw.schoolLabel as string | null | undefined) ||
      (raw.schoolName as string | null | undefined) ||
      null,
    classLabel:
      (raw.classLabel as string | null | undefined) ||
      (raw.className as string | null | undefined) ||
      (raw.turma as string | null | undefined) ||
      null,
  };
}

export function assignHistoryItemFolder(
  item: HistoryItem,
  folder: MaterialFolder | null,
): HistoryItem {
  const raw = {
    ...((item.raw as Record<string, unknown>) || {}),
    folderId: folder?.id || null,
    schoolLabel: folder?.schoolLabel || null,
    classLabel: folder?.classLabel || null,
  };
  return { ...item, raw, updatedAt: new Date().toISOString() };
}

export type FolderTreeNode = {
  schoolLabel: string;
  classes: Array<{
    folder: MaterialFolder;
    count: number;
  }>;
};

export function buildFolderTree(
  folders: MaterialFolder[],
  items: HistoryItem[],
): FolderTreeNode[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const meta = getHistoryFolderMeta(item);
    if (!meta.folderId && !meta.classLabel) continue;
    const key = meta.folderId || folderKey(meta.schoolLabel || "Sem escola", meta.classLabel || "");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const bySchool = new Map<string, FolderTreeNode>();
  for (const folder of folders) {
    const node =
      bySchool.get(folder.schoolLabel) ||
      ({ schoolLabel: folder.schoolLabel, classes: [] } satisfies FolderTreeNode);
    node.classes.push({
      folder,
      count: counts.get(folder.id) || counts.get(folderKey(folder.schoolLabel, folder.classLabel)) || 0,
    });
    bySchool.set(folder.schoolLabel, node);
  }

  return Array.from(bySchool.values()).sort((a, b) =>
    a.schoolLabel.localeCompare(b.schoolLabel, "pt-BR"),
  );
}

export function filterItemsByFolder(
  items: HistoryItem[],
  folderId: string | null,
): HistoryItem[] {
  if (!folderId) return items;
  if (folderId === "__inbox__") {
    return items.filter((item) => {
      const meta = getHistoryFolderMeta(item);
      return !meta.folderId && !meta.classLabel;
    });
  }
  return items.filter((item) => {
    const meta = getHistoryFolderMeta(item);
    return meta.folderId === folderId;
  });
}
