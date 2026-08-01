import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnOnDark, ppBtnPrimary } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="bg-[#0A192F] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-white sm:text-4xl">
          Pronto para transformar seu planejamento?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-slate-300">
          Escolha um plano, descreva o tema da aula e revise cada material antes de levar para
          a turma — com BNCC, editor e exportação Google no mesmo fluxo.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/planos" className={ppBtnPrimary}>
            Assinar agora
          </Link>
          <Link href="/login" className={ppBtnOnDark}>
            Já tenho conta
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {FINAL_BENEFITS.map((benefit) => (
            <li
              key={benefit.label}
              className="flex items-center gap-2 text-sm font-semibold text-slate-300"
            >
              <PlanifyIcon name={benefit.icon as PlanifyIconName} className="h-4 w-4 shrink-0 text-[#26C6DA]" />
              {benefit.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
