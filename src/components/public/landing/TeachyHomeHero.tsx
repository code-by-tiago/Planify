import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyHudHeroVisual } from "@/components/public/landing/PlanifyHudHeroVisual";
import {
  landingGeneratorCount,
  teachyPartnerLabels,
} from "@/lib/pro/teachyLanding";

const heroStats = [
  { value: `${landingGeneratorCount}+`, label: "Geradores IA" },
  { value: "BNCC", label: "Alinhamento curricular" },
  { value: "DOCX", label: "Modelo oficial" },
  { value: "Classroom", label: "Publicação direta" },
] as const;

export function TeachyHomeHero() {
  return (
    <section className="pl-hud-hero pl-hud-landing-hero relative isolate overflow-hidden pt-8 sm:pt-12 lg:pt-16">
      <div className="pl-hud-landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="pl-hud-landing-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:pb-16">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pl-hud-badge">
              <PlanifyIcon name="spark" className="h-3 w-3" />
              Líder em IA pedagógica
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700 backdrop-blur-sm">
              BNCC · Google Classroom
            </span>
          </div>

          <h1 className="pl-hud-display mt-5 text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.35rem]">
            A plataforma de IA{" "}
            <span className="pl-hud-gradient-text">nº 1 para professores.</span>
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-slate-600 sm:text-xl sm:leading-9">
            Crie slides, aulas completas, provas e planejamentos alinhados à BNCC —
            com exportação em DOCX, Google Slides e publicação no Classroom em minutos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planos"
              className="pl-hud-btn rounded-xl px-8 py-4 text-base font-semibold"
            >
              Começar agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/#ferramentas"
              className="pl-hud-btn-secondary rounded-xl px-8 py-4 text-base font-semibold"
            >
              Ver ferramentas
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-slate-600 transition hover:text-cyan-700"
            >
              Entrar
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="pl-hud-landing-stats mt-10">
            {heroStats.map((stat) => (
              <div key={stat.label} className="pl-hud-landing-stat">
                <span className="pl-hud-landing-stat-value">{stat.value}</span>
                <span className="pl-hud-landing-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <PlanifyHudHeroVisual />
      </div>

      <div className="relative border-y border-cyan-400/12 bg-white/60 backdrop-blur-sm">
        <div className="pl-hud-landing-trust mx-auto max-w-7xl px-5 py-4 sm:px-8">
          {teachyPartnerLabels.map((label) => (
            <span key={label} className="pl-hud-landing-trust-item">
              <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
