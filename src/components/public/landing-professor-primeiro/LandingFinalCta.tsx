import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnPrimary } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 px-6 py-12 text-center shadow-2xl sm:px-12 sm:py-14">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white sm:text-4xl">
          Pronto para transformar seu planejamento?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-slate-300">
          Escolha um plano, descreva o tema da aula e revise cada material antes de levar para
          a turma — com BNCC, editor e exportação Google no mesmo fluxo.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/planos" className={`${ppBtnPrimary} px-8`}>
            Ver planos
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Já tenho conta
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FINAL_BENEFITS.map((benefit) => (
            <li
              key={benefit.label}
              className="flex items-center gap-2 text-xs font-semibold text-cyan-200/90"
            >
              <PlanifyIcon name={benefit.icon as PlanifyIconName} className="h-3.5 w-3.5" />
              {benefit.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
