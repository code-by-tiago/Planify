"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LumiMascot } from "@/components/pro/LumiMascot";
import {
  lessonBundleTools,
  teachyFeaturedToolIds,
  teachyWorkflowSteps,
} from "@/lib/pro/teachyStudio";
import {
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  category: ToolCategoryId;
  onCategoryChange: (category: ToolCategoryId) => void;
  initialTopic?: string;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const quickStarts: {
  id: PlanifyToolId;
  label: string;
  icon: (typeof planifyTools)[number]["icon"];
}[] = [
  { id: "slides", label: "Slides", icon: "presentation" },
  { id: "plano-aula", label: "Plano de aula", icon: "clipboard" },
  { id: "prova", label: "Prova / quiz", icon: "fileText" },
  { id: "lista", label: "Lista", icon: "listChecks" },
];

export default function TeachyStudioHome({
  onSelectTool,
  category,
  onCategoryChange,
  initialTopic = "",
}: TeachyStudioHomeProps) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [gridQuery, setGridQuery] = useState("");
  const [showFullCatalog, setShowFullCatalog] = useState(false);

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const filteredTools = useMemo(() => {
    const term = gridQuery.trim().toLowerCase();
    return planifyTools.filter((tool) => {
      const matchCat = category === "todos" || tool.category === category;
      const matchTerm =
        !term ||
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }, [category, gridQuery]);

  const featured = useMemo(
    () =>
      teachyFeaturedToolIds
        .map((id) => planifyTools.find((t) => t.id === id))
        .filter((tool): tool is (typeof planifyTools)[number] => Boolean(tool)),
    [],
  );

  const displayTools = useMemo(() => {
    if (gridQuery.trim() || category !== "todos" || showFullCatalog) {
      return filteredTools;
    }
    return featured;
  }, [category, featured, filteredTools, gridQuery, showFullCatalog]);

  function handleLessonSubmit(event: FormEvent) {
    event.preventDefault();
    const tema = topic.trim();
    if (!tema) return;
    router.push(`/planejamentos?${new URLSearchParams({ tema }).toString()}`);
  }

  function openToolFromTopic(toolId: PlanifyToolId) {
    const tema = topic.trim();
    if (tema) {
      try {
        sessionStorage.setItem("planify-studio-tema", tema);
      } catch {
        /* ignore */
      }
    }
    onSelectTool(toolId);
  }

  return (
    <div className="pl-teachy-home pl-teachy-home-v2 flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Assistente central — ocupa a viewport visível */}
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(79,70,229,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(56,189,248,0.08),transparent_50%)]"
          aria-hidden
        />

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8">
          <div className="mb-5 flex items-center gap-3">
            <LumiMascot size={56} animated withAura />
            <div>
              <p className="text-sm font-black text-indigo-600">
                {greeting()}, professora
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Assistente IA · BNCC · Planify Studio
              </p>
            </div>
          </div>

          <h1 className="max-w-2xl text-center text-2xl font-black tracking-tight text-slate-950 sm:text-4xl sm:leading-tight">
            Qual o tema da sua{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              próxima aula?
            </span>
          </h1>
          <p className="mt-3 max-w-lg text-center text-sm font-semibold leading-relaxed text-slate-500">
            Descreva o assunto uma vez. O Planify monta plano, slides, atividades
            e avaliação no mesmo tema — como no Teachy.
          </p>

          <form
            onSubmit={handleLessonSubmit}
            className="pl-teachy-prompt mt-8 w-full max-w-2xl"
          >
            <div className="rounded-[1.75rem] border border-slate-200/90 bg-white p-2 shadow-[0_24px_80px_-32px_rgba(79,70,229,0.35)] ring-1 ring-indigo-100/80">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="Ex.: Ciclo da água no 4º ano, Revolução Industrial no EM, Frações com situações do cotidiano…"
                className="w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-3 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <div className="flex flex-col gap-2 border-t border-slate-100 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {quickStarts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openToolFromTopic(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <PlanifyIcon name={item.icon} className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_32px_-12px_rgba(79,70,229,0.65)] transition hover:bg-indigo-700"
                >
                  <PlanifyIcon name="layers" className="h-4 w-4" />
                  Montar aula completa
                </button>
              </div>
            </div>
          </form>

          {topic.trim() ? (
            <div className="mt-6 w-full max-w-2xl rounded-2xl border border-indigo-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-center text-xs font-black uppercase tracking-wide text-indigo-700">
                Pacote sugerido · {topic.trim()}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {lessonBundleTools.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openToolFromTopic(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
                  >
                    <PlanifyIcon
                      name={item.icon}
                      className="h-4 w-4 text-indigo-500"
                    />
                    {item.label}
                    <span className="font-semibold text-slate-400">
                      · {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Ferramentas — painel inferior deslizante */}
      <section className="shrink-0 border-t border-slate-200/90 bg-white shadow-[0_-8px_40px_-24px_rgba(15,23,42,0.12)]">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">
                Ferramentas com IA
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                13+ formatos · clique e gere no painel ao lado
              </p>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <PlanifyIcon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
              />
              <input
                value={gridQuery}
                onChange={(e) => setGridQuery(e.target.value)}
                placeholder="Filtrar ferramentas…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-indigo-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {toolCategories.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition ${
                    active
                      ? "border-indigo-200 bg-indigo-600 text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200"
                  }`}
                >
                  <PlanifyIcon name={cat.icon} className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 max-h-[220px] overflow-y-auto overscroll-contain pr-1">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {displayTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => openToolFromTopic(tool.id)}
                  className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-center transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-105`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                  </span>
                  <span className="mt-2 line-clamp-2 text-[10px] font-black leading-tight text-slate-800">
                    {tool.shortTitle}
                  </span>
                </button>
              ))}
            </div>

            {displayTools.length === 0 ? (
              <p className="py-6 text-center text-sm font-semibold text-slate-400">
                Nenhuma ferramenta encontrada.
              </p>
            ) : null}

            {!gridQuery.trim() && category === "todos" && !showFullCatalog ? (
              <button
                type="button"
                onClick={() => setShowFullCatalog(true)}
                className="mt-3 w-full rounded-xl border border-dashed border-indigo-200 py-2.5 text-xs font-black text-indigo-600 transition hover:bg-indigo-50"
              >
                Ver catálogo completo ({planifyTools.length} ferramentas)
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Atalhos + fluxo — compacto */}
      <section className="shrink-0 border-t border-slate-100 bg-[#eef1f8] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { title: "Planejamentos", href: "/planejamentos", icon: "clipboard" as const },
              { title: "Biblioteca", href: "/biblioteca", icon: "library" as const },
              { title: "Marketplace", href: "/marketplace", icon: "market" as const },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-indigo-200"
              >
                <PlanifyIcon name={card.icon} className="h-4 w-4 text-indigo-500" />
                {card.title}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            {teachyWorkflowSteps.map((step) => (
              <span
                key={step.step}
                className="text-[10px] font-bold text-slate-500"
              >
                <span className="mr-1 font-black text-indigo-600">
                  {step.step}.
                </span>
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
