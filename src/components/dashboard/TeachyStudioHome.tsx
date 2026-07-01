"use client";

import { useMemo, useState } from "react";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  activePlanifyTools,
  toolCategories,
  type PlanifyTool,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  initialTopic?: string;
  onTopicChange?: (topic: string) => void;
};

function filterTools(category: ToolCategoryId): PlanifyTool[] {
  return activePlanifyTools.filter(
    (tool) => category === "todos" || tool.category === category,
  );
}

export default function TeachyStudioHome({
  onSelectTool,
  onSelectSection,
  initialTopic = "",
  onTopicChange,
}: TeachyStudioHomeProps) {
  const [category, setCategory] = useState<ToolCategoryId>("todos");

  const hasActiveFilter = category !== "todos";
  const filteredTools = useMemo(() => filterTools(category), [category]);
  const showPlanejamentos = category === "todos" || category === "planejamento";
  const categoryTabs = toolCategories.filter((entry) => entry.id !== "todos");
  const extraSections = showPlanejamentos ? 1 : 0;
  const resultCount = filteredTools.length + extraSections;

  const featuredTools = useMemo(
    () => activePlanifyTools.filter((tool) => tool.popular).slice(0, 4),
    [],
  );
  const showFeatured = !hasActiveFilter && featuredTools.length > 0;

  function persistTopic() {
    const tema = initialTopic.trim();
    onTopicChange?.(tema);
    if (!tema) return;
    try {
      sessionStorage.setItem("planify-studio-tema", tema);
    } catch {
      /* ignore */
    }
  }

  function openTool(toolId: PlanifyToolId) {
    persistTopic();
    onSelectTool(toolId);
  }

  function openPlanejamentos() {
    persistTopic();
    onSelectSection?.("planejamentos");
  }

  function renderToolCard(tool: PlanifyTool) {
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => openTool(tool.id)}
        className="pl-hud-hub-app group flex min-h-[10rem] flex-col rounded-2xl p-5 text-left sm:min-h-[10.5rem]"
      >
        <span
          className={`pl-hud-hub-tool-icon bg-gradient-to-br ${tool.accent} h-11 w-11`}
        >
          <PlanifyIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="relative mt-3 text-sm font-semibold tracking-tight text-slate-900">
          {tool.shortTitle}
        </span>
        <span className="relative mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
          {tool.description}
        </span>
        {tool.popular ? (
          <span className="relative mt-2 inline-flex w-fit rounded-full border border-amber-300/40 bg-amber-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Popular
          </span>
        ) : null}
        <span className="relative mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
          Abrir
          <PlanifyIcon name="arrowRight" className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </button>
    );
  }

  function renderFeaturedCard(tool: PlanifyTool) {
    return (
      <button
        key={`featured-${tool.id}`}
        type="button"
        onClick={() => openTool(tool.id)}
        className="pl-hud-hub-app group flex items-start gap-4 rounded-2xl p-5 text-left"
      >
        <span
          className={`pl-hud-hub-tool-icon bg-gradient-to-br ${tool.accent} h-12 w-12 shrink-0`}
        >
          <PlanifyIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold tracking-tight text-slate-900">
              {tool.shortTitle}
            </span>
            <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Popular
            </span>
          </span>
          <span className="mt-1 line-clamp-2 block text-sm font-medium leading-snug text-slate-600">
            {tool.description}
          </span>
          <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
            Abrir
            <PlanifyIcon name="arrowRight" className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </span>
        </span>
      </button>
    );
  }

  function renderPlanejamentosCard() {
    return (
      <button
        type="button"
        onClick={openPlanejamentos}
        className="pl-hud-hub-app group flex min-h-[10rem] flex-col rounded-2xl p-5 text-left sm:min-h-[10.5rem]"
      >
        <span className="pl-hud-hub-tool-icon flex h-11 w-11 items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
          <PlanifyIcon name="clipboard" className="h-5 w-5" />
        </span>
        <span className="relative mt-3 text-sm font-semibold tracking-tight text-slate-900">Planejamentos</span>
        <span className="relative mt-1.5 text-sm font-medium leading-snug text-slate-600">
          Matriz BNCC anual ou trimestral · sugira habilidades · exportação Google Docs oficial
        </span>
        <span className="relative mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
          Abrir
          <PlanifyIcon name="arrowRight" className="h-3 w-3" />
        </span>
      </button>
    );
  }

  return (
    <div className="pl-hud-hub pl-hud-board pl-hud-home flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
          <header className="pl-hud-hub-reveal mb-7 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
              Estúdio Planify
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
              O que vamos{" "}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                criar hoje?
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Escolha uma ferramenta de IA alinhada à BNCC e gere seu material em segundos.
            </p>
          </header>

          {showFeatured ? (
            <section className="pl-hud-hub-reveal mb-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="pl-hud-hub-section-icon">
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">
                    Em destaque
                  </p>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                    Mais usadas pelos professores
                  </h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredTools.map((tool) => renderFeaturedCard(tool))}
              </div>
            </section>
          ) : null}

          <section className="pl-hud-hub-reveal">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Ferramentas IA
                </p>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  {hasActiveFilter ? `${resultCount} resultado(s)` : "Todos os geradores"}
                </h2>
              </div>
              <div className="pl-hud-hub-category-scroll min-w-0 max-w-full lg:max-w-none">
                <div className="pl-hud-hub-category-scroll-inner">
                  <button
                    type="button"
                    onClick={() => setCategory("todos")}
                    className={`pl-hud-hub-category-pill shrink-0 ${
                      category === "todos" ? "pl-hud-hub-category-pill--active" : ""
                    }`}
                  >
                    <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                    Todos
                  </button>
                  {categoryTabs.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`pl-hud-hub-category-pill shrink-0 ${
                          active ? "pl-hud-hub-category-pill--active" : ""
                        }`}
                      >
                        <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pl-hud-tools-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showPlanejamentos ? renderPlanejamentosCard() : null}
              {filteredTools.map((tool) => renderToolCard(tool))}
            </div>

            {!showPlanejamentos && filteredTools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-white/70 px-6 py-12 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Nenhum resultado
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Nenhuma ferramenta encontrada
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Escolha outra categoria ou volte para ver todas as ferramentas.
                </p>
                <button
                  type="button"
                  onClick={() => setCategory("todos")}
                  className="pl-hud-btn mt-5 rounded-xl px-5 py-2.5 text-xs font-semibold"
                >
                  Limpar filtros
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
