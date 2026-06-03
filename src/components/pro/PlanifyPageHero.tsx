import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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
  return (
    <div className="relative shrink-0 overflow-hidden border-b border-rose-100/60 bg-gradient-to-r from-white via-rose-50/40 to-violet-50/50 px-4 py-4 sm:px-6 sm:py-5">
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-fuchsia-200/35 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <span className="pl-badge-indigo">
            <PlanifyIcon name={icon} className="h-3 w-3" />
            {badge}
          </span>
          <h1 className="mt-2 text-xl font-black tracking-tight text-violet-950 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-violet-500/95">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
