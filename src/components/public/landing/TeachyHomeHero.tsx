import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyHudHeroVisual } from "@/components/public/landing/PlanifyHudHeroVisual";

export function TeachyHomeHero() {
  return (
    <section className="pl-hud-hero relative isolate overflow-hidden pt-8 sm:pt-12 lg:pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:pb-20">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 backdrop-blur-sm">
            EdTech HUD · BNCC
          </p>
          <h1 className="pl-hud-display mt-5 text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem]">
            Assistente de IA para{" "}
            <span className="pl-hud-gradient-text">professores.</span>
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-slate-600">
            Crie slides, aulas completas, provas e materiais alinhados à BNCC —
            com exportação em DOCX, Google Slides e publicação no Classroom.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planos"
              className="pl-hud-btn rounded-xl px-8 py-4 text-base font-semibold"
            >
              Ver planos
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="pl-hud-btn-secondary rounded-xl px-8 py-4 text-base font-semibold"
            >
              Entrar
            </Link>
          </div>
        </div>

        <PlanifyHudHeroVisual />
      </div>
    </section>
  );
}
