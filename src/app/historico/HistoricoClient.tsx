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
import {
  buildHistoryContentPreview,
  historyItemContentToHtml,
  isHistoryHtmlContent,
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
} from "../../lib/history/history-storage";
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
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const [exportError, setExportError] = useState("");
  const [exportErrorCta, setExportErrorCta] = useState<
    ReturnType<typeof formatGenerationError>["cta"]
  >(null);
  const [exportErrorRetryable, setExportErrorRetryable] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void refreshHistoryState().then((loaded) => {
      if (cancelled) return;
      setItems(loaded);
      setSelectedItem(loaded[0] ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleRefresh() {
      void refreshHistoryState().then((loaded) => {
        setItems(loaded);
        setSelectedItem((current) =>
          current
            ? loaded.find((item) => item.id === current.id) ?? loaded[0] ?? null
            : loaded[0] ?? null,
        );
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
  const filteredItems = useMemo(
    () => filterHistoryItems(items, filter),
    [items, filter],
  );
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
    const removedIdSet = new Set(removedIds);
    const next = removeHistoryItems(removedIds);
    setItems(next);

    if (selectedItem && removedIdSet.has(selectedItem.id)) {
      setSelectedItem(next[0] ?? null);
    }

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
    setSelectedItem(null);
    exitSelectionMode();
    setStatus({
      type: "info",
      message: "Lista local limpa.",
    });
  }

  function reloadHistory() {
    void refreshHistoryState().then((loaded) => {
      setItems(loaded);
      setSelectedItem(loaded[0] ?? null);
      setStatus({
        type: "success",
        message: "Materiais recarregados.",
      });
    });
  }

  const getSelectedHtml = useCallback(() => {
    if (!selectedItem) return "";
    return historyItemContentToHtml(selectedItem.content);
  }, [selectedItem]);

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

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Meus materiais"
          icon="history"
          title="Tudo que você gerou"
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
              const selected = selectedItem?.id === item.id;
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
                  selected={selected}
                  selectionMode={selectionMode}
                  checked={checked}
                  onToggleCheck={() => toggleItemSelection(item.id)}
                  onSelect={() => setSelectedItem(item)}
                  footer={
                    <div className="space-y-2">
                      <HistoryDocumentExportBar
                        item={item}
                        onStatus={handleExportStatus}
                        onError={handleExportError}
                        classroomMode="popover"
                      />
                      <div className="flex gap-1.5">
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
      </div>
    </PlanifyWorkspacePane>
  );
}
