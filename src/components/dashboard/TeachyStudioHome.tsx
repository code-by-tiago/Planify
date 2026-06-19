"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ReferralInvitePanel } from "@/components/referral/ReferralInvitePanel";
import { PlanifyHubRecentStrip } from "@/components/dashboard/PlanifyHubRecentStrip";
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
  initialCategory?: ToolCategoryId | null;
  onTopicChange?: (topic: string) => void;
  onSelectCategory?: (category: ToolCategoryId) => void;
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
  initialCategory = null,
  onTopicChange,
  onSelectCategory,
}: TeachyStudioHomeProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategoryId>(initialCategory ?? "todos");

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

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
        className="pf-tool-card group flex flex-col text-left"
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-105`}
        >
          <PlanifyIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="mt-4 text-lg font-extrabold text-slate-950">
          {tool.shortTitle}
        </span>
        <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
          {tool.description}
        </span>
        {tool.popular ? (
          <span className="mt-2 inline-flex w-fit rounded-full border border-amber-300/40 bg-amber-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Popular
          </span>
        ) : null}
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
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
        className="pf-tool-card group flex flex-col text-left"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm transition group-hover:scale-105">
          <PlanifyIcon name="library" className="h-5 w-5" />
        </span>
        <span className="mt-4 text-lg font-extrabold text-slate-950">
          Banco de questões
        </span>
        <span className="mt-1.5 text-sm font-medium leading-snug text-slate-600">
          Importe, reutilize e remixe — busca por BNCC, disciplina e série
        </span>
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
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
        className="pf-tool-card group flex flex-col text-left"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-sm transition group-hover:scale-105">
          <PlanifyIcon name="clipboard" className="h-5 w-5" />
        </span>
        <span className="mt-4 text-lg font-extrabold text-slate-950">Planejamentos</span>
        <span className="mt-1.5 text-sm font-medium leading-snug text-slate-600">
          Matriz BNCC anual ou trimestral · sugira habilidades · exportação Google Docs oficial
        </span>
        <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
          Abrir
          <PlanifyIcon name="arrowRight" className="h-3 w-3" />
        </span>
      </button>
    );
  }

  return (
    <div className="pf-scope pf-app-home flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--pf-canvas)]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <section className="pf-surface p-6 sm:p-8">
            <p className="pf-eyebrow">Estúdio Planify</p>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              {totalGenerators} geradores com IA e planejamentos oficiais — busque abaixo ou
              escolha uma categoria.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3">
                <span className="block text-lg font-extrabold text-[var(--pf-accent)]">
                  {totalGenerators}+
                </span>
                <span className="text-xs font-semibold text-slate-500">Geradores IA</span>
              </div>
              {trustStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3"
                >
                  <span className="block text-sm font-extrabold text-slate-900">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="sr-only" htmlFor="hub-tool-search">
                Buscar ferramentas
              </label>
              <label className="sr-only" htmlFor="hub-topic">
                Tema da aula
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3">
                  <PlanifyIcon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    id="hub-tool-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar slides, prova, sequência, inclusão…"
                    aria-label="Buscar ferramentas"
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3">
                  <PlanifyIcon name="spark" className="h-5 w-5 shrink-0 text-cyan-600" />
                  <input
                    id="hub-topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    onBlur={() => persistTopic()}
                    placeholder="Tema da aula (opcional)"
                    aria-label="Tema da aula"
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="pf-eyebrow">Ferramentas IA</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                  {hasActiveFilter ? `${resultCount} resultado(s)` : "Todos os geradores"}
                </h2>
              </div>
              <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-none">
                <button
                  type="button"
                  onClick={() => {
                    setCategory("todos");
                    onSelectCategory?.("todos");
                  }}
                  className={`pf-chip shrink-0 ${category === "todos" ? "pf-chip--active" : ""}`}
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
                      onClick={() => {
                        setCategory(cat.id);
                        onSelectCategory?.(cat.id);
                      }}
                      className={`pf-chip shrink-0 ${active ? "pf-chip--active" : ""}`}
                    >
                      <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pf-catalog-grid">
              {showPlanejamentos ? renderPlanejamentosCard() : null}
              {showBancoQuestoes ? renderBancoQuestoesCard() : null}
              {filteredTools.map((tool) => renderToolCard(tool))}
            </div>

            {!showPlanejamentos && !showBancoQuestoes && filteredTools.length === 0 ? (
              <div className="pf-surface col-span-full px-6 py-12 text-center">
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
                  className="pf-btn-primary mt-5"
                >
                  Limpar filtros
                </button>
              </div>
            ) : null}
          </section>

          <section className="mt-8">
            <PlanifyHubRecentStrip onOpenHistorico={() => onSelectSection?.("historico")} />
          </section>

          <section className="mt-8">
            <ReferralInvitePanel />
          </section>
        </div>
      </div>
    </div>
  );
}
