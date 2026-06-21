"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { HERO_STATS } from "./constants";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

const ICON_COLORS: Record<string, string> = {
  purple: "text-violet-600 bg-violet-50",
  green: "text-emerald-600 bg-emerald-50",
  blue: "text-[#3B82F6] bg-blue-50",
  orange: "text-orange-500 bg-orange-50",
};

function formatStat(value: number, prefix = "", suffix = ""): string {
  return `${prefix}${new Intl.NumberFormat("pt-BR").format(value)}${suffix}`;
}

export function LandingHeroStatsBar() {
  return (
    <div className="pf-hero-stats-bar" aria-label="Estatísticas da plataforma Planify">
      <div className="pf-hero-stats-bar-inner">
        {HERO_STATS.map((stat) => {
          const colorClass = ICON_COLORS[stat.color] ?? ICON_COLORS.blue;
          return (
            <div key={stat.label} className="pf-hero-stat-item">
              <span className={`pf-hero-stat-icon ${colorClass}`}>
                <PlanifyIcon name={stat.icon as PlanifyIconName} className="h-4 w-4" />
              </span>
              <span className="pf-hero-stat-content">
                <strong className="pf-hero-stat-value">
                  {formatStat(stat.value, "prefix" in stat ? stat.prefix : "", stat.suffix)}
                </strong>
                <span className="pf-hero-stat-label">{stat.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
