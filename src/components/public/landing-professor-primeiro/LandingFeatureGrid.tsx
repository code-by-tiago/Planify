import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { FEATURE_GRID } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingFeatureGrid() {
  return (
    <section id="recursos" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Tudo que você precisa</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Uma plataforma completa para o professor
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURE_GRID.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg"
            >
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-cyan-50/40 p-3">
                <div className="flex h-24 items-center justify-center rounded-lg bg-white shadow-inner">
                  <PlanifyIcon
                    name={item.icon as PlanifyIconName}
                    className="h-10 w-10 text-cyan-600 transition group-hover:scale-105"
                  />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-extrabold text-slate-900 group-hover:text-cyan-700">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-xs font-medium leading-5 text-slate-500">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
