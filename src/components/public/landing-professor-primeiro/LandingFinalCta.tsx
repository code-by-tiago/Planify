import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FINAL_BENEFITS } from "./constants";
import { ppBtnPrimary } from "./theme";

export function LandingFinalCta() {
  return (
    <section className="pf-marketing-section">
      <div className="mx-auto max-w-6xl">
        <div className="pf-marketing-cta-band grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center px-8 py-14 sm:px-12 sm:py-16">
            <h2 className="pf-marketing-display text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
              Menos tempo planejando.
              <br />
              <span className="text-cyan-300">Mais qualidade ensinando.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base font-normal leading-7 text-cyan-100/80">
              Junte-se a milhares de professores que já transformaram sua rotina com o Planify.
            </p>

            <div className="mt-10">
              <Link href="/cadastro" className={`${ppBtnPrimary} gap-2 px-8 py-3.5`}>
                Acesse grátis
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {FINAL_BENEFITS.map((benefit) => (
                <li
                  key={benefit.label}
                  className="flex items-center gap-2 text-sm font-medium text-cyan-100/90"
                >
                  <PlanifyIcon name={benefit.icon as PlanifyIconName} className="h-4 w-4 shrink-0" />
                  {benefit.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative hidden min-h-[280px] bg-gradient-to-br from-cyan-600/25 to-blue-900/35 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_55%)]" />
            <div className="absolute bottom-0 right-0 flex h-full w-full items-end justify-center p-8">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-6xl shadow-xl ring-4 ring-white/10">
                👩‍🏫
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
