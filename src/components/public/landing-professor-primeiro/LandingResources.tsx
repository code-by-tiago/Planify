import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { RESOURCES } from "./constants";

export function LandingResources() {
  return (
    <section id="recursos" className="scroll-mt-24 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Recursos que fazem a diferença
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Tudo o que você precisa para planejar, criar e entregar materiais de qualidade.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map((resource) => (
            <article
              key={resource.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <PlanifyIcon name={resource.icon as PlanifyIconName} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">{resource.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                {resource.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
