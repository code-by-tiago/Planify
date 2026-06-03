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

export default function TeachyStudioHome({
  onSelectTool,
  category,
  onCategoryChange,
  initialTopic = "",
}: TeachyStudioHomeProps) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [gridQuery, setGridQuery] = useState("");

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
        .filter(Boolean),
    [],
  );

  function handleLessonSubmit(event: FormEvent) {
    event.preventDefault();
    const tema = topic.trim();
    if (!tema) return;
    const params = new URLSearchParams({ tema });
    router.push(`/planejamentos?${params.toString()}`);
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
    <div className="pl-teachy-home flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f6fb]">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          {/* Hero — Assistente IA (estilo Teachy) */}
          <section className="pl-teachy-hero rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_40px_-24px_rgba(15,23,42,0.12)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-700">
                  <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                  Assistente IA · BNCC
                </span>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-[1.85rem] sm:leading-tight">
                  Sua aula inteira pronta em poucos cliques
                </h1>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  Escreva o assunto, escolha a série no planejamento e receba
                  materiais coesos — plano, slides, atividades e avaliação no
                  mesmo tema.
                </p>
              </div>
              <div className="hidden sm:block">
                <LumiMascot size={72} animated withAura />
              </div>
            </div>

            <form onSubmit={handleLessonSubmit} className="mt-5">
              <label className="block text-xs font-black uppercase tracking-wide text-slate-500">
                Tema da aula
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex.: Ciclo da água, Revolução Industrial, Frações…"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.55)] transition hover:bg-indigo-700"
                >
                  <PlanifyIcon name="layers" className="h-4 w-4" />
                  Construtor de aula
                </button>
              </div>
            </form>

            {topic.trim() ? (
              <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4">
                <p className="text-xs font-black text-indigo-800">
                  Pacote sugerido para “{topic.trim()}”
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lessonBundleTools.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openToolFromTopic(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/90 px-3 py-2 text-left text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                    >
                      <PlanifyIcon
                        name={item.icon}
                        className="h-4 w-4 text-indigo-500"
                      />
                      <span>
                        {item.label}
                        <span className="ml-1.5 font-semibold text-slate-400">
                          · {item.tag}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Fluxo Teachy: planejar → aula → exportar → corrigir */}
          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teachyWorkflowSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
                  {item.step}
                </span>
                <p className="mt-3 text-sm font-black text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </section>

          {/* Destaques */}
          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Ferramentas em destaque
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Mais de 13 formatos alinhados à prática em sala
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {featured.map((tool) =>
                tool ? (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => openToolFromTopic(tool.id)}
                    className="group flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-105`}
                    >
                      <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-2 line-clamp-2 text-[11px] font-black leading-tight text-slate-800">
                      {tool.shortTitle}
                    </span>
                  </button>
                ) : null,
              )}
            </div>
          </section>

          {/* Catálogo completo */}
          <section className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Todas as ferramentas
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Gere materiais personalizados — sem prompt complexo
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
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

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
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
                  onClick={() => openToolFromTopic(tool.id)}
                  className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                  </span>
                  <p className="mt-2.5 text-sm font-black text-slate-900">
                    {tool.shortTitle}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>

            {filteredTools.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                Nenhuma ferramenta nesta categoria.
              </p>
            ) : null}
          </section>

          {/* Biblioteca / comunidade */}
          <section className="mt-5 mb-2 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Planejamentos BNCC",
                href: "/planejamentos",
                icon: "clipboard" as const,
                desc: "DOCX oficial + IA",
              },
              {
                title: "Biblioteca",
                href: "/biblioteca",
                icon: "library" as const,
                desc: "Materiais salvos",
              },
              {
                title: "Marketplace",
                href: "/marketplace",
                icon: "market" as const,
                desc: "Recursos da comunidade",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <PlanifyIcon name={card.icon} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-900">
                    {card.title}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {card.desc}
                  </span>
                </span>
                <PlanifyIcon
                  name="arrowRight"
                  className="ml-auto h-4 w-4 text-slate-300"
                />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
