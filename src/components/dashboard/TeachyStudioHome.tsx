"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ReferralInvitePanel } from "@/components/referral/ReferralInvitePanel";
import { PlanifyHubRecentStrip } from "@/components/dashboard/PlanifyHubRecentStrip";
import { PlanifyEmptyState } from "@/components/ui/PlanifyEmptyState";
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

const START_HERE_CARDS = [
  {
    id: "anual",
    label: "Planejamento Anual",
    icon: "clipboard" as const,
    action: "planejamentos" as const,
    actionType: "section" as const,
    accent: "from-blue-500 to-blue-600",
  },
  {
    id: "trimestral",
    label: "Planejamento Trimestral",
    icon: "calendar" as const,
    action: "planejamentos" as const,
    actionType: "section" as const,
    accent: "from-violet-500 to-violet-600",
  },
  {
    id: "material",
    label: "Novo Material",
    icon: "layers" as const,
    action: "slides" as const,
    actionType: "tool" as const,
    accent: "from-emerald-500 to-emerald-600",
  },
  {
    id: "editor",
    label: "Abrir Editor",
    icon: "editor" as const,
    action: "editor" as const,
    actionType: "section" as const,
    accent: "from-orange-500 to-orange-600",
  },
  {
    id: "correcao",
    label: "Correção com IA",
    icon: "pen" as const,
    action: "correcao-ia" as const,
    actionType: "tool" as const,
    accent: "from-rose-500 to-rose-600",
  },
] as const;

const JOURNEY_CARDS = [
  {
    id: "planeje",
    label: "Planeje",
    description: "Matriz BNCC, plano de aula e sequências",
    icon: "clipboard" as const,
    action: "planejamentos" as const,
    actionType: "section" as const,
  },
  {
    id: "crie",
    label: "Crie",
    description: "Materiais, atividades, provas e jogos",
    icon: "spark" as const,
    action: "slides" as const,
    actionType: "tool" as const,
  },
  {
    id: "revise",
    label: "Revise",
    description: "Editor, correção IA e inclusão",
    icon: "editor" as const,
    action: "editor" as const,
    actionType: "section" as const,
  },
  {
    id: "compartilhe",
    label: "Compartilhe",
    description: "Classroom, biblioteca e comunidade",
    icon: "externalLink" as const,
    action: "biblioteca" as const,
    actionType: "section" as const,
  },
] as const;


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
  const [showCatalog, setShowCatalog] = useState(false);

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
  const categoryTabs = toolCategories.filter((entry) => entry.id !== "todos");

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

  function handleStartCard(card: (typeof START_HERE_CARDS)[number]) {
    if (card.actionType === "section") {
      openSection(card.action);
      return;
    }
    openTool(card.action);
  }

  function handleJourneyCard(card: (typeof JOURNEY_CARDS)[number]) {
    if (card.actionType === "section") {
      openSection(card.action);
      return;
    }
    openTool(card.action);
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

  return (
    <div className="pf-scope pf-app-home flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--pf-canvas)]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <section className="pf-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Olá, Professor! 👋
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                  Pronto para transformar seu planejamento hoje?
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSection("planejamentos")}
                className="pf-quick-action pf-quick-action--primary shrink-0"
              >
                <PlanifyIcon name="plus" className="h-4 w-4" />
                Novo planejamento
              </button>
            </div>

            <div className="mt-8">
              <p className="pf-eyebrow">Comece por aqui</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {START_HERE_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleStartCard(card)}
                    className="pf-dashboard-journey-card group text-left"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}
                    >
                      <PlanifyIcon name={card.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-extrabold text-slate-950">{card.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3">
                <PlanifyIcon name="spark" className="h-5 w-5 shrink-0 text-cyan-600" />
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  onBlur={() => persistTopic()}
                  placeholder="Tema da aula (opcional)"
                  aria-label="Tema da aula"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <Link
                href="/planos"
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--pf-border)] bg-white px-4 py-3 transition hover:border-[var(--pf-border-strong)]"
              >
                <span className="text-sm font-bold text-slate-700">Seu plano</span>
                <span className="text-xs font-semibold text-cyan-700">Ver planos →</span>
              </Link>
            </div>
          </section>

          <section className="mt-8">
            <p className="pf-eyebrow">Sua jornada</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
              Planeje → Crie → Revise → Compartilhe
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleJourneyCard(card)}
                  className="pf-dashboard-journey-card group"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                    <PlanifyIcon name={card.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-base font-extrabold text-slate-950">{card.label}</span>
                  <span className="text-sm font-medium leading-snug text-slate-500">
                    {card.description}
                  </span>
                  <span className="mt-auto flex items-center gap-1 text-xs font-bold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
                    Abrir
                    <PlanifyIcon name="arrowRight" className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <PlanifyHubRecentStrip onOpenHistorico={() => openSection("historico")} />
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="pf-eyebrow">Atalhos úteis</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">
                  Comunidade e ferramentas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalog((value) => !value)}
                className="pf-btn-secondary text-xs"
              >
                {showCatalog ? "Ocultar catálogo" : `Ver ${planifyToolCount} ferramentas`}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => openSection("marketplace")}
                className="pf-surface flex items-center gap-3 p-4 text-left transition hover:border-[var(--pf-border-strong)]"
              >
                <PlanifyIcon name="market" className="h-5 w-5 text-cyan-600" />
                <span>
                  <span className="block text-sm font-extrabold text-slate-950">Comunidade</span>
                  <span className="text-xs font-medium text-slate-500">Materiais de outros professores</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openSection("banco-questoes")}
                className="pf-surface flex items-center gap-3 p-4 text-left transition hover:border-[var(--pf-border-strong)]"
              >
                <PlanifyIcon name="library" className="h-5 w-5 text-cyan-600" />
                <span>
                  <span className="block text-sm font-extrabold text-slate-950">Banco de questões</span>
                  <span className="text-xs font-medium text-slate-500">Importe e remixe questões</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openTool("inclusao")}
                className="pf-surface flex items-center gap-3 p-4 text-left transition hover:border-[var(--pf-border-strong)]"
              >
                <PlanifyIcon name="spark" className="h-5 w-5 text-cyan-600" />
                <span>
                  <span className="block text-sm font-extrabold text-slate-950">Inclusão</span>
                  <span className="text-xs font-medium text-slate-500">Adaptação curricular com IA</span>
                </span>
              </button>
            </div>
          </section>

          {showCatalog ? (
            <section className="mt-8">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="pf-eyebrow">Catálogo completo</p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
                    {hasActiveFilter ? `${filteredTools.length} resultado(s)` : "Todos os geradores"}
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
                    Todos
                  </button>
                  {categoryTabs.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        onSelectCategory?.(cat.id);
                      }}
                      className={`pf-chip shrink-0 ${category === cat.id ? "pf-chip--active" : ""}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mb-4">
                <PlanifyIcon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ferramenta…"
                  className="w-full rounded-xl border border-[var(--pf-border)] bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--pf-border-strong)]"
                />
              </div>

              <div className="pf-catalog-grid">
                {filteredTools.map((tool) => renderToolCard(tool))}
              </div>

              {filteredTools.length === 0 ? (
                <PlanifyEmptyState
                  title="Nenhuma ferramenta encontrada"
                  description="Tente outro termo ou limpe os filtros."
                  actionLabel="Limpar filtros"
                  onAction={() => {
                    setQuery("");
                    setCategory("todos");
                  }}
                />
              ) : null}
            </section>
          ) : null}

          <section className="mt-8">
            <ReferralInvitePanel />
          </section>
        </div>
      </div>
    </div>
  );
}
