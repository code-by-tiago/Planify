"use client";

import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HistoryFilter, HistoryItem } from "../../types/history";
import { HistoryDocumentExportBar } from "@/components/documents/HistoryDocumentExportBar";
import { getHistoryPlanningPayload } from "@/lib/documents/document-export-context";
import { extractComponenteFromPlanningPayload } from "@/lib/marketplace/marketplace-publish";
import { PlanifyMaterialHubCard } from "@/components/materials/PlanifyMaterialHubCard";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
<<<<<<< HEAD
import {
  buildHistoryContentPreview,
  historyItemContentToHtml,
  isHistoryHtmlContent,
=======
import { ShareMaterialLinkButton } from "@/components/share/ShareMaterialLinkButton";
import {
  buildHistoryContentPreview,
  historyItemContentToHtml,
>>>>>>> origin/aplicar-melhorias-na-producao
  resolveHistoryTypeLabel,
} from "../../lib/history/history-preview";
import { removeHistoryItemFromAPI } from "../../lib/history/history-api-client";
import {
  clearHistoryItems,
  filterHistoryItems,
  getHistorySupabaseSync,
  getHistoryTypeOptions,
  loadHistoryItemsWithSync,
  removeHistoryItem,
  removeHistoryItems,
<<<<<<< HEAD
} from "../../lib/history/history-storage";
=======
  upsertHistoryItem,
} from "../../lib/history/history-storage";
import {
  assignHistoryItemFolder,
  buildFolderTree,
  createMaterialFolder,
  deleteMaterialFolder,
  ensureMaterialFolder,
  filterItemsByFolder,
  getHistoryFolderMeta,
  loadMaterialFolders,
  syncMaterialFoldersFromAPI,
  type MaterialFolder,
} from "../../lib/history/material-folders";
>>>>>>> origin/aplicar-melhorias-na-producao
import { saveEditorDocument } from "../../lib/editor/editor-storage";
import { resolveHistoryItemForEditor } from "../../lib/history/history-editor-open";
import {
  buildMaterialEditorHref,
  migrateLegacyMaterialHistoryOnce,
} from "../../lib/materiais/material-editor-flow";
import {
  formatGenerationError,
  GenerationErrorBanner,
} from "@/lib/pro/generation-error-ui";

type StatusState = {
  type: "info" | "success" | "warning";
  message: string;
};

const initialFilter: HistoryFilter = {
  query: "",
  source: "todos",
  type: "todos",
  status: "todos",
};

const sourceLabels: Record<string, string> = {
  todos: "Todos",
  planejamento: "Planejamentos",
  material: "Materiais",
  manual: "Editor manual",
  historico: "Meus materiais",
  biblioteca: "Biblioteca",
  marketplace: "Comunidade",
};

function statusClass(type: StatusState["type"]) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function refreshHistoryState(): Promise<HistoryItem[]> {
  migrateLegacyMaterialHistoryOnce();
  return loadHistoryItemsWithSync();
}

<<<<<<< HEAD
function getSourceBadgeClass(source: string): string {
  if (source === "planejamento") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
  if (source === "material") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }
  if (source === "manual") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

=======
>>>>>>> origin/aplicar-melhorias-na-producao
function resolveMarketplaceTipo(item: HistoryItem): string {
  if (item.source === "planejamento") return "Planejamento";
  if (item.source === "manual") return "Material do editor";
  return resolveHistoryTypeLabel(item.type);
}

function resolveHistoricoComponente(item: HistoryItem): string | undefined {
  if (String(item.type || "").includes("planejamento")) {
    return extractComponenteFromPlanningPayload(getHistoryPlanningPayload(item));
  }
  const raw = item.raw as Record<string, unknown> | undefined;
  const direct = String(raw?.componenteCurricular || raw?.componente || "").trim();
  return direct || undefined;
}

export function HistoricoClient() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
<<<<<<< HEAD
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
=======
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
>>>>>>> origin/aplicar-melhorias-na-producao
  const [status, setStatus] = useState<StatusState | null>(null);
  const [exportError, setExportError] = useState("");
  const [exportErrorCta, setExportErrorCta] = useState<
    ReturnType<typeof formatGenerationError>["cta"]
  >(null);
  const [exportErrorRetryable, setExportErrorRetryable] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openingId, setOpeningId] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderSchool, setNewFolderSchool] = useState("");
  const [newFolderClass, setNewFolderClass] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const [pendingMoveItemId, setPendingMoveItemId] = useState<string | null>(null);
  const NEW_FOLDER_OPTION = "__new_folder__";

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) || null,
    [folders, activeFolderId],
  );
  /**
   * Escopo da visão atual: dentro de uma pasta mostra só os itens dela;
   * fora de qualquer pasta ("Meus materiais") mostra só os itens ainda sem pasta,
   * para que um material movido para uma pasta deixe de aparecer junto dos outros.
   */
  const scopeItems = useCallback(
    (list: HistoryItem[]): HistoryItem[] =>
      filterItemsByFolder(list, activeFolderId || "__inbox__"),
    [activeFolderId],
  );
>>>>>>> origin/aplicar-melhorias-na-producao

  useEffect(() => {
    let cancelled = false;

<<<<<<< HEAD
    void refreshHistoryState().then((loaded) => {
      if (cancelled) return;
      setItems(loaded);
      setSelectedItem(loaded[0] ?? null);
=======
    void refreshHistoryState().then(async (loaded) => {
      if (cancelled) return;

      for (const item of loaded) {
        const meta = getHistoryFolderMeta(item);
        if (!meta.folderId && meta.classLabel) {
          const folder = ensureMaterialFolder({
            schoolLabel: meta.schoolLabel,
            classLabel: meta.classLabel,
          });
          if (folder) {
            upsertHistoryItem(assignHistoryItemFolder(item, folder));
          }
        }
      }

      const next = await refreshHistoryState();
      if (cancelled) return;
      setItems(next);

      const synced = await syncMaterialFoldersFromAPI();
      if (cancelled) return;
      setFolders(synced.length > 0 ? synced : loadMaterialFolders());
>>>>>>> origin/aplicar-melhorias-na-producao
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleRefresh() {
      void refreshHistoryState().then((loaded) => {
        setItems(loaded);
<<<<<<< HEAD
        setSelectedItem((current) =>
          current
            ? loaded.find((item) => item.id === current.id) ?? loaded[0] ?? null
            : loaded[0] ?? null,
        );
=======
>>>>>>> origin/aplicar-melhorias-na-producao
      });
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("planify:history-changed", handleRefresh);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("planify:history-changed", handleRefresh);
    };
  }, []);

  const typeOptions = useMemo(() => getHistoryTypeOptions(items), [items]);
<<<<<<< HEAD
  const filteredItems = useMemo(
    () => filterHistoryItems(items, filter),
    [items, filter],
  );
=======
  const folderTree = useMemo(() => buildFolderTree(folders, items), [folders, items]);
  const flatFolders = useMemo(
    () => folderTree.flatMap((school) => school.classes),
    [folderTree],
  );
  const filteredItems = useMemo(() => {
    return filterHistoryItems(scopeItems(items), filter);
  }, [items, filter, scopeItems]);
>>>>>>> origin/aplicar-melhorias-na-producao
  const filteredItemIds = useMemo(
    () => filteredItems.map((item) => item.id),
    [filteredItems],
  );
  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredItemIds.length > 0 &&
    filteredItemIds.every((id) => selectedIds.has(id));

  const totals = useMemo(
    () => ({
      todos: items.length,
      planejamentos: items.filter((item) => item.source === "planejamento")
        .length,
      materiais: items.filter((item) => item.source === "material").length,
      editor: items.filter((item) => item.source === "manual").length,
    }),
    [items],
  );

  function updateFilter<K extends keyof HistoryFilter>(
    key: K,
    value: HistoryFilter[K],
  ) {
    setFilter((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function openInEditor(item: HistoryItem) {
    if (openingId) return;

    setOpeningId(item.id);
    setStatus(null);

    try {
      const document = await resolveHistoryItemForEditor(item);
      saveEditorDocument(document);
      router.push(buildMaterialEditorHref("historico"));
    } catch (error) {
      setStatus({
        type: "warning",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível abrir este material no editor.",
      });
    } finally {
      setOpeningId(null);
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function toggleItemSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filteredItemIds));
  }

  function deselectAllFiltered() {
    setSelectedIds(new Set());
  }

  function syncRemovedItems(removedIds: string[]) {
<<<<<<< HEAD
    const removedIdSet = new Set(removedIds);
    const next = removeHistoryItems(removedIds);
    setItems(next);

    if (selectedItem && removedIdSet.has(selectedItem.id)) {
      setSelectedItem(next[0] ?? null);
    }

=======
    const next = removeHistoryItems(removedIds);
    setItems(next);

>>>>>>> origin/aplicar-melhorias-na-producao
    setSelectedIds((current) => {
      const nextSelected = new Set(current);
      for (const id of removedIds) {
        nextSelected.delete(id);
      }
      return nextSelected;
    });

    if (getHistorySupabaseSync()) {
      void Promise.all(
        removedIds.map((id) => removeHistoryItemFromAPI(id)),
      ).catch(() => {
        setStatus({
          type: "warning",
          message:
            "Itens removidos localmente. A exclusão na nuvem pode levar alguns instantes.",
        });
      });
    }
  }

  function removeItem(item: HistoryItem) {
    const confirmed = window.confirm(
      `Excluir permanentemente "${item.title}"?\n\nEsta ação não pode ser desfeita. O material será removido do seu histórico.`,
    );

    if (!confirmed) {
      return;
    }

    syncRemovedItems([item.id]);

    setStatus({
      type: "success",
      message: "Item excluído permanentemente dos seus materiais.",
    });
  }

  function removeSelectedItems() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Excluir permanentemente ${ids.length} material${ids.length === 1 ? "" : "is"}?\n\nEsta ação não pode ser desfeita. Os itens serão removidos do seu histórico.`,
    );

    if (!confirmed) {
      return;
    }

    syncRemovedItems(ids);
    exitSelectionMode();

    setStatus({
      type: "success",
      message:
        ids.length === 1
          ? "Item excluído permanentemente dos seus materiais."
          : `${ids.length} itens excluídos permanentemente dos seus materiais.`,
    });
  }

  function clearAll() {
    clearHistoryItems();
    setItems([]);
<<<<<<< HEAD
    setSelectedItem(null);
=======
>>>>>>> origin/aplicar-melhorias-na-producao
    exitSelectionMode();
    setStatus({
      type: "info",
      message: "Lista local limpa.",
    });
  }

  function reloadHistory() {
    void refreshHistoryState().then((loaded) => {
      setItems(loaded);
<<<<<<< HEAD
      setSelectedItem(loaded[0] ?? null);
=======
>>>>>>> origin/aplicar-melhorias-na-producao
      setStatus({
        type: "success",
        message: "Materiais recarregados.",
      });
    });
  }

<<<<<<< HEAD
  const getSelectedHtml = useCallback(() => {
    if (!selectedItem) return "";
    return historyItemContentToHtml(selectedItem.content);
  }, [selectedItem]);

=======
>>>>>>> origin/aplicar-melhorias-na-producao
  function handleExportStatus(message: string) {
    setExportError("");
    setExportErrorCta(null);
    setExportErrorRetryable(false);
    setStatus({ type: "success", message });
  }

  function handleExportError(error: unknown) {
    const formatted = formatGenerationError(error);
    setExportError(formatted.message);
    setExportErrorCta(formatted.cta ?? null);
    setExportErrorRetryable(formatted.retryable);
    setStatus({
      type: "warning",
      message: "Falha na exportação — veja o aviso abaixo.",
    });
  }

<<<<<<< HEAD
=======
  function openNewFolderForm(forItemId?: string) {
    setPendingMoveItemId(forItemId ?? null);
    setNewFolderSchool("");
    setNewFolderClass("");
    setNewFolderOpen(true);
  }

  function moveItemToFolder(item: HistoryItem, folder: MaterialFolder | null) {
    const updated = assignHistoryItemFolder(item, folder);
    upsertHistoryItem(updated);
    setItems((current) => current.map((i) => (i.id === item.id ? updated : i)));
    setStatus({
      type: "success",
      message: folder
        ? `Movido para ${folder.schoolLabel} · ${folder.classLabel}.`
        : "Removido da pasta.",
    });
  }

  function handleMoveSelectChange(item: HistoryItem, value: string) {
    if (value === NEW_FOLDER_OPTION) {
      openNewFolderForm(item.id);
      return;
    }
    if (!value) {
      moveItemToFolder(item, null);
      return;
    }
    const folder = folders.find((f) => f.id === value) || null;
    moveItemToFolder(item, folder);
  }

  async function handleCreateFolder() {
    const classLabel = newFolderClass.trim();
    if (!classLabel) {
      setStatus({ type: "warning", message: "Informe a turma para criar a pasta." });
      return;
    }

    setSavingFolder(true);
    try {
      const folder = await createMaterialFolder(newFolderSchool, classLabel);
      if (!folder) {
        setStatus({ type: "warning", message: "Não foi possível criar a pasta." });
        return;
      }

      setFolders((current) => {
        const exists = current.some((f) => f.id === folder.id);
        return exists ? current : [folder, ...current];
      });

      if (pendingMoveItemId) {
        const item = items.find((i) => i.id === pendingMoveItemId);
        if (item) moveItemToFolder(item, folder);
      } else {
        setActiveFolderId(folder.id);
      }

      setStatus({
        type: "success",
        message: `Pasta "${folder.schoolLabel} · ${folder.classLabel}" criada.`,
      });
      setNewFolderOpen(false);
      setPendingMoveItemId(null);
    } finally {
      setSavingFolder(false);
    }
  }

  async function handleDeleteFolder(folder: MaterialFolder) {
    const affected = items.filter(
      (item) => getHistoryFolderMeta(item).folderId === folder.id,
    );

    const confirmed = window.confirm(
      `Excluir a pasta "${folder.schoolLabel} · ${folder.classLabel}"?\n\n${
        affected.length > 0
          ? `${affected.length} material${affected.length === 1 ? "" : "is"} voltará${
              affected.length === 1 ? "" : "ão"
            } para "Sem pasta". `
          : ""
      }Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    await deleteMaterialFolder(folder.id);

    setFolders((current) => current.filter((f) => f.id !== folder.id));

    if (affected.length > 0) {
      for (const item of affected) {
        upsertHistoryItem(assignHistoryItemFolder(item, null));
      }
      setItems((current) =>
        current.map((item) =>
          affected.some((a) => a.id === item.id)
            ? assignHistoryItemFolder(item, null)
            : item,
        ),
      );
    }

    if (activeFolderId === folder.id) {
      setActiveFolderId(null);
    }

    setStatus({
      type: "success",
      message: `Pasta "${folder.schoolLabel} · ${folder.classLabel}" excluída.`,
    });
  }

  function renderMoveSelect(item: HistoryItem, compact = false) {
    const meta = getHistoryFolderMeta(item);
    return (
      <select
        value={meta.folderId || ""}
        onChange={(event) => handleMoveSelectChange(item, event.target.value)}
        className={[
          "rounded-lg border border-slate-200 bg-white font-medium text-slate-600 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100",
          compact ? "h-8 px-2 text-[11px]" : "h-10 px-3 text-xs",
        ].join(" ")}
        aria-label="Mover para pasta"
      >
        <option value="">Sem pasta</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.schoolLabel} · {folder.classLabel}
          </option>
        ))}
        <option value={NEW_FOLDER_OPTION}>+ Nova pasta…</option>
      </select>
    );
  }

>>>>>>> origin/aplicar-melhorias-na-producao
  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Meus materiais"
          icon="history"
          title="Tudo que você gerou"
<<<<<<< HEAD
          description="Planejamentos, materiais e rascunhos do editor — sincronizados com sua conta."
        />
      }
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          {[
            ["Total", totals.todos],
            ["Planejamentos", totals.planejamentos],
            ["Materiais", totals.materiais],
            ["Editor", totals.editor],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-cyan-400/15 bg-white px-4 py-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="text-lg font-extrabold text-slate-950">{value}</p>
            </div>
          ))}
=======
          description="Organize por escola e turma para não perder o ano letivo. Planejamentos, materiais e rascunhos sincronizados com sua conta."
        />
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {activeFolder ? (
          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(null)}
                  aria-label="Voltar para Meus materiais"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
                </button>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <PlanifyIcon name="folder" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {activeFolder.classLabel}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {activeFolder.schoolLabel} · {filteredItems.length}{" "}
                    {filteredItems.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteFolder(activeFolder)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
                Excluir pasta
              </button>
            </div>
          </div>
        ) : (
          <div className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pastas · escola / turma
              </p>
              <span className="text-[11px] font-medium text-slate-400">
                Toque para abrir · lixeira para excluir
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {flatFolders.map(({ folder, count }) => (
                <div key={folder.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setActiveFolderId(folder.id)}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-cyan-200 hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <PlanifyIcon name="folder" className="h-5 w-5" />
                    </span>
                    <span className="line-clamp-1 text-xs font-semibold text-slate-800">
                      {folder.classLabel}
                    </span>
                    <span className="line-clamp-1 text-[11px] text-slate-400">
                      {folder.schoolLabel}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {count} {count === 1 ? "item" : "itens"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteFolder(folder);
                    }}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-rose-200 hover:text-rose-600 focus:opacity-100 focus-visible:opacity-100"
                    title="Excluir pasta"
                    aria-label={`Excluir pasta ${folder.schoolLabel} ${folder.classLabel}`}
                  >
                    <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => openNewFolderForm()}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center transition hover:border-cyan-300 hover:bg-cyan-50/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition group-hover:bg-cyan-100 group-hover:text-cyan-600">
                  <PlanifyIcon name="plus" className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-slate-500 transition group-hover:text-cyan-700">
                  Nova pasta
                </span>
              </button>
            </div>

            {folderTree.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400">
                Organize por escola e turma para não perder o ano letivo. Materiais sem pasta aparecem abaixo, em "Meus materiais".
              </p>
            ) : null}
          </div>
        )}

        {newFolderOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-900">Nova pasta</h3>
              <p className="mt-1 text-sm text-slate-500">
                Organize por escola e turma para encontrar rápido depois.
              </p>
              <div className="mt-5 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Escola</span>
                  <input
                    value={newFolderSchool}
                    onChange={(event) => setNewFolderSchool(event.target.value)}
                    placeholder="Ex.: Escola Objetivo"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Turma</span>
                  <input
                    value={newFolderClass}
                    onChange={(event) => setNewFolderClass(event.target.value)}
                    placeholder="Ex.: 6º Ano A"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderOpen(false);
                    setPendingMoveItemId(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateFolder()}
                  disabled={savingFolder || !newFolderClass.trim()}
                  className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingFolder ? "Criando…" : "Criar pasta"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["Total geral", totals.todos],
              ["Planejamentos", totals.planejamentos],
              ["Materiais", totals.materiais],
              ["Editor", totals.editor],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-cyan-400/15 bg-white px-4 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="text-lg font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
>>>>>>> origin/aplicar-melhorias-na-producao
          <div className="ml-auto flex flex-wrap gap-2">
            {selectionMode ? (
              <>
                <button
                  type="button"
                  onClick={
                    allFilteredSelected ? deselectAllFiltered : selectAllFiltered
                  }
                  className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  {allFilteredSelected ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                <button
                  type="button"
                  onClick={removeSelectedItems}
                  disabled={selectedCount === 0}
<<<<<<< HEAD
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
=======
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
>>>>>>> origin/aplicar-melhorias-na-producao
                >
                  Excluir selecionados{selectedCount > 0 ? ` (${selectedCount})` : ""}
                </button>
                <button
                  type="button"
                  onClick={exitSelectionMode}
<<<<<<< HEAD
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
=======
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
>>>>>>> origin/aplicar-melhorias-na-producao
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                disabled={filteredItems.length === 0}
                className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selecionar
              </button>
            )}
            <button
              type="button"
              onClick={reloadHistory}
              className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={clearAll}
<<<<<<< HEAD
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
=======
              className="rounded-xl px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
>>>>>>> origin/aplicar-melhorias-na-producao
            >
              Limpar tudo
            </button>
          </div>
        </div>

<<<<<<< HEAD
        <div className="rounded-2xl border border-cyan-400/15 bg-white p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Busca</span>
              <input
                value={filter.query}
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Buscar por título, conteúdo, tipo..."
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 outline-none focus:border-cyan-400 focus:bg-white"
              />
=======
        <div className="pl-hud-glass rounded-2xl p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Busca</span>
              <div className="relative">
                <PlanifyIcon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={filter.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Buscar por título, conteúdo, tipo..."
                  className="h-11 w-full rounded-xl border border-cyan-400/20 bg-white/90 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
>>>>>>> origin/aplicar-melhorias-na-producao
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-600">Fonte</span>
              <select
                value={filter.source}
                onChange={(event) =>
                  updateFilter(
                    "source",
                    event.target.value as HistoryFilter["source"],
                  )
                }
<<<<<<< HEAD
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
=======
                className="h-11 rounded-xl border border-cyan-400/20 bg-white/90 px-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
>>>>>>> origin/aplicar-melhorias-na-producao
              >
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-slate-600">Tipo</span>
              <select
                value={filter.type}
                onChange={(event) => updateFilter("type", event.target.value)}
<<<<<<< HEAD
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
=======
                className="h-11 rounded-xl border border-cyan-400/20 bg-white/90 px-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
>>>>>>> origin/aplicar-melhorias-na-producao
              >
                <option value="todos">Todos</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {status ? (
            <div
              className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${statusClass(status.type)}`}
            >
              {status.message}
            </div>
          ) : null}

          {exportError ? (
            <GenerationErrorBanner
              message={exportError}
              cta={exportErrorCta}
              retryable={exportErrorRetryable}
              className="mt-4"
            />
          ) : null}
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
<<<<<<< HEAD
              const selected = selectedItem?.id === item.id;
=======
>>>>>>> origin/aplicar-melhorias-na-producao
              const checked = selectedIds.has(item.id);
              const typeLabel = resolveHistoryTypeLabel(item.type);
              return (
                <PlanifyMaterialHubCard
                  key={item.id}
                  badge={typeLabel}
                  title={item.title}
                  description={buildHistoryContentPreview(item.content)}
                  metaPrimary={item.subtitle || sourceLabels[item.source] || undefined}
                  metaSecondary={formatDate(item.updatedAt)}
<<<<<<< HEAD
                  selected={selected}
                  selectionMode={selectionMode}
                  checked={checked}
                  onToggleCheck={() => toggleItemSelection(item.id)}
                  onSelect={() => setSelectedItem(item)}
                  footer={
                    <div className="space-y-2">
=======
                  selectionMode={selectionMode}
                  checked={checked}
                  onToggleCheck={() => toggleItemSelection(item.id)}
                  footer={
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Pasta
                        </span>
                        {renderMoveSelect(item, true)}
                      </label>
>>>>>>> origin/aplicar-melhorias-na-producao
                      <HistoryDocumentExportBar
                        item={item}
                        onStatus={handleExportStatus}
                        onError={handleExportError}
                        classroomMode="popover"
                      />
<<<<<<< HEAD
                      <div className="flex gap-1.5">
=======
                      <div className="flex flex-wrap gap-1.5">
                        <ShareMaterialLinkButton
                          title={item.title}
                          getHtml={() => historyItemContentToHtml(item.content)}
                          toolId={item.type}
                          compact
                          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 disabled:opacity-60"
                          onStatus={(message) =>
                            setStatus({ type: "success", message })
                          }
                        />
                        <MarketplacePublishButton
                          title={item.title}
                          getHtml={() => historyItemContentToHtml(item.content)}
                          getPlanningPayload={
                            String(item.type || "").includes("planejamento")
                              ? () => getHistoryPlanningPayload(item)
                              : undefined
                          }
                          tipoMaterial={resolveMarketplaceTipo(item)}
                          componente={resolveHistoricoComponente(item)}
                          tema={item.subtitle || item.title}
                          label="Comunidade"
                          compact
                          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 disabled:opacity-60"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
>>>>>>> origin/aplicar-melhorias-na-producao
                        <button
                          type="button"
                          onClick={() => void openInEditor(item)}
                          disabled={selectionMode || openingId === item.id}
<<<<<<< HEAD
                          className="pl-hud-btn min-h-9 flex-1 rounded-xl py-1.5 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
=======
                          className="pl-hud-btn flex h-8 flex-1 items-center justify-center rounded-lg text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> origin/aplicar-melhorias-na-producao
                        >
                          {openingId === item.id ? "Abrindo..." : "Abrir no editor"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={selectionMode}
<<<<<<< HEAD
                          className="min-h-9 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Excluir permanentemente"
                          aria-label={`Excluir permanentemente ${item.title}`}
                        >
                          Excluir
=======
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Excluir permanentemente"
                          aria-label={`Excluir permanentemente ${item.title}`}
                        >
                          <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
>>>>>>> origin/aplicar-melhorias-na-producao
                        </button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        ) : (
<<<<<<< HEAD
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
              Vazio
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              Nenhum material encontrado
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Gere um planejamento ou material para vê-lo aqui.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/planejamentos"
                className="pl-hud-btn rounded-xl px-5 py-2.5 text-xs font-semibold"
              >
                Novo planejamento
              </Link>
              <Link
                href="/materiais"
                className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-xs font-semibold"
              >
                Novo material
              </Link>
            </div>
          </div>
        )}

        {selectedItem ? (
          <div className="rounded-2xl border border-cyan-400/20 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getSourceBadgeClass(selectedItem.source)}`}
                >
                  {sourceLabels[selectedItem.source] || selectedItem.source}
                </span>
                <h2 className="mt-2 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  {selectedItem.title}
                </h2>
                {selectedItem.subtitle ? (
                  <p className="mt-1 text-sm font-semibold text-cyan-700">
                    {selectedItem.subtitle}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Atualizado em {formatDate(selectedItem.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <MarketplacePublishButton
                    title={selectedItem.title}
                    getHtml={getSelectedHtml}
                    getPlanningPayload={
                      String(selectedItem.type || "").includes("planejamento")
                        ? () => getHistoryPlanningPayload(selectedItem)
                        : undefined
                    }
                    tipoMaterial={resolveMarketplaceTipo(selectedItem)}
                    componente={resolveHistoricoComponente(selectedItem)}
                    tema={selectedItem.subtitle || selectedItem.title}
                    label="Comunidade"
                    compact
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
                  />
                  <button
                    type="button"
                    onClick={() => void openInEditor(selectedItem)}
                    disabled={openingId === selectedItem.id}
                    className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {openingId === selectedItem.id ? "Abrindo..." : "Abrir no Editor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(selectedItem)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                  >
                    Excluir permanentemente
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Exportar
                  </p>
                  <div className="mt-1.5">
                    <HistoryDocumentExportBar
                      item={selectedItem}
                      classroomMode="popover"
                      onStatus={handleExportStatus}
                      onError={handleExportError}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
              {isHistoryHtmlContent(selectedItem.content) ? (
                <article
                  className="planify-history-preview text-sm leading-7 text-slate-800 [&_.planify-flashcards]:flex [&_.planify-flashcards]:flex-wrap [&_.planify-flashcards]:gap-4 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mt-3 [&_h3]:font-black [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedItem.content}
                </p>
              )}
            </div>
          </div>
        ) : null}
=======
          <div className="pl-hud-glass flex flex-col items-center rounded-2xl px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <PlanifyIcon name="folder" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-cyan-600">
              Vazio
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              {activeFolder
                ? "Esta pasta ainda não tem materiais"
                : "Nenhum material encontrado"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {activeFolder
                ? 'Volte em "Meus materiais" e use o campo Pasta em qualquer card para mover um material para aqui.'
                : "Gere um planejamento ou material para vê-lo aqui."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {activeFolder ? (
                <button
                  type="button"
                  onClick={() => setActiveFolderId(null)}
                  className="pl-hud-btn rounded-xl px-5 py-2.5 text-xs font-semibold"
                >
                  Ir para Meus materiais
                </button>
              ) : (
                <>
                  <Link
                    href="/planejamentos"
                    className="pl-hud-btn rounded-xl px-5 py-2.5 text-xs font-semibold"
                  >
                    Novo planejamento
                  </Link>
                  <Link
                    href="/materiais"
                    className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-xs font-semibold"
                  >
                    Novo material
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
>>>>>>> origin/aplicar-melhorias-na-producao
      </div>
    </PlanifyWorkspacePane>
  );
}
