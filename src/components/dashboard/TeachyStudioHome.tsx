"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlanifyHubRecentStrip } from "@/components/dashboard/PlanifyHubRecentStrip";
import { PlanifyHubStatsRow } from "@/components/dashboard/PlanifyHubStatsRow";
import { TeachyToolToolbar } from "@/components/dashboard/TeachyToolToolbar";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { writePlanejamentoPrefill } from "@/lib/planejamentos/planejamento-prefill";
import {
  lessonBundleObjetivoHint,
  lessonBundleTools,
  teachyFeaturedToolIds,
} from "@/lib/pro/teachyStudio";
import {
  planifyTools,
  planifyToolCount,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

const OBJETIVO_HINT_KEY = "planify-studio-objetivo-hint";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  initialTopic?: string;
  onTopicChange?: (topic: string) => void;
};

const workspaceApps: {
  section: DashboardSectionId;
  title: string;
  description: string;
  icon: "clipboard" | "editor" | "history" | "library" | "market";
  accent: string;
}[] = [
  {
    section: "planejamentos",
    title: "Planejamentos",
    description: "Matriz BNCC anual ou trimestral · DOCX oficial",
    icon: "clipboard",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    section: "editor",
    title: "Editor",
    description: "Revise, exporte DOCX e publique no Classroom",
    icon: "editor",
    accent: "from-sky-500 to-cyan-600",
  },
  {
    section: "historico",
    title: "Histórico",
    description: "Tudo que você gerou — retome em um clique",
    icon: "history",
    accent: "from-slate-600 to-slate-800",
  },
  {
    section: "biblioteca",
    title: "Biblioteca",
    description: "Materiais salvos e organizados por você",
    icon: "library",
    accent: "from-teal-500 to-cyan-600",
  },
  {
    section: "marketplace",
    title: "Marketplace",
    description: "Recursos da comunidade pedagógica",
    icon: "market",
    accent: "from-blue-500 to-indigo-600",
  },
];

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
  onSelectSection,
  initialTopic = "",
  onTopicChange,
}: TeachyStudioHomeProps) {
  const session = usePlanifySession();
  const [topic, setTopic] = useState(initialTopic);
  const [category, setCategory] = useState<ToolCategoryId>("todos");
  const [toolSearch, setToolSearch] = useState("");

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

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
    onTopicChange?.(tema);
  }

  function openTool(toolId: PlanifyToolId) {
    persistTopicForTool();
    onSelectTool(toolId);
  }

  function openSection(sectionId: DashboardSectionId) {
    persistTopicForTool();
    onSelectSection?.(sectionId);
  }

  function openPlanejamento(tipo: "anual" | "trimestral") {
    persistTopicForTool();
    writePlanejamentoPrefill({
      tipo,
      conteudos: topic.trim() || undefined,
    });
    onSelectSection?.("planejamentos");
  }

  function handleBuildLesson(event: FormEvent) {
    event.preventDefault();
    const tema = topic.trim();
    if (!tema) return;
    persistTopicForTool();
    try {
      sessionStorage.setItem(OBJETIVO_HINT_KEY, lessonBundleObjetivoHint);
    } catch {
      /* ignore */
    }
    onSelectTool("slides");
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

  const greeting = session.loading
    ? "Olá, professor"
    : `Olá, ${session.displayName}`;

  return (
    <div className="pl-hud-hub pl-hud-board pl-hud-home flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          {/* Welcome — social profile card */}
          <section className="pl-hud-glass relative overflow-hidden rounded-2xl p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <PlanifyOwlMark size={72} glow hero />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
                    Sua rede pedagógica
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                    {greeting}
                  </h1>
                  <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-600">
                    {session.planLabel
                      ? `Plano ${session.planLabel} · `
                      : ""}
                    Acesse ferramentas, planejamentos e materiais num só lugar —
                    como o seu hub profissional.
                  </p>
                  <div className="mt-4">
                    <PlanifyHubStatsRow />
                  </div>
                </div>
              </div>
              <form
                onSubmit={handleBuildLesson}
                className="w-full shrink-0 sm:max-w-xs"
              >
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Tema da aula
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex.: Frações, Biomas…"
                  className="mt-1.5 w-full rounded-xl border border-cyan-400/20 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
                <button
                  type="submit"
                  className="pl-hud-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                >
                  <PlanifyIcon name="layers" className="h-3.5 w-3.5" />
                  Montar aula completa
                </button>
              </form>
            </div>
          </section>

          {/* Workspace apps bento */}
          <section className="mt-5">
            <h2 className="text-sm font-extrabold text-slate-950">
              Seus espaços
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Navegue como num app — tudo a um toque
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => openTool("slides")}
                className="pl-hud-glass group flex flex-col rounded-2xl p-4 text-left transition hover:border-cyan-400/40 hover:shadow-[0_0_24px_rgba(0,212,255,0.12)] sm:col-span-2 lg:col-span-1 lg:row-span-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                  <PlanifyIcon name="materials" className="h-5 w-5" />
                </span>
                <span className="mt-4 text-lg font-extrabold text-slate-950">
                  Materiais com IA
                </span>
                <span className="mt-1 text-sm font-medium text-slate-600">
                  {planifyToolCount} geradores alinhados à BNCC — slides, provas,
                  jogos e mais.
                </span>
                <span className="mt-auto pt-4 text-xs font-semibold text-cyan-700 group-hover:underline">
                  Explorar ferramentas →
                </span>
              </button>

              {workspaceApps.map((app) => (
                <button
                  key={app.section}
                  type="button"
                  onClick={() => openSection(app.section)}
                  className="pl-hud-glass group flex flex-col rounded-2xl p-4 text-left transition hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={app.icon} className="h-5 w-5" />
                  </span>
                  <span className="mt-3 text-sm font-extrabold text-slate-950">
                    {app.title}
                  </span>
                  <span className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {app.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent activity */}
          <div className="mt-5">
            <PlanifyHubRecentStrip
              onOpenHistorico={() => openSection("historico")}
            />
          </div>

          {/* Quick planejamento */}
          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openPlanejamento("anual")}
              className="pl-hud-glass flex items-center gap-3 rounded-2xl p-4 text-left transition hover:border-cyan-400/35"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <PlanifyIcon name="clipboard" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-950">
                  Planejamento Anual
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Matriz BNCC · DOCX oficial
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => openPlanejamento("trimestral")}
              className="pl-hud-glass flex items-center gap-3 rounded-2xl p-4 text-left transition hover:border-cyan-400/35"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <PlanifyIcon name="calendar" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-950">
                  Planejamento Trimestral
                </span>
                <span className="text-xs font-medium text-slate-500">
                  1º, 2º ou 3º trimestre
                </span>
              </span>
            </button>
          </section>

          {/* Tool apps grid */}
          <section className="mt-5 pl-hud-glass rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-950">
                  Ferramentas · apps
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Escolha um gerador e comece em segundos
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
                  className="w-full rounded-xl border border-cyan-400/15 bg-white/80 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {!toolSearch.trim() ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {quickTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => openTool(tool.id)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-50/60 px-3 py-1.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50"
                  >
                    <PlanifyIcon name={tool.icon} className="h-3.5 w-3.5" />
                    {tool.shortTitle}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {toolCategories.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-cyan-400/40 bg-cyan-600 text-white shadow-sm"
                        : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-cyan-300"
                    }`}
                  >
                    <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => openTool(tool.id)}
                  className="flex flex-col items-center rounded-xl border border-cyan-400/10 bg-white/70 p-3 text-center transition hover:border-cyan-400/30 hover:shadow-[0_0_12px_rgba(0,212,255,0.08)]"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                  </span>
                  <span className="mt-2 line-clamp-2 text-[11px] font-bold leading-snug text-slate-900">
                    {tool.shortTitle}
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

          {/* Pacote rápido por contexto */}
          {topic.trim() ? (
            <section className="mt-5 pl-hud-glass rounded-2xl p-4 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">
                Sugestões para &ldquo;{topic.trim()}&rdquo;
              </p>
              <div className="mt-3 space-y-3">
                {bundleByTag().slice(0, 2).map(([tag, items]) => (
                  <div key={tag}>
                    <p className="mb-1.5 text-[10px] font-bold uppercase text-slate-400">
                      {tag}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openTool(item.id)}
                          className="rounded-lg border border-cyan-400/15 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400/30"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-cyan-400/10 pt-3">
                <TeachyToolToolbar onApplyHint={applyHintFromHome} />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
