"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ReferralInvitePanel } from "@/components/referral/ReferralInvitePanel";
import {
  planifyToolCount,
  planifyTools,
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

const trustStats = [
  { value: "BNCC", label: "Alinhamento curricular" },
  { value: "Google Docs", label: "Modelo oficial" },
  { value: "Classroom", label: "Publicação direta" },
] as const;

function matchesPlanejamentosSearch(term: string): boolean {
  if (!term) return true;
  return ["planejamento", "planejamentos", "bncc", "google", "docs", "matriz", "anual", "trimestral"].some(
    (token) => token.includes(term) || term.includes(token),
  );
}

function matchesBancoQuestoesSearch(term: string): boolean {
  if (!term) return true;
  return ["banco", "questões", "questoes", "bncc", "prova", "lista", "comunidade", "remix"].some(
    (token) => token.includes(term) || term.includes(token),
  );
}

function filterTools(query: string, category: ToolCategoryId): PlanifyTool[] {
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
}

export default function TeachyStudioHome({
  onSelectTool,
  onSelectSection,
  initialTopic = "",
  onTopicChange,
}: TeachyStudioHomeProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryId>("todos");

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const hasActiveFilter = query.trim() !== "" || category !== "todos";
  const filteredTools = useMemo(
    () => filterTools(query, category),
    [category, query],
  );
  const showPlanejamentos =
    (category === "todos" || category === "planejamento") &&
    matchesPlanejamentosSearch(query.trim().toLowerCase());
  const showBancoQuestoes =
    (category === "todos" || category === "avaliacoes") &&
    matchesBancoQuestoesSearch(query.trim().toLowerCase());
  const categoryTabs = toolCategories.filter((entry) => entry.id !== "todos");
  const extraSections = (showPlanejamentos ? 1 : 0) + (showBancoQuestoes ? 1 : 0);
  const totalGenerators = planifyToolCount + 2;
  const resultCount = filteredTools.length + extraSections;

  function persistTopic(value = topic) {
    const tema = value.trim();
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

  function openBancoQuestoes() {
    persistTopic();
    onSelectSection?.("banco-questoes");
  }

  function renderToolCard(tool: PlanifyTool) {
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => openTool(tool.id)}
        className="ps-pro-tool-card group flex min-h-[10rem] flex-col p-5 text-left sm:min-h-[10.5rem]"
      >
        <span
          className={`ps-pro-tool-card-icon bg-gradient-to-br ${tool.accent}`}
        >
          <PlanifyIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="relative mt-4 text-lg font-extrabold text-slate-950">
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

  function renderBancoQuestoesCard() {
    return (
      <button
        type="button"
        onClick={openBancoQuestoes}
        className="ps-pro-tool-card group flex min-h-[10rem] flex-col p-5 text-left sm:min-h-[10.5rem]"
      >
        <span className="ps-pro-tool-card-icon bg-gradient-to-br from-emerald-500 to-teal-500">
          <PlanifyIcon name="library" className="h-5 w-5" />
        </span>
        <span className="relative mt-4 text-lg font-extrabold text-slate-950">
          Banco de questões
        </span>
        <span className="relative mt-1.5 text-sm font-medium leading-snug text-slate-600">
          Importe, reutilize e remixe — busca por BNCC, disciplina e série
        </span>
        <span className="relative mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
          Abrir
          <PlanifyIcon name="arrowRight" className="h-3 w-3" />
        </span>
      </button>
    );
  }

  function renderPlanejamentosCard() {
    return (
      <button
        type="button"
        onClick={openPlanejamentos}
        className="ps-pro-tool-card group flex min-h-[10rem] flex-col p-5 text-left sm:min-h-[10.5rem]"
      >
        <span className="ps-pro-tool-card-icon bg-gradient-to-br from-cyan-500 to-indigo-600">
          <PlanifyIcon name="clipboard" className="h-5 w-5" />
        </span>
        <span className="relative mt-4 text-lg font-extrabold text-slate-950">Planejamentos</span>
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
    <div className="planify-studio-pro ps-pro-shell pl-hud-hub pl-hud-board pl-hud-home flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          <section className="ps-pro-section-card pl-hud-hub-hero pl-hud-hub-reveal p-6 sm:p-8 lg:p-10">
            <div className="pl-hud-hub-mesh" aria-hidden />
            <div className="pl-hud-hub-grid-bg" aria-hidden />

            <div className="relative">
              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                {totalGenerators} geradores com IA e planejamentos oficiais — busque abaixo ou
                escolha uma categoria.
              </p>

              <div className="pl-hud-hub-trust mt-6">
                <div className="pl-hud-hub-trust-item">
                  <span className="pl-hud-hub-trust-value">{totalGenerators}+</span>
                  <span className="pl-hud-hub-trust-label">Geradores IA</span>
                </div>
                {trustStats.map((stat) => (
                  <div key={stat.label} className="pl-hud-hub-trust-item">
                    <span className="pl-hud-hub-trust-value">{stat.value}</span>
                    <span className="pl-hud-hub-trust-label">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <label className="sr-only" htmlFor="hub-tool-search">
                  Buscar ferramentas
                </label>
                <label className="sr-only" htmlFor="hub-topic">
                  Tema da aula
                </label>
                <div className="pl-hud-hub-command">
                  <div className="pl-hud-hub-command-row flex-col sm:flex-row">
                    <div className="pl-hud-hub-command-field">
                      <PlanifyIcon name="search" />
                      <input
                        id="hub-tool-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar slides, prova, sequência, inclusão…"
                        aria-label="Buscar ferramentas"
                      />
                    </div>
                    <div className="pl-hud-hub-command-field border-t border-cyan-400/15 sm:border-t-0">
                      <PlanifyIcon name="spark" />
                      <input
                        id="hub-topic"
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        onBlur={() => persistTopic()}
                        placeholder="Tema da aula (opcional)"
                        aria-label="Tema da aula"
                      />
                    </div>
                  </div>
                  <div className="pl-hud-hub-command-hint">
                    <PlanifyIcon name="spark" className="h-3 w-3" />
                    Launcher do estúdio — busque ferramentas ou defina o tema antes de abrir
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="pl-hud-hub-reveal mt-10"
            style={{ animationDelay: "80ms" }}
          >
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Ferramentas IA
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
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
              {showBancoQuestoes ? renderBancoQuestoesCard() : null}
              {filteredTools.map((tool) => renderToolCard(tool))}
            </div>

            {!showPlanejamentos && !showBancoQuestoes && filteredTools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-white/70 px-6 py-12 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Nenhum resultado
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                  Nenhuma ferramenta encontrada
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Tente outro termo ou limpe os filtros para ver todas as ferramentas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("todos");
                  }}
                  className="pl-hud-btn mt-5 rounded-xl px-5 py-2.5 text-xs font-semibold"
                >
                  Limpar filtros
                </button>
              </div>
            ) : null}
          </section>

          <section className="pl-hud-hub-reveal mt-8" style={{ animationDelay: "120ms" }}>
            <ReferralInvitePanel />
          </section>
        </div>
      </div>
    </div>
  );
}
