"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LumiMascot } from "@/components/pro/LumiMascot";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyTools, toolCategories } from "@/lib/pro/planifyTools";

type CreateCard = {
  title: string;
  description: string;
  href: string;
  icon: PlanifyIconName;
  accent: string;
  charm: string;
  featured?: boolean;
};

const createNow: CreateCard[] = [
  {
    title: "Planejamento",
    description: "BNCC + IA + DOCX",
    href: "/planejamentos",
    icon: "clipboard",
    accent: "from-emerald-300 via-teal-300 to-cyan-300",
    charm: "📋",
    featured: true,
  },
  {
    title: "Material IA",
    description: "Apostila, resumo, atividade",
    href: "/materiais",
    icon: "materials",
    accent: "from-violet-300 via-fuchsia-300 to-pink-300",
    charm: "✨",
    featured: true,
  },
  {
    title: "Prova",
    description: "Objetiva + gabarito",
    href: "/materiais?tipo=prova",
    icon: "fileText",
    accent: "from-sky-300 via-blue-300 to-indigo-300",
    charm: "🎯",
  },
  {
    title: "Slides",
    description: "Aula visual + roteiro",
    href: "/materiais?tipo=slides",
    icon: "presentation",
    accent: "from-fuchsia-300 via-purple-300 to-violet-400",
    charm: "🎀",
  },
  {
    title: "Jogo",
    description: "Quiz, trilha, memória",
    href: "/materiais?tipo=jogo",
    icon: "puzzle",
    accent: "from-rose-300 via-pink-300 to-fuchsia-400",
    charm: "🎲",
  },
  {
    title: "Editor",
    description: "Finalize e exporte",
    href: "/editor",
    icon: "editor",
    accent: "from-amber-200 via-orange-200 to-rose-200",
    charm: "💫",
  },
];

const quickAccess: {
  title: string;
  href: string;
  icon: PlanifyIconName;
  accent: string;
  charm: string;
}[] = [
  {
    title: "Biblioteca",
    href: "/biblioteca",
    icon: "library",
    accent: "from-sky-300 to-indigo-400",
    charm: "📚",
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: "market",
    accent: "from-fuchsia-300 to-rose-400",
    charm: "🛍️",
  },
  {
    title: "Histórico",
    href: "/historico",
    icon: "history",
    accent: "from-violet-300 to-purple-400",
    charm: "🕯️",
  },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

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

    return base.slice(0, 8);
  }, [query]);

  const categoryChips = toolCategories.filter((c) => c.id !== "todos");

  return (
    <div className="planify-ui3 pl-dash-root flex h-full min-h-0 w-full flex-col overflow-hidden">
      {/* Hero — fixo no topo do quadrante */}
      <div className="relative shrink-0 overflow-hidden border-b border-rose-100/60 px-4 py-4 sm:px-6 sm:py-5">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-fuchsia-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-violet-200/50 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="pl-lumi-aura hidden shrink-0 sm:block">
              <LumiMascot size={64} animated withAura priority />
            </div>
            <div className="min-w-0">
              <span className="pl-badge-indigo pl-badge-coral">
                <PlanifyIcon name="spark" className="h-3 w-3" />
                Studio Planify
              </span>
              <h1 className="mt-2 text-xl font-black tracking-tight text-violet-950 sm:text-[1.65rem] sm:leading-tight">
                {greeting()}, professora —{" "}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-400 bg-clip-text text-transparent">
                  o que criamos hoje?
                </span>
              </h1>
              <p className="mt-1.5 max-w-xl text-sm font-semibold leading-relaxed text-violet-500/95">
                Materiais com IA, planejamentos BNCC e ferramentas que encantam
                sua turma — tudo num painel só seu.
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-56">
              <PlanifyIcon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fuchsia-300"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar ferramenta..."
                aria-label="Buscar ferramentas"
                className="w-full rounded-2xl border border-rose-100/90 bg-white/95 py-2.5 pl-9 pr-3 text-sm font-semibold text-violet-950 shadow-sm outline-none transition focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100/80"
              />
            </div>
            <Link
              href="/materiais"
              className="pl-btn-primary shrink-0 rounded-2xl py-2.5 shadow-[0_8px_24px_-8px_rgba(236,72,153,0.5)]"
            >
              <PlanifyIcon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">Criar</span>
            </Link>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {categoryChips.map((cat) => (
            <Link
              key={cat.id}
              href="/materiais"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-1 text-[11px] font-black text-violet-700 shadow-sm backdrop-blur-sm transition hover:border-fuchsia-200 hover:bg-white hover:shadow-md"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-violet-100 to-rose-100 text-violet-600"
              >
                <PlanifyIcon name={cat.icon} className="h-3 w-3" />
              </span>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Conteúdo — scroll interno apenas neste quadrante */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <div className="pl-dash-bento grid gap-3 sm:gap-4">
          {/* Destaque principal + atalhos */}
          <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <section className="relative overflow-hidden rounded-[1.85rem] border border-fuchsia-100/70 bg-gradient-to-br from-white via-rose-50/50 to-violet-50/60 p-4 shadow-[0_12px_40px_-20px_rgba(192,38,211,0.25)] sm:p-5">
              <div
                className="pointer-events-none absolute right-4 top-4 text-4xl opacity-20"
                aria-hidden
              >
                🌸
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-600">
                ✦ Criar agora
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-400">
                Toque e comece em segundos — Lumi cuida do resto
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {createNow.map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/95 bg-white/85 p-3 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-[0_16px_32px_-14px_rgba(167,139,250,0.4)] ${
                      card.featured
                        ? "sm:col-span-1 ring-2 ring-fuchsia-100/80"
                        : ""
                    }`}
                  >
                    <span
                      className="absolute right-2 top-2 text-base opacity-70 transition group-hover:scale-110"
                      aria-hidden
                    >
                      {card.charm}
                    </span>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-md ring-2 ring-white transition group-hover:scale-110`}
                    >
                      <PlanifyIcon name={card.icon} className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-sm font-black leading-tight text-violet-950">
                      {card.title}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-violet-400">
                      {card.description}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="flex flex-col rounded-[1.85rem] border border-violet-100/80 bg-gradient-to-b from-white via-violet-50/30 to-rose-50/50 p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-black text-violet-950">
                Acesso rápido
              </h2>
              <p className="text-xs font-semibold text-violet-400">
                Biblioteca, marketplace e histórico
              </p>

              <div className="mt-3 flex flex-1 flex-col gap-2">
                {quickAccess.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/90 bg-white/75 px-3 py-2.5 transition hover:border-fuchsia-200 hover:bg-white hover:shadow-lg"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-sm ring-2 ring-white`}
                    >
                      <PlanifyIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-black text-violet-950">
                      {item.title}
                    </span>
                    <span className="text-sm opacity-60" aria-hidden>
                      {item.charm}
                    </span>
                    <PlanifyIcon
                      name="arrowRight"
                      className="h-4 w-4 shrink-0 text-fuchsia-300 transition group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>

              <Link
                href="/planejamentos"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-400 px-4 py-3.5 text-sm font-black text-white shadow-[0_12px_32px_-12px_rgba(192,38,211,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(192,38,211,0.6)]"
              >
                <PlanifyIcon name="clipboard" className="h-4 w-4" />
                Planejamento oficial BNCC
              </Link>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-rose-100/60 bg-white/60 p-2.5">
                {[
                  { label: "Ferramentas", value: "13+", emoji: "🪄" },
                  { label: "BNCC", value: "Sim", emoji: "🌷" },
                  { label: "IA + DOCX", value: "Pronto", emoji: "💖" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-lg leading-none" aria-hidden>
                      {stat.emoji}
                    </p>
                    <p className="mt-1 text-xs font-black text-violet-950">
                      {stat.value}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-violet-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Ferramentas em destaque */}
          <section className="rounded-[1.85rem] border border-violet-100/70 bg-white/92 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-violet-950">
                  Ferramentas em destaque
                </h2>
                <p className="text-xs font-semibold text-violet-400">
                  {query.trim()
                    ? `Resultados para “${query.trim()}”`
                    : "As favoritas das professoras ✨"}
                </p>
              </div>
              <Link
                href="/materiais"
                className="rounded-xl border border-fuchsia-100 bg-gradient-to-r from-rose-50 to-violet-50 px-3 py-1.5 text-xs font-black text-fuchsia-700 transition hover:border-fuchsia-200 hover:shadow-sm"
              >
                Ver catálogo completo
              </Link>
            </div>

            {recommended.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {recommended.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group relative overflow-hidden rounded-2xl border border-violet-50/90 bg-gradient-to-br from-violet-50/40 via-white to-rose-50/50 p-3 transition hover:border-fuchsia-200 hover:bg-white hover:shadow-[0_14px_28px_-12px_rgba(139,92,246,0.35)]"
                  >
                    {tool.popular ? (
                      <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-700">
                        ✦ top
                      </span>
                    ) : null}
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-md ring-2 ring-white transition group-hover:scale-110`}
                    >
                      <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                    </span>
                    <p className="mt-2.5 text-sm font-black text-violet-950">
                      {tool.shortTitle}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-violet-400">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="pl-empty mt-4 rounded-2xl border border-dashed border-fuchsia-200 bg-rose-50/40 py-10">
                <LumiMascot size={72} withAura />
                <p className="pl-empty-title">Nada por aqui ainda</p>
                <p className="pl-empty-desc">
                  Tente outra busca ou explore o catálogo completo na barra
                  lateral.
                </p>
                <Link href="/materiais" className="pl-btn-primary mt-2">
                  Ver ferramentas
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
