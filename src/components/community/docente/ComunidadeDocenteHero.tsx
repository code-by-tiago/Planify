"use client";

import { IconArrowRight, IconSearch } from "@/components/community/docente/docente-icons";

type ComunidadeDocenteHeroProps = {
  heroSearch: string;
  onHeroSearchChange: (value: string) => void;
  onHeroSearch: () => void;
};

export function ComunidadeDocenteHero({
  heroSearch,
  onHeroSearchChange,
  onHeroSearch,
}: ComunidadeDocenteHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 450'%3E%3Cpath fill='%2306B6D4' d='M80 120c40-30 90-20 120 10s30 80-10 110-90 20-120-10-30-80 10-110zm180 80c50-20 100 0 120 40s0 90-50 110-100 0-120-40 0-90 50-110zm-60 160c30-40 80-30 100 10s-10 80-50 90-80-10-100-50 20-60 50-50z'/%3E%3C/svg%3E")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="pointer-events-none absolute -right-4 top-4 hidden h-32 w-32 opacity-20 lg:block" aria-hidden>
        <svg viewBox="0 0 200 220" className="h-full w-full text-cyan-400">
          <circle cx="30" cy="40" r="4" fill="currentColor" />
          <circle cx="80" cy="60" r="4" fill="currentColor" />
          <circle cx="120" cy="30" r="4" fill="currentColor" />
          <circle cx="160" cy="80" r="4" fill="currentColor" />
          <circle cx="100" cy="120" r="4" fill="currentColor" />
          <circle cx="50" cy="150" r="4" fill="currentColor" />
          <circle cx="140" cy="170" r="4" fill="currentColor" />
          <line x1="30" y1="40" x2="80" y2="60" stroke="currentColor" strokeWidth="1" />
          <line x1="80" y1="60" x2="120" y2="30" stroke="currentColor" strokeWidth="1" />
          <line x1="120" y1="30" x2="160" y2="80" stroke="currentColor" strokeWidth="1" />
          <line x1="80" y1="60" x2="100" y2="120" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="120" x2="50" y2="150" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="120" x2="140" y2="170" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_280px] lg:items-center lg:gap-6">
        <div>
          <p className="text-lg" aria-hidden>
            👋
          </p>
          <h1 className="mt-1.5 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            Bem-vindo(a) à Comunidade Docente Planify!
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-snug text-slate-500">
            Conecte-se com professores de todo o Brasil, compartilhe materiais, troque
            experiências e transforme a educação juntos.
          </p>

          <form
            className="mt-5 flex max-w-lg gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onHeroSearch();
            }}
          >
            <div className="relative min-w-0 flex-1">
              <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={heroSearch}
                onChange={(e) => onHeroSearchChange(e.target.value)}
                placeholder="O que você quer encontrar hoje?"
                className="h-12 w-full rounded-2xl border border-white bg-white/90 pl-10 pr-4 text-sm font-semibold text-[#0F172A] shadow-sm outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0F172A] text-white transition hover:bg-slate-800"
              aria-label="Buscar"
            >
              <IconArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="relative hidden overflow-hidden rounded-2xl shadow-lg lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=560&h=360&fit=crop"
            alt="Professores colaborando"
            className="h-[220px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
