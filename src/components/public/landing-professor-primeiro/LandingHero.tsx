import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingHeroVideo } from "./LandingHeroVideo";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="relative scroll-mt-24 overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
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

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-[1.04] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.1rem]">
            Pare de perder horas com{" "}
            <span className="text-cyan-600">burocracia.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
            Crie planejamentos alinhados à BNCC, materiais didáticos, avaliações e envie tudo
            para sua turma em uma única plataforma.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/planos"
              className={`${ppBtnPrimary} gap-2 px-8 py-4 text-base`}
            >
              Começar agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/#como-funciona"
              className={`${ppBtnSecondary} gap-2 px-8 py-4 text-base`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Ver demonstração
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

        <LandingHeroVideo />
      </div>
    </section>
  );
}
