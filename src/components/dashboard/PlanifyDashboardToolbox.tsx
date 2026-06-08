"use client";

import { useMemo, useState, type RefObject } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

type PlanifyDashboardToolboxProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSelectTool: (toolId: PlanifyToolId) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

export function PlanifyDashboardToolbox({
  query,
  onQueryChange,
  onSelectTool,
  topic,
  onTopicChange,
  searchInputRef,
}: PlanifyDashboardToolboxProps) {
  const [category, setCategory] = useState<ToolCategoryId>("todos");

  const filteredTools = useMemo(() => {
    const term = query.trim().toLowerCase();
    return planifyTools.filter((tool) => {
      const matchCat = category === "todos" || tool.category === category;
      const matchTerm =
        !term ||
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }, [category, query]);

  const tabs = toolCategories.filter((c) => c.id !== "todos");

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
          Criar materiais personalizados com IA
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Escolha a ferramenta abaixo — o conteúdo abre aqui ao lado, sem sair do
          painel.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <PlanifyIcon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Busque por ferramentas, tópicos, materiais…"
              aria-label="Buscar ferramentas"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <input
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            placeholder="Tema da aula (opcional)"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white sm:max-w-[220px]"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategory("todos")}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${
              category === "todos"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>
          {tabs.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col items-center rounded-xl border border-transparent bg-slate-50/60 px-2 py-3 text-center transition hover:border-indigo-200 hover:bg-white hover:shadow-sm"
            >
              {tool.popular ? (
                <span className="absolute -top-1 right-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-950">
                  Popular
                </span>
              ) : null}
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-105`}
              >
                <PlanifyIcon name={tool.icon} className="h-5 w-5" />
              </span>
              <span className="mt-2 line-clamp-2 text-[11px] font-black leading-tight text-slate-800">
                {tool.shortTitle}
              </span>
            </button>
          ))}
        </div>

        {filteredTools.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-slate-400">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default PlanifyDashboardToolbox;
