import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { RESOURCES } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingResources() {
  return (
    <section
      id="recursos"
      className="scroll-mt-24 border-y border-slate-200/80 bg-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Plataforma</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            O que sustenta cada ferramenta
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Editor, histórico e créditos claros — complementam os geradores e as seções de
            comunidade e exportação Google.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map((resource) => (
            <article
              key={resource.title}
              className="pl-hud-glass flex flex-col rounded-2xl border border-cyan-400/15 p-5 transition hover:border-cyan-300/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                <PlanifyIcon name={resource.icon as PlanifyIconName} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">{resource.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {resource.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
