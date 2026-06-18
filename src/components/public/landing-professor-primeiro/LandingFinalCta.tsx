import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnOnDark, ppBtnPrimary } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c2a3a] to-[#071018] px-8 py-16 text-center shadow-2xl sm:px-12 sm:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl">
          Menos tempo planejando.
          <br />
          <span className="text-cyan-300">Mais qualidade ensinando.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-cyan-100/80">
          Junte-se a milhares de professores que já transformaram sua rotina com o Planify.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/planos" className={`${ppBtnPrimary} px-10 py-4 text-base`}>
            Começar agora
          </Link>
          <Link href="/login" className={`${ppBtnOnDark} px-10 py-4 text-base`}>
            Já tenho conta
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {FINAL_BENEFITS.map((benefit) => (
            <li
              key={benefit.label}
              className="flex items-center gap-2 text-sm font-semibold text-cyan-100/90"
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
