import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { STRATEGIC_PAGES } from "@/lib/seo/strategic-pages";
export function LandingSolutions() {
  return (
    <section
      id="solucoes"
      className="scroll-mt-24 border-y border-slate-200/80 bg-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Soluções para o dia a dia em sala
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Conheça os geradores com IA do Planify — cada página explica benefícios,
            fluxo de uso e como começar.
          </p>
        </div>

        <nav
          aria-label="Soluções do Planify"
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {STRATEGIC_PAGES.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-cyan-200 hover:bg-white hover:shadow-md"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-base font-extrabold text-slate-900 transition group-hover:text-cyan-700">
                  {page.title}
                </span>
                <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">
                  {page.description}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
