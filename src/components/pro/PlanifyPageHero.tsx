import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifyHeroCollapsed } from "@/components/pro/planify-workspace-context";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

type PlanifyPageHeroProps = {
  badge?: string;
  icon?: PlanifyIconName;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PlanifyPageHero({
  badge = "Planify",
  icon = "spark",
  title,
  description,
  action,
}: PlanifyPageHeroProps) {
  const collapsed = usePlanifyHeroCollapsed();

  return (
    <div
      className={`pl-hud-page-hero relative shrink-0 overflow-hidden border-b transition-[padding,box-shadow] duration-200 ${
        collapsed ? "px-4 py-2 shadow-sm sm:px-5" : "px-4 py-4 sm:px-6 sm:py-5"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl transition-opacity duration-200 ${
          collapsed ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`pl-hud-badge transition-opacity duration-200 ${collapsed ? "opacity-90" : ""}`}>
            <PlanifyIcon name={icon} className="h-3 w-3" />
            {badge}
          </span>
          <h1
            className={`font-extrabold tracking-tight text-slate-950 transition-[margin,font-size] duration-200 ${
              collapsed ? "mt-1 truncate text-sm sm:text-base" : "mt-2 text-xl sm:text-2xl"
            }`}
          >
            {title}
          </h1>
          <p
            className={`overflow-hidden font-medium leading-relaxed text-slate-500 transition-[max-height,opacity,margin] duration-200 ${
              collapsed ? "mt-0 max-h-0 opacity-0" : "mt-1.5 max-h-24 text-sm opacity-100"
            }`}
          >
            {description}
          </p>
        </div>
        {action ? (
          <div className={`shrink-0 transition-transform duration-200 ${collapsed ? "scale-95" : ""}`}>
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
