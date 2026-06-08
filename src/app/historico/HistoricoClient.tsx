"use client";

import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorDocument } from "../../types/editor";
import type { HistoryFilter, HistoryItem } from "../../types/history";
import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import {
  buildHistoryContentPreview,
  historyItemContentToHtml,
  isHistoryHtmlContent,
  resolveHistoryTypeLabel,
} from "../../lib/history/history-preview";
import {
  clearHistoryItems,
  filterHistoryItems,
  getHistoryTypeOptions,
  loadHistoryItemsWithSync,
  removeHistoryItem,
} from "../../lib/history/history-storage";
import { saveEditorDocument } from "../../lib/editor/editor-storage";
import { migrateLegacyMaterialHistoryOnce } from "../../lib/materiais/material-editor-flow";

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

function historyItemToEditorDocument(item: HistoryItem): EditorDocument {
  return {
    id: item.id,
    source: item.source,
    title: item.title,
    subtitle: item.subtitle,
    type: item.type,
    content: item.content,
    raw: item.raw,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
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

function sourceIcon(source: string): "clipboard" | "fileText" | "editor" {
  if (source === "planejamento") return "clipboard";
  if (source === "manual") return "editor";
  return "fileText";
}

function resolveMarketplaceTipo(item: HistoryItem): string {
  if (item.source === "planejamento") return "Planejamento";
  if (item.source === "manual") return "Material do editor";
  return resolveHistoryTypeLabel(item.type);
}

export function HistoricoClient() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);

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

  function openInEditor(item: HistoryItem) {
    saveEditorDocument(historyItemToEditorDocument(item));
    router.push("/editor");
  }

  function removeItem(item: HistoryItem) {
    const next = removeHistoryItem(item.id);
    setItems(next);

    if (selectedItem?.id === item.id) {
      setSelectedItem(next[0] ?? null);
    }

    setStatus({
      type: "success",
      message: "Item removido dos seus materiais.",
    });
  }

  function clearAll() {
    clearHistoryItems();
    setItems([]);
    setSelectedItem(null);
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
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => {
              const selected = selectedItem?.id === item.id;
              return (
                <article
                  key={item.id}
                  className={`group flex aspect-square flex-col rounded-2xl border p-3 transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-cyan-300 hover:shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="flex min-h-0 flex-1 flex-col text-left"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${getSourceBadgeClass(item.source)}`}
                    >
                      <PlanifyIcon
                        name={sourceIcon(item.source)}
                        className="h-5 w-5"
                      />
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-sm font-extrabold leading-snug text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-cyan-700">
                      {resolveHistoryTypeLabel(item.type)}
                    </p>
                    <p className="mt-auto line-clamp-2 pt-2 text-[10px] leading-4 text-slate-500">
                      {buildHistoryContentPreview(item.content)}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      {formatDate(item.updatedAt)}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openInEditor(item)}
                      className="min-h-11 flex-1 rounded-lg bg-cyan-600 py-2.5 text-xs font-bold text-white sm:min-h-0 sm:py-1.5 sm:text-[10px]"
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="min-h-11 min-w-11 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1.5 sm:text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
              Vazio
            </p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">
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
                <h2 className="mt-3 text-2xl font-extrabold text-slate-950">
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
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <MarketplacePublishButton
                  title={selectedItem.title}
                  getHtml={getSelectedHtml}
                  tipoMaterial={resolveMarketplaceTipo(selectedItem)}
                  tema={selectedItem.subtitle || selectedItem.title}
                  label="Comunidade"
                  compact
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
                />
                <GoogleClassroomPanel
                  compact
                  title={selectedItem.title}
                  getHtml={getSelectedHtml}
                  documentType={selectedItem.type}
                  onStatus={(message) =>
                    setStatus({ type: "success", message })
                  }
                />
                <button
                  type="button"
                  onClick={() => openInEditor(selectedItem)}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Abrir no Editor
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(selectedItem)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                >
                  Remover
                </button>
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
