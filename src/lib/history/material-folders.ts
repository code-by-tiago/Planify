import type { HistoryItem } from "@/types/history";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

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

function mergeFolders(
  current: MaterialFolder[],
  incoming: MaterialFolder[],
): MaterialFolder[] {
  const byKey = new Map<string, MaterialFolder>();
  for (const folder of current) {
    byKey.set(folderKey(folder.schoolLabel, folder.classLabel), folder);
  }
  for (const folder of incoming) {
    byKey.set(folderKey(folder.schoolLabel, folder.classLabel), folder);
  }
  return Array.from(byKey.values());
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

  // Mantém o servidor consistente sem bloquear o fluxo local/offline.
  void planifyAuthenticatedFetch("/api/history/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolLabel, classLabel }),
  }).catch(() => {
    /* segue local-first se a sincronização falhar */
  });

  return created;
}

/** Busca pastas salvas na conta e mescla com o localStorage (multi-dispositivo). */
export async function syncMaterialFoldersFromAPI(): Promise<MaterialFolder[]> {
  try {
    const response = await planifyAuthenticatedFetch("/api/history/folders");
    const data = (await response.json()) as {
      success?: boolean;
      folders?: MaterialFolder[];
    };
    if (!response.ok || !data.success || !Array.isArray(data.folders)) {
      return loadMaterialFolders();
    }
    const merged = mergeFolders(loadMaterialFolders(), data.folders);
    saveMaterialFolders(merged);
    return merged;
  } catch {
    return loadMaterialFolders();
  }
}

/** Cria uma pasta explicitamente a pedido do professor (UI "Nova pasta"). */
export async function createMaterialFolder(
  schoolLabelInput: string,
  classLabelInput: string,
): Promise<MaterialFolder | null> {
  const schoolLabel = schoolLabelInput.trim() || "Sem escola";
  const classLabel = classLabelInput.trim();
  if (!classLabel) return null;

  const folders = loadMaterialFolders();
  const existing = folders.find(
    (folder) =>
      folderKey(folder.schoolLabel, folder.classLabel) ===
      folderKey(schoolLabel, classLabel),
  );
  if (existing) return existing;

  try {
    const response = await planifyAuthenticatedFetch("/api/history/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolLabel, classLabel }),
    });
    const data = (await response.json()) as {
      success?: boolean;
      folder?: MaterialFolder;
      error?: { message?: string };
    };

    if (response.ok && data.success && data.folder) {
      saveMaterialFolders(mergeFolders(folders, [data.folder]));
      return data.folder;
    }
  } catch {
    /* cai para criação local-only abaixo */
  }

  const created: MaterialFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    schoolLabel,
    classLabel,
    createdAt: new Date().toISOString(),
  };
  saveMaterialFolders([created, ...folders]);
  return created;
}

/** Exclui a pasta na conta e localmente. Local-first: some da UI mesmo se a API falhar. */
export async function deleteMaterialFolder(folderId: string): Promise<boolean> {
  const folders = loadMaterialFolders();
  saveMaterialFolders(folders.filter((folder) => folder.id !== folderId));

  try {
    const response = await planifyAuthenticatedFetch(
      `/api/history/folders/${encodeURIComponent(folderId)}`,
      { method: "DELETE" },
    );
    return response.ok;
  } catch {
    return false;
  }
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
