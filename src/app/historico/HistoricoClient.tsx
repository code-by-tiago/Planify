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
import { ShareMaterialLinkButton } from "@/components/share/ShareMaterialLinkButton";
import {
  buildHistoryContentPreview,
  historyItemContentToHtml,
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
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [exportError, setExportError] = useState("");
  const [exportErrorCta, setExportErrorCta] = useState<
    ReturnType<typeof formatGenerationError>["cta"]
  >(null);
  const [exportErrorRetryable, setExportErrorRetryable] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openingId, setOpeningId] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;

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
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleRefresh() {
      void refreshHistoryState().then((loaded) => {
        setItems(loaded);
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
  const folderTree = useMemo(() => buildFolderTree(folders, items), [folders, items]);
  const flatFolders = useMemo(
    () => folderTree.flatMap((school) => school.classes),
    [folderTree],
  );
  const filteredItems = useMemo(() => {
    return filterHistoryItems(scopeItems(items), filter);
  }, [items, filter, scopeItems]);
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
    const next = removeHistoryItems(removedIds);
    setItems(next);

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
    exitSelectionMode();
    setStatus({
      type: "info",
      message: "Lista local limpa.",
    });
  }

  function reloadHistory() {
    void refreshHistoryState().then((loaded) => {
      setItems(loaded);
      setStatus({
        type: "success",
        message: "Materiais recarregados.",
      });
    });
  }

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
          "min-h-9 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-600 outline-none focus:border-cyan-400",
          compact ? "px-2 py-1.5" : "px-3 py-2 text-xs",
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

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Meus materiais"
          icon="history"
          title="Tudo que você gerou"
          description="Organize por escola e turma para não perder o ano letivo. Planejamentos, materiais e rascunhos sincronizados com sua conta."
        />
      }
    >
      <div className="grid gap-6">
        {activeFolder ? (
          <div className="rounded-2xl border border-cyan-400/30 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(null)}
                  className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <PlanifyIcon name="arrowLeft" className="h-3.5 w-3.5" />
                  Meus materiais
                </button>
                <div className="flex items-center gap-2">
                  <PlanifyIcon name="folder" className="h-8 w-8 text-cyan-600" />
                  <div>
                    <p className="text-sm font-black leading-tight text-slate-900">
                      {activeFolder.classLabel}
                    </p>
                    <p className="text-xs font-semibold leading-tight text-slate-500">
                      {activeFolder.schoolLabel} · {filteredItems.length}{" "}
                      {filteredItems.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteFolder(activeFolder)}
                className="flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
                Excluir pasta
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Pastas · Escola / Turma
              </p>
              <span className="text-[11px] font-semibold text-slate-400">
                Clique para abrir · use a lixeira para excluir
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {flatFolders.map(({ folder, count }) => (
                <div key={folder.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setActiveFolderId(folder.id)}
                    className="flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white p-3 text-center transition hover:border-cyan-200 hover:bg-cyan-50/40"
                  >
                    <PlanifyIcon name="folder" className="h-9 w-9 text-amber-400" />
                    <span className="line-clamp-1 text-xs font-bold text-slate-800">
                      {folder.classLabel}
                    </span>
                    <span className="line-clamp-1 text-[10px] font-semibold text-slate-400">
                      {folder.schoolLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {count} {count === 1 ? "item" : "itens"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteFolder(folder);
                    }}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 opacity-80 shadow-sm transition hover:bg-rose-50 hover:opacity-100 focus:opacity-100"
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
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 p-3 text-center text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50/40 hover:text-cyan-700"
              >
                <PlanifyIcon name="plus" className="h-9 w-9" />
                <span className="text-xs font-bold">Nova pasta</span>
              </button>
            </div>

            {folderTree.length === 0 ? (
              <p className="mt-3 text-xs font-medium text-slate-500">
                Organize por escola e turma para não perder o ano letivo. Materiais sem pasta aparecem abaixo, em "Meus materiais".
              </p>
            ) : null}
          </div>
        )}

        {newFolderOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900">Nova pasta</h3>
              <p className="mt-1 text-xs text-slate-500">
                Organize por escola e turma para encontrar rápido depois.
              </p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Escola</span>
                  <input
                    value={newFolderSchool}
                    onChange={(event) => setNewFolderSchool(event.target.value)}
                    placeholder="Ex.: Escola Objetivo"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Turma</span>
                  <input
                    value={newFolderClass}
                    onChange={(event) => setNewFolderClass(event.target.value)}
                    placeholder="Ex.: 6º Ano A"
                    className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
                  />
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderOpen(false);
                    setPendingMoveItemId(null);
                  }}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateFolder()}
                  disabled={savingFolder || !newFolderClass.trim()}
                  className="pl-hud-btn min-h-11 rounded-xl px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingFolder ? "Criando…" : "Criar pasta"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
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
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="text-lg font-extrabold text-slate-950">{value}</p>
            </div>
          ))}
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
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Excluir selecionados{selectedCount > 0 ? ` (${selectedCount})` : ""}
                </button>
                <button
                  type="button"
                  onClick={exitSelectionMode}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
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
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
            >
              Limpar tudo
            </button>
          </div>
        </div>

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
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
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
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
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
                  selectionMode={selectionMode}
                  checked={checked}
                  onToggleCheck={() => toggleItemSelection(item.id)}
                  footer={
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Pasta
                        </span>
                        {renderMoveSelect(item, true)}
                      </label>
                      <HistoryDocumentExportBar
                        item={item}
                        onStatus={handleExportStatus}
                        onError={handleExportError}
                        classroomMode="popover"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <ShareMaterialLinkButton
                          title={item.title}
                          getHtml={() => historyItemContentToHtml(item.content)}
                          toolId={item.type}
                          compact
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
                          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2.5 py-1 text-[10px] font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
                        />
                        <button
                          type="button"
                          onClick={() => void openInEditor(item)}
                          disabled={selectionMode || openingId === item.id}
                          className="pl-hud-btn min-h-9 flex-1 rounded-xl py-1.5 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {openingId === item.id ? "Abrindo..." : "Abrir no editor"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={selectionMode}
                          className="min-h-9 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Excluir permanentemente"
                          aria-label={`Excluir permanentemente ${item.title}`}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
              Vazio
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              {activeFolder
                ? "Esta pasta ainda não tem materiais"
                : "Nenhum material encontrado"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
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
      </div>
    </PlanifyWorkspacePane>
  );
}
