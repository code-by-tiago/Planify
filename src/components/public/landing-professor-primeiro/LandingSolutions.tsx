import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { STRATEGIC_PAGES } from "@/lib/seo/strategic-pages";
import { ppEyebrow } from "./theme";

export function LandingSolutions() {
  return (
    <section
      id="solucoes"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Guias detalhados</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Aprofunde por tipo de material
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Páginas com fluxo passo a passo e exemplos — para quem quer mais contexto além da
            grade de ferramentas.
          </p>
        </div>

        <nav
          aria-label="Guias detalhados do Planify"
          className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {STRATEGIC_PAGES.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3.5 transition hover:border-cyan-200 hover:bg-white"
            >
              <span className="text-sm font-extrabold text-slate-900 transition group-hover:text-cyan-700">
                {page.title}
              </span>
              <PlanifyIcon
                name="arrowRight"
                className="h-4 w-4 shrink-0 text-cyan-600 transition group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Todos os geradores também estão na{" "}
          <Link href="/#ferramentas" className="font-bold text-cyan-700 hover:text-cyan-900">
            grade de ferramentas
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
