import Link from "next/link";
import { LandingHeroMockCard } from "./LandingHeroMockCard";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="relative scroll-mt-24 overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">
            Plataforma nº1 em planejamento com IA
          </span>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            Menos horas planejando.{" "}
            <span className="text-emerald-600">Mais qualidade ensinando.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
            O Planify transforma suas ideias em planejamentos, provas, slides e materiais
            pedagógicos alinhados à BNCC — com IA que entende o contexto da sala de aula.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/planos"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              Começar com plano mensal
            </Link>
            <Link
              href="/#recursos"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              Conhecer recursos
            </Link>
          </div>
        </div>

        <LandingHeroMockCard />
      </div>
    </section>
  );
}
