"use client";

import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { dashboardSectionLabels } from "@/lib/pro/dashboardViews";
import { getPlanifyTool, type PlanifyToolId } from "@/lib/pro/planifyTools";

type PlanifyDashboardBreadcrumbProps = {
  toolId?: PlanifyToolId | null;
  sectionId?: DashboardSectionId | null;
  onSelectInicio?: () => void;
  onSelectSection?: (id: DashboardSectionId) => void;
};

export function PlanifyDashboardBreadcrumb({
  toolId,
  sectionId,
  onSelectInicio,
  onSelectSection,
}: PlanifyDashboardBreadcrumbProps) {
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: "Início", onClick: onSelectInicio },
  ];

  if (toolId) {
    const tool = getPlanifyTool(toolId);
    crumbs.push({ label: tool.shortTitle });
  } else if (sectionId) {
    crumbs.push({ label: dashboardSectionLabels[sectionId] });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Navegação" className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-slate-500">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <span className="text-slate-300">/</span> : null}
            {crumb.onClick && !isLast ? (
              <button
                type="button"
                onClick={crumb.onClick}
                className="text-cyan-700 hover:text-cyan-900 hover:underline"
              >
                {crumb.label}
              </button>
            ) : (
              <span className={isLast ? "text-slate-700" : undefined}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
