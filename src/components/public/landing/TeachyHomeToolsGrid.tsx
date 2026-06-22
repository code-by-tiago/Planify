import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { activePlanifyTools } from "@/lib/pro/planifyTools";
import {
  landingExtraTools,
  landingGeneratorCount,
  landingPlanejamentoTools,
} from "@/lib/pro/teachyLanding";

const featuredToolIds = ["plano-aula", "prova", "lista", "correcao-ia"] as const;

export function TeachyHomeToolsGrid() {
  const featuredTools = activePlanifyTools.filter((tool) =>
    featuredToolIds.includes(tool.id as (typeof featuredToolIds)[number]),
  );
  const otherTools = activePlanifyTools.filter(
    (tool) => !featuredToolIds.includes(tool.id as (typeof featuredToolIds)[number]),
  );

  return (
    <section
      id="ferramentas"
      className="pl-hud-landing-tools relative isolate z-[1] scroll-mt-28 overflow-hidden py-16 sm:py-24"
    >
      <div className="pl-hud-landing-tools-glow pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
            Ferramentas com IA
          </p>
          <h2 className="pl-display mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
            {landingGeneratorCount} geradores + planejamentos BNCC
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
            Do planejamento BNCC à correção de redações — descreva o contexto da turma,
            gere o rascunho e revise no editor antes de exportar ou publicar.
          </p>
        </div>

        <div className="mt-12">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
            Destaques
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="pl-hud-landing-tool-featured group flex flex-col rounded-2xl p-5 transition motion-safe:hover:-translate-y-0.5"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition motion-safe:group-hover:scale-105`}
                >
                  <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                </span>
                <span className="mt-4 text-base font-extrabold text-slate-950">
                  {tool.shortTitle}
                </span>
                <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
                  {tool.description}
                </span>
                <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
                  Abrir
                  <PlanifyIcon name="arrowRight" className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Planejamentos, banco de questões e geradores
          </p>
          <div className="planify-landing-tools-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {landingExtraTools
              .filter((tool) => tool.id !== "planejamentos")
              .map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="pl-hud-glass group flex flex-col items-center rounded-2xl p-4 text-center transition hover:border-cyan-400/40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
                  title={tool.description}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition max-lg:group-hover:scale-100 motion-safe:group-hover:scale-105`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                  </span>
                  <span className="mt-3 line-clamp-2 text-xs font-black leading-snug text-slate-900">
                    {tool.shortTitle}
                  </span>
                </Link>
              ))}
            {landingPlanejamentoTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="pl-hud-glass group flex flex-col items-center rounded-2xl p-4 text-center transition hover:border-cyan-400/40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition max-lg:group-hover:scale-100 motion-safe:group-hover:scale-105`}
                >
                  <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                </span>
                <span className="mt-3 line-clamp-2 text-xs font-black leading-snug text-slate-900">
                  {tool.shortTitle}
                </span>
              </Link>
            ))}
            {otherTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="pl-hud-glass group flex flex-col items-center rounded-2xl p-4 text-center transition hover:border-cyan-400/40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-sm transition max-lg:group-hover:scale-100 motion-safe:group-hover:scale-105`}
                >
                  <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                </span>
                <span className="mt-3 line-clamp-2 text-xs font-black leading-snug text-slate-900">
                  {tool.shortTitle}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/planos"
            className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold"
          >
            Ver planos e começar
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
