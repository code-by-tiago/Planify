import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnOnDark, ppBtnPrimary } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0c2a3a] to-[#071018] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-8 py-14 sm:px-12 sm:py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Menos tempo planejando.
            <br />
            <span className="text-cyan-300">Mais qualidade ensinando.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-cyan-100/80">
            Junte-se a milhares de professores que já transformaram sua rotina com o Planify.
          </p>

          <div className="mt-10">
            <Link href="/planos" className={`${ppBtnPrimary} gap-2 px-10 py-4 text-base`}>
              Começar agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
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

        <div className="relative hidden min-h-[320px] bg-gradient-to-br from-cyan-600/30 to-blue-900/40 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_55%)]" />
          <div className="absolute bottom-0 right-0 flex h-full w-full items-end justify-center p-8">
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-7xl shadow-2xl ring-8 ring-white/10">
              👩‍🏫
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
