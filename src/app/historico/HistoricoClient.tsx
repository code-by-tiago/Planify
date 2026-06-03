"use client";

import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorDocument } from "../../types/editor";
import type { HistoryFilter, HistoryItem } from "../../types/history";
import {
  clearHistoryItems,
  filterHistoryItems,
  getHistoryTypeOptions,
  loadHistoryItems,
  removeHistoryItem,
} from "../../lib/history/history-storage";
import { saveEditorDocument } from "../../lib/editor/editor-storage";

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
  historico: "Histórico",
  biblioteca: "Biblioteca",
  marketplace: "Marketplace",
};

const statusLabels: Record<string, string> = {
  todos: "Todos",
  rascunho: "Rascunho",
  pronto: "Pronto",
  arquivado: "Arquivado",
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
    updatedAt: new Date().toISOString(),
  };
}

function getSourceBadgeClass(source: string): string {
  if (source === "planejamento") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (source === "material") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (source === "manual") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function HistoricoClient() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);

  useEffect(() => {
    const loaded = loadHistoryItems();
    setItems(loaded);
    setSelectedItem(loaded[0] ?? null);
  }, []);

  const typeOptions = useMemo(() => getHistoryTypeOptions(items), [items]);
  const filteredItems = useMemo(() => filterHistoryItems(items, filter), [items, filter]);

  const totals = useMemo(() => {
    return {
      todos: items.length,
      planejamentos: items.filter((item) => item.source === "planejamento").length,
      materiais: items.filter((item) => item.source === "material").length,
      editor: items.filter((item) => item.source === "manual").length,
    };
  }, [items]);

  function updateFilter<K extends keyof HistoryFilter>(key: K, value: HistoryFilter[K]) {
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
      message: "Item removido do histórico local.",
    });
  }

  function clearAll() {
    clearHistoryItems();
    setItems([]);
    setSelectedItem(null);
    setStatus({
      type: "info",
      message: "Histórico local limpo.",
    });
  }

  function reloadHistory() {
    const loaded = loadHistoryItems();
    setItems(loaded);
    setSelectedItem(loaded[0] ?? null);
    setStatus({
      type: "success",
      message: "Histórico local recarregado.",
    });
  }

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Histórico"
          icon="history"
          title="Tudo que você criou"
          description="Planejamentos, materiais e rascunhos do editor — organizados no seu navegador."
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid gap-6 xl:sticky xl:top-5 xl:h-fit">
          <div className="rounded-[1.85rem] border border-violet-100/70 bg-white/95 p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-600">
              Resumo
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-violet-950">
              Documentos recentes
            </h2>
            <p className="mt-4 text-sm leading-7 text-violet-500/90">
              Enquanto o Supabase não é conectado, o Planify organiza os itens no navegador para validar o fluxo completo.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                ["Total", String(totals.todos)],
                ["Planejamentos", String(totals.planejamentos)],
                ["Materiais", String(totals.materiais)],
                ["Editor", String(totals.editor)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
              Ações
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={reloadHistory}
                className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1"
              >
                Recarregar histórico
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700 transition hover:-translate-y-1"
              >
                Limpar histórico local
              </button>

              <Link
                href="/planejamentos"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:border-slate-950"
              >
                Novo planejamento
              </Link>

              <Link
                href="/materiais"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:-translate-y-1 hover:border-slate-950"
              >
                Novo material
              </Link>
            </div>
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
                  Filtros
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Encontre documentos
                </h2>
              </div>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
                {filteredItems.length} resultado(s)
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Busca</span>
                <input
                  value={filter.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Buscar por título, conteúdo, tipo..."
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Fonte</span>
                <select
                  value={filter.source}
                  onChange={(event) => updateFilter("source", event.target.value as HistoryFilter["source"])}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
                >
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Tipo</span>
                <select
                  value={filter.type}
                  onChange={(event) => updateFilter("type", event.target.value)}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
                >
                  <option value="todos">
                    Todos
                  </option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {status && (
              <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${statusClass(status.type)}`}>
                {status.message}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="grid gap-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-1 ${
                      selectedItem?.id === item.id
                        ? "border-slate-950 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-950"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="text-left"
                      >
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getSourceBadgeClass(item.source)}`}>
                          {sourceLabels[item.source] || item.source}
                        </span>
                        <h3 className="mt-4 text-xl font-black text-slate-950">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="mt-1 text-sm font-bold text-cyan-700">
                            {item.subtitle}
                          </p>
                        )}
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {item.contentPreview}
                        </p>
                        <p className="mt-3 text-xs font-bold text-slate-500">
                          Atualizado em {formatDate(item.updatedAt)}
                        </p>
                      </button>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openInEditor(item)}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition"
                        >
                          Editor
                        </button>

                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 transition"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
                    Vazio
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-slate-950">
                    Nenhum item encontrado
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Gere um planejamento ou material e envie para o editor para alimentar o histórico local.
                  </p>
                </div>
              )}
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:h-fit">
              {selectedItem ? (
                <>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
                    Detalhes
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {selectedItem.title}
                  </h2>
                  {selectedItem.subtitle && (
                    <p className="mt-2 text-sm font-bold text-cyan-700">
                      {selectedItem.subtitle}
                    </p>
                  )}

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Fonte
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950">
                        {sourceLabels[selectedItem.source] || selectedItem.source}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Tipo
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950">
                        {selectedItem.type}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Atualizado
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950">
                        {formatDate(selectedItem.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-700">
                      {selectedItem.content}
                    </pre>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openInEditor(selectedItem)}
                      className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1"
                    >
                      Abrir no Editor
                    </button>

                    <button
                      type="button"
                      onClick={() => removeItem(selectedItem)}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700 transition hover:-translate-y-1"
                    >
                      Remover
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-700">
                    Selecione
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Nenhum documento selecionado
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Clique em um item do histórico para visualizar os detalhes.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </PlanifyWorkspacePane>
  );
}
