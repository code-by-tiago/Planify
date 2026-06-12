import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnOnDark, ppBtnPrimary, ppCtaBand } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className={`mx-auto max-w-4xl ${ppCtaBand} py-12 sm:py-14`}>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold !text-white sm:text-4xl">
          Pronto para transformar seu planejamento?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-[#bae6fd]">
          Escolha um plano, descreva o tema da aula e revise cada material antes de levar para
          a turma — com BNCC, editor e exportação Google no mesmo fluxo.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/planos" className={`${ppBtnPrimary} px-8`}>
            Ver planos
          </Link>
          <Link href="/login" className={`${ppBtnOnDark} px-8`}>
            Já tenho conta
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {FINAL_BENEFITS.map((benefit) => (
            <li
              key={benefit.label}
              className="flex items-center gap-2 text-sm font-semibold text-[#c8f5ff]"
            >
              <PlanifyIcon name={benefit.icon as PlanifyIconName} className="h-4 w-4 shrink-0" />
              {benefit.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
