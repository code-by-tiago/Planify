import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { TRUST_ITEMS } from "./constants";

export function LandingTrustBar() {
  return (
    <section className="border-y border-slate-200/80 bg-white/80 px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-2.5 text-center sm:justify-start sm:text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <PlanifyIcon name={item.icon as PlanifyIconName} className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-800">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
