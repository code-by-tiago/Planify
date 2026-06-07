"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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

const workspaceShortcuts: {
  id: DashboardSectionId;
  label: string;
  description: string;
  icon: "editor" | "history" | "library" | "market";
  accent: string;
}[] = [
  {
    id: "editor",
    label: "Editor",
    description: "Refine, exporte e publique",
    icon: "editor",
    accent: "from-emerald-400 to-teal-600",
  },
  {
    id: "historico",
    label: "Meus materiais",
    description: "Tudo que você gerou",
    icon: "history",
    accent: "from-slate-500 to-slate-800",
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    description: "Materiais premium curados",
    icon: "library",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "marketplace",
    label: "Comunidade",
    description: "Trocas entre professores",
    icon: "market",
    accent: "from-sky-400 to-cyan-600",
  },
];

const trustStats = [
  { value: "BNCC", label: "Alinhamento curricular" },
  { value: "DOCX", label: "Modelo oficial" },
  { value: "Classroom", label: "Publicação direta" },
  { value: "Slides", label: "Exportação Google" },
] as const;

function matchesPlanejamentosSearch(term: string): boolean {
  if (!term) return true;
  return ["planejamento", "planejamentos", "bncc", "docx", "matriz", "anual", "trimestral"].some(
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
  const popularTools = useMemo(
    () => planifyTools.filter((tool) => tool.popular),
    [],
  );
  const showPlanejamentos =
    (category === "todos" || category === "planejamento") &&
    matchesPlanejamentosSearch(query.trim().toLowerCase());
  const showPlanejamentosInGrid = showPlanejamentos && hasActiveFilter;
  const gridTools = useMemo(() => {
    if (hasActiveFilter) return filteredTools;
    const featuredPopularIds = new Set(
      popularTools.slice(0, 2).map((tool) => tool.id),
    );
    return planifyTools.filter((tool) => !featuredPopularIds.has(tool.id));
  }, [filteredTools, hasActiveFilter, popularTools]);
  const categoryTabs = toolCategories.filter((entry) => entry.id !== "todos");
  const totalGenerators = planifyToolCount + 1;

  const toolsByCategory = useMemo(() => {
    if (hasActiveFilter) return [];
    return categoryTabs
      .map((cat) => ({
        ...cat,
        tools: gridTools.filter((tool) => tool.category === cat.id),
      }))
      .filter((group) => group.tools.length > 0);
  }, [categoryTabs, gridTools, hasActiveFilter]);

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

  function openSection(sectionId: DashboardSectionId) {
    persistTopic();
    onSelectSection?.(sectionId);
  }

  function renderToolCard(tool: PlanifyTool, variant: "default" | "compact" | "featured" = "default") {
    const compact = variant === "compact";
    const featured = variant === "featured";

    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => openTool(tool.id)}
        className={`pl-hud-hub-app group flex flex-col text-left ${
          featured ? "pl-hud-hub-tool-featured rounded-2xl p-5" : compact ? "min-h-[9rem] rounded-2xl p-4" : "min-h-[10rem] rounded-2xl p-5 sm:min-h-[10.5rem]"
        }`}
      >
        <span
          className={`pl-hud-hub-tool-icon bg-gradient-to-br ${tool.accent} ${
            compact ? "h-10 w-10" : "h-11 w-11"
          }`}
        >
          <PlanifyIcon name={tool.icon} className={compact ? "h-5 w-5" : "h-5 w-5"} />
        </span>
        <span
          className={`relative font-extrabold text-slate-950 ${
            compact ? "mt-3 text-base" : "mt-4 text-lg"
          }`}
        >
          {tool.shortTitle}
        </span>
        <span
          className={`relative line-clamp-2 font-medium leading-snug text-slate-600 ${
            compact ? "mt-1 text-xs" : "mt-1.5 text-sm"
          }`}
        >
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

  function renderPlanejamentosHero() {
    return (
      <button
        type="button"
        onClick={() => openSection("planejamentos")}
        className="pl-hud-hub-bento-hero group flex min-h-[14rem] flex-col p-6 sm:min-h-[16rem] sm:p-7"
      >
        <div className="relative flex items-start justify-between gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_24px_rgba(0,212,255,0.35)]">
            <PlanifyIcon name="clipboard" className="h-7 w-7" />
          </span>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
            Fluxo BNCC
          </span>
        </div>
        <span className="relative mt-6 text-2xl font-extrabold tracking-tight text-white sm:text-[1.65rem]">
          Planejamentos
        </span>
        <span className="relative mt-2 max-w-md text-sm font-medium leading-relaxed text-cyan-100/80">
          Matriz anual ou trimestral · sugira habilidades por conteúdo · DOCX oficial
          preenchido com IA
        </span>
        <div className="relative mt-5 flex flex-wrap gap-2">
          {["Matriz pedagógica", "Habilidades BNCC", "DOCX oficial"].map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-cyan-400/20 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-100/90"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="relative mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-cyan-300 transition group-hover:gap-2.5">
          Continuar planejando
          <PlanifyIcon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </button>
    );
  }

  function renderPlanejamentosCard() {
    return (
      <button
        type="button"
        onClick={() => openSection("planejamentos")}
        className="pl-hud-hub-app group flex min-h-[10rem] flex-col rounded-2xl p-5 text-left sm:min-h-[10.5rem]"
      >
        <span className="pl-hud-hub-tool-icon flex h-11 w-11 items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
          <PlanifyIcon name="clipboard" className="h-5 w-5" />
        </span>
        <span className="relative mt-4 text-lg font-extrabold text-slate-950">Planejamentos</span>
        <span className="relative mt-1.5 text-sm font-medium leading-snug text-slate-600">
          Matriz BNCC anual ou trimestral · sugira habilidades · DOCX oficial preenchido
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
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          <section className="pl-hud-hub-hero pl-hud-hub-reveal p-6 sm:p-8 lg:p-10">
            <div className="pl-hud-hub-mesh" aria-hidden />
            <div className="pl-hud-hub-grid-bg" aria-hidden />

            <div className="relative">
              <span className="pl-hud-badge">
                <PlanifyIcon name="spark" className="h-3 w-3" />
                Estúdio pedagógico · BNCC
              </span>
              <h1 className="pl-hud-display mt-4 max-w-2xl text-[1.85rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem]">
                O que vamos{" "}
                <span className="pl-hud-gradient-text">criar hoje?</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                {totalGenerators} geradores com IA, planejamentos oficiais e espaço de trabalho
                completo — escolha a ferramenta, descreva o contexto e exporte em segundos.
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
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Espaço de trabalho
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                  Continue criando
                </h2>
              </div>
            </div>
            <div className="pl-hud-hub-workspace-rail">
              {workspaceShortcuts.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSection(item.id)}
                  className="pl-hud-hub-workspace-card group p-4 sm:p-5"
                  style={{ animationDelay: `${120 + index * 50}ms` }}
                >
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm transition motion-safe:group-hover:scale-105`}
                  >
                    <PlanifyIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="relative mt-3 block text-sm font-extrabold text-slate-950">
                    {item.label}
                  </span>
                  <span className="relative mt-1 block line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
                    {item.description}
                  </span>
                  <span className="relative mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-700 opacity-0 transition group-hover:opacity-100">
                    Abrir
                    <PlanifyIcon name="arrowRight" className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          {!hasActiveFilter ? (
            <section
              className="pl-hud-hub-reveal mt-12"
              style={{ animationDelay: "140ms" }}
            >
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Destaques
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                  Comece pelo essencial
                </h2>
              </div>
              <div className="pl-hud-hub-bento">
                {renderPlanejamentosHero()}
                <div className="grid gap-4">
                  {popularTools.slice(0, 2).map((tool) => renderToolCard(tool, "featured"))}
                </div>
              </div>
            </section>
          ) : null}

          <section
            className="pl-hud-hub-reveal mt-12"
            style={{ animationDelay: "180ms" }}
          >
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Ferramentas IA
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                  {hasActiveFilter
                    ? `${gridTools.length + (showPlanejamentosInGrid ? 1 : 0)} resultado(s)`
                    : "Explore por categoria"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("todos")}
                  className={`pl-hud-hub-category-pill ${
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
                      className={`pl-hud-hub-category-pill ${
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

            {hasActiveFilter ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {showPlanejamentosInGrid ? renderPlanejamentosCard() : null}
                {gridTools.map((tool) => renderToolCard(tool))}
              </div>
            ) : (
              <div className="space-y-10">
                {toolsByCategory.map((group) => (
                  <div key={group.id}>
                    <div className="pl-hud-hub-section-head">
                      <span className="pl-hud-hub-section-icon">
                        <PlanifyIcon name={group.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950 sm:text-lg">
                          {group.label}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {group.tools.length} ferramenta{group.tools.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.tools.map((tool) => renderToolCard(tool))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showPlanejamentosInGrid && gridTools.length === 0 ? (
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
        </div>
      </div>
    </div>
  );
}
