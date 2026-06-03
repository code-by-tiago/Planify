"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TeachyToolToolbar } from "@/components/dashboard/TeachyToolToolbar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  lessonBundleTools,
  teachyFeaturedToolIds,
} from "@/lib/pro/teachyStudio";
import {
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

const OBJETIVO_HINT_KEY = "planify-studio-objetivo-hint";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  initialTopic?: string;
};

function bundleByTag() {
  const map = new Map<string, typeof lessonBundleTools>();
  for (const item of lessonBundleTools) {
    const list = map.get(item.tag) ?? [];
    list.push(item);
    map.set(item.tag, list);
  }
  return [...map.entries()];
}

export default function TeachyStudioHome({
  onSelectTool,
  initialTopic = "",
}: TeachyStudioHomeProps) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [editingTheme, setEditingTheme] = useState(!initialTopic.trim());
  const [category, setCategory] = useState<ToolCategoryId>("todos");
  const [toolSearch, setToolSearch] = useState("");

  useEffect(() => {
    setTopic(initialTopic);
    if (initialTopic.trim()) setEditingTheme(false);
  }, [initialTopic]);

  const displayTopic = topic.trim() || "Sua aula";
  const lessonTitle = `${displayTopic} — Aula 1`;

  const filteredTools = useMemo(() => {
    const term = toolSearch.trim().toLowerCase();
    return planifyTools.filter((tool) => {
      const matchCat = category === "todos" || tool.category === category;
      const matchTerm =
        !term ||
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }, [category, toolSearch]);

  const quickTools = useMemo(
    () =>
      teachyFeaturedToolIds
        .map((id) => planifyTools.find((t) => t.id === id))
        .filter((t): t is (typeof planifyTools)[number] => Boolean(t)),
    [],
  );

  function persistTopicForTool() {
    const tema = topic.trim();
    if (!tema) return;
    try {
      sessionStorage.setItem("planify-studio-tema", tema);
    } catch {
      /* ignore */
    }
  }

  function openTool(toolId: PlanifyToolId) {
    persistTopicForTool();
    onSelectTool(toolId);
  }

  function handleBuildLesson(event: FormEvent) {
    event.preventDefault();
    const tema = topic.trim();
    if (!tema) {
      setEditingTheme(true);
      return;
    }
    router.push(`/planejamentos?${new URLSearchParams({ tema }).toString()}`);
  }

  function applyHintFromHome(snippet: string) {
    try {
      sessionStorage.setItem(OBJETIVO_HINT_KEY, snippet);
    } catch {
      /* ignore */
    }
    persistTopicForTool();
    onSelectTool("slides");
  }

  return (
    <div className="pl-teachy-board flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          {/* Bloco 1 — Construtor de aula (estrutura Teachy) */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                    Assistente IA · BNCC
                  </p>
                  <h1 className="mt-1 truncate text-lg font-black text-slate-950 sm:text-xl">
                    {lessonTitle}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTheme((v) => !v)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  {editingTheme ? "Fechar tema" : "Alterar tema"}
                </button>
              </div>

              {editingTheme ? (
                <form onSubmit={handleBuildLesson} className="mt-4">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Tema
                  </label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex.: Ciclo da água, Frações, Revolução Industrial…"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    autoFocus
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTheme(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                    >
                      Aplicar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                    >
                      <PlanifyIcon name="layers" className="h-3.5 w-3.5" />
                      Montar aula completa
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Tema:{" "}
                  <span className="font-black text-slate-800">
                    {topic.trim() || "defina um tema para sugerir materiais"}
                  </span>
                </p>
              )}
            </div>

            {/* Pacote de materiais por contexto (Sala, Tarefa, etc.) */}
            <div className="space-y-4 px-4 py-4 sm:px-5">
              {bundleByTag().map(([tag, items]) => (
                <div key={tag}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {tag}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openTool(item.id)}
                        className="group flex min-w-[140px] max-w-[200px] flex-1 flex-col rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-md"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                            <PlanifyIcon name={item.icon} className="h-4 w-4" />
                          </span>
                          <span className="text-[10px] font-black uppercase text-blue-600">
                            {item.label}
                          </span>
                        </span>
                        <span className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-slate-800">
                          {topic.trim()
                            ? `${topic.trim()} · ${item.label}`
                            : item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Personalizar com IA (mesmos chips do painel de ferramenta) */}
            <div className="border-t border-slate-100">
              <TeachyToolToolbar onApplyHint={applyHintFromHome} />
            </div>
          </section>

          {/* Bloco 2 — Grade de ferramentas (estilo repositório Teachy) */}
          <section className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Ferramentas com IA
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Materiais alinhados à BNCC — sem prompt complexo
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <PlanifyIcon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                />
                <input
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Buscar ferramenta…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-blue-300 focus:bg-white"
                />
              </div>
            </div>

            {!toolSearch.trim() ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {quickTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => openTool(tool.id)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 transition hover:bg-blue-100"
                  >
                    <PlanifyIcon name={tool.icon} className="h-3.5 w-3.5" />
                    {tool.shortTitle}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {toolCategories.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                      active
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                    }`}
                  >
                    <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => openTool(tool.id)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-slate-900">
                      {tool.shortTitle}
                    </span>
                    <span className="block truncate text-[10px] font-semibold text-slate-500">
                      {tool.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {filteredTools.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                Nenhuma ferramenta nesta categoria.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
