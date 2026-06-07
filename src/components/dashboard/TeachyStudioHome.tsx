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
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "historico",
    label: "Meus materiais",
    description: "Tudo que você gerou",
    icon: "history",
    accent: "from-slate-600 to-slate-800",
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    description: "Materiais premium curados",
    icon: "library",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "marketplace",
    label: "Comunidade",
    description: "Trocas entre professores",
    icon: "market",
    accent: "from-fuchsia-500 to-pink-600",
  },
];

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

  function renderToolCard(tool: PlanifyTool, compact = false) {
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => openTool(tool.id)}
        className={`pl-hud-hub-app group flex flex-col text-left transition motion-safe:hover:-translate-y-0.5 ${
          compact
            ? "min-h-[8.5rem] rounded-2xl p-4"
            : "min-h-[9.5rem] rounded-2xl p-5 sm:min-h-[10.5rem]"
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm ${
            compact ? "h-10 w-10" : "h-12 w-12"
          }`}
        >
          <PlanifyIcon name={tool.icon} className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </span>
        <span
          className={`font-extrabold text-slate-950 ${compact ? "mt-3 text-base" : "mt-4 text-lg"}`}
        >
          {tool.shortTitle}
        </span>
        {!compact ? (
          <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
            {tool.description}
          </span>
        ) : (
          <span className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
            {tool.description}
          </span>
        )}
        {tool.popular ? (
          <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
            Popular
          </span>
        ) : null}
        <span className="mt-auto pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:opacity-100 group-hover:underline">
          Abrir →
        </span>
      </button>
    );
  }

  function renderPlanejamentosCard(large = false) {
    return (
      <button
        type="button"
        onClick={() => openSection("planejamentos")}
        className={`pl-hud-hub-app group flex flex-col rounded-2xl text-left transition motion-safe:hover:-translate-y-0.5 ${
          large
            ? "pl-hud-hub-bento-lg min-h-[11rem] p-6 sm:min-h-[12rem]"
            : "min-h-[9.5rem] p-5 sm:min-h-[10.5rem]"
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
          <PlanifyIcon name="clipboard" className="h-6 w-6" />
        </span>
        <span className={`font-extrabold text-slate-950 ${large ? "mt-5 text-xl" : "mt-4 text-lg"}`}>
          Planejamentos
        </span>
        <span
          className={`font-medium leading-snug text-slate-600 ${
            large ? "mt-2 max-w-md text-sm" : "mt-1.5 text-sm"
          }`}
        >
          Matriz BNCC anual ou trimestral · sugira habilidades · DOCX oficial preenchido
        </span>
        {large ? (
          <span className="mt-4 inline-flex w-fit rounded-full border border-cyan-400/25 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-800">
            Fluxo completo BNCC
          </span>
        ) : null}
        <span className="mt-auto pt-3 text-xs font-semibold text-cyan-700 group-hover:underline">
          Abrir →
        </span>
      </button>
    );
  }

  return (
    <div className="pl-hud-hub pl-hud-board pl-hud-home flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          <section className="pl-hud-hub-welcome relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"
              aria-hidden
            />
            <div className="relative grid gap-6 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-600">
                  Estúdio pedagógico · BNCC
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-[2rem]">
                  O que vamos{" "}
                  <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    criar hoje?
                  </span>
                </h1>
                <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                  {totalGenerators} geradores com IA, planejamentos oficiais e espaço de
                  trabalho completo — escolha a ferramenta, descreva o contexto e exporte
                  em segundos.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    `${totalGenerators} ferramentas`,
                    "Matriz BNCC",
                    "DOCX oficial",
                    "Google Classroom",
                  ].map((label) => (
                    <span
                      key={label}
                      className="pl-hud-hub-stat-pill rounded-full px-3 py-1 text-[11px] font-bold text-slate-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-slate-600">Buscar ferramenta</span>
                  <div className="relative">
                    <PlanifyIcon
                      name="search"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Slides, prova, sequência, inclusão…"
                      aria-label="Buscar ferramentas"
                      className="h-11 w-full rounded-xl border border-cyan-400/15 bg-white/90 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100/80"
                    />
                  </div>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Tema da aula (opcional)
                  </span>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    onBlur={() => persistTopic()}
                    placeholder="Ex.: Frações, Sistema solar, Revolução Industrial…"
                    className="h-11 w-full rounded-xl border border-cyan-400/15 bg-white/90 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100/80"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Espaço de trabalho
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">
                  Seus materiais e rede docente
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {workspaceShortcuts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSection(item.id)}
                  className="pl-hud-hub-workspace-chip group flex flex-col rounded-2xl p-4 text-left transition motion-safe:hover:-translate-y-0.5"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm transition motion-safe:group-hover:scale-105`}
                  >
                    <PlanifyIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="mt-3 text-sm font-extrabold text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {!hasActiveFilter ? (
            <section className="mt-10">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Destaques
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">
                  Comece pelo essencial
                </h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {renderPlanejamentosCard(true)}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {popularTools.slice(0, 2).map((tool) => renderToolCard(tool, true))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Ferramentas IA
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">
                  {hasActiveFilter
                    ? `${gridTools.length + (showPlanejamentosInGrid ? 1 : 0)} resultado(s)`
                    : "Todos os geradores"}
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCategory("todos")}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    category === "todos"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                      : "border border-cyan-400/15 bg-white/80 text-slate-600 hover:border-cyan-400/30"
                  }`}
                >
                  Todos
                </button>
                {categoryTabs.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        active
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                          : "border border-cyan-400/15 bg-white/80 text-slate-600 hover:border-cyan-400/30"
                      }`}
                    >
                      <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showPlanejamentosInGrid ? renderPlanejamentosCard() : null}
              {gridTools.map((tool) => renderToolCard(tool))}
            </div>

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
