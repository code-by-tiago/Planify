import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingProductDemoTabs } from "./LandingProductDemoTabs";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="pf-marketing-hero relative scroll-mt-24 overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_80%_15%,rgba(8,145,178,0.06),transparent_50%)] sm:block"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-800">
            IA feita para professores
          </span>

          <h1 className="pf-headline mt-6 text-4xl font-extrabold uppercase leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.1rem]">
            Sistema completo de IA{" "}
            <span className="text-cyan-600">para professores</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
            Junte-se a milhares de educadores com planejamentos BNCC, materiais com IA, correção e
            exportação Google — tudo num só lugar, feito para o docente brasileiro.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/cadastro" className={`${ppBtnPrimary} gap-2 px-8 py-4 text-base`}>
              Acesse grátis
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/ferramentas" className={`${ppBtnSecondary} gap-2 px-8 py-4 text-base`}>
              Ver ferramentas
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["MC", "RA", "FL", "JP"].map((initials) => (
                <span
                  key={initials}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-cyan-500 to-blue-600 text-[10px] font-bold text-white shadow-sm"
                >
                  {initials}
                </span>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                +2.500 professores(as) já usam e recomendam
              </p>
              <p className="text-xs font-medium text-amber-500">★★★★★</p>
            </div>
          </div>
        </div>

        <LandingProductDemoTabs />
      </div>
    </section>
  );
}
