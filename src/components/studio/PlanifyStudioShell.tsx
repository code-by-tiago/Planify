"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyTools } from "@/lib/pro/planifyTools";

type CreateCard = {
  title: string;
  description: string;
  href: string;
  icon: PlanifyIconName;
  tone: string;
};

const createNow: CreateCard[] = [
  {
    title: "Planejamento oficial",
    description: "Anual, trimestral e por unidade, alinhado à BNCC.",
    href: "/planejamentos",
    icon: "clipboard",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Material didático",
    description: "Apostilas, resumos, atividades e listas.",
    href: "/materiais",
    icon: "materials",
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    title: "Prova",
    description: "Questões objetivas e discursivas com gabarito.",
    href: "/materiais?tipo=prova",
    icon: "fileText",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Slides",
    description: "Aula em slides com roteiro do professor.",
    href: "/materiais?tipo=slides",
    icon: "presentation",
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Jogo pedagógico",
    description: "Quiz, caça-palavras, cruzadinha e trilha.",
    href: "/materiais?tipo=jogo",
    icon: "puzzle",
    tone: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    title: "Editor",
    description: "Edite e finalize materiais já gerados.",
    href: "/editor",
    icon: "editor",
    tone: "bg-slate-100 text-slate-700",
  },
];

const quickAccess: { title: string; href: string; icon: PlanifyIconName }[] = [
  { title: "Biblioteca", href: "/biblioteca", icon: "library" },
  { title: "Marketplace", href: "/marketplace", icon: "market" },
  { title: "Histórico", href: "/historico", icon: "history" },
];

export default function PlanifyStudioShell() {
  const [query, setQuery] = useState("");

  const recommended = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? planifyTools.filter(
          (tool) =>
            tool.title.toLowerCase().includes(term) ||
            tool.description.toLowerCase().includes(term) ||
            tool.shortTitle.toLowerCase().includes(term),
        )
      : planifyTools.filter((tool) => tool.popular);

    return base.slice(0, 6);
  }, [query]);

  return (
    <div className="planify-ui3 mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Page header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Planify Studio
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Central de criação pedagógica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex"
          >
            <PlanifyIcon name="search" className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ferramentas..."
              aria-label="Buscar ferramentas"
              className="w-40 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 lg:w-52"
            />
          </form>
          <Link
            href="/materiais"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.6)]"
          >
            <PlanifyIcon name="plus" className="h-4 w-4" />
            Criar agora
          </Link>
        </div>
      </div>
        {/* Criar agora */}
        <section className="pl-section-hero planify-ui3 overflow-hidden rounded-[2rem] border border-indigo-100/60 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="pl-badge-indigo planify-ui3">
                <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                Criar agora
              </span>
              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                Comece um novo material em um clique.
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {createNow.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-[1.4rem] border border-white/80 bg-white p-4 shadow-[0_2px_8px_-4px_rgba(79,70,229,0.12)] transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_16px_36px_-14px_rgba(99,102,241,0.28)]"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone} transition group-hover:scale-110`}
                >
                  <PlanifyIcon name={card.icon} className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-black leading-tight text-slate-950">
                  {card.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recomendados + Acesso rápido */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Ferramentas recomendadas
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  {query.trim()
                    ? `Resultados para "${query.trim()}"`
                    : "Atalhos compactos para a criação diária."}
                </p>
              </div>
              <Link
                href="/materiais"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
              >
                Ver todas
              </Link>
            </div>

            {recommended.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recommended.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group rounded-[1.4rem] border border-indigo-50 bg-slate-50/80 p-4 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-[0_14px_32px_-12px_rgba(99,102,241,0.22)]"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition group-hover:scale-110`}>
                      <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-black leading-tight text-slate-950">
                      {tool.shortTitle}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-bold text-slate-600">
                  Nenhuma ferramenta encontrada para a busca.
                </p>
                <Link
                  href="/materiais"
                  className="mt-3 inline-flex text-sm font-black text-indigo-700 transition hover:text-indigo-900"
                >
                  Ver todas as ferramentas
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Acesso rápido
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Biblioteca, marketplace e histórico.
            </p>

            <div className="mt-4 grid gap-3">
              {quickAccess.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white hover:shadow-lg"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <PlanifyIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-black text-slate-950">
                      {item.title}
                    </span>
                  </span>
                  <PlanifyIcon name="arrowRight" className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>

            <Link
              href="/planejamentos"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-500 px-4 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_-10px_rgba(99,102,241,0.55)] transition hover:-translate-y-0.5"
            >
              <PlanifyIcon name="clipboard" className="h-4 w-4" />
              Planejamento oficial
            </Link>
          </div>
        </section>
    </div>
  );
}
