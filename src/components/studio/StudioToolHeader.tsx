"use client";

import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

export type StudioToolHeaderProps = {
  icon?: PlanifyIconName;
  iconAccent?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumb?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Cabeçalho estilo Teachy — título, subtítulo, breadcrumb e voltar.
 */
export function StudioToolHeader({
  icon,
  iconAccent = "from-cyan-500 to-indigo-600",
  eyebrow = "Ferramenta IA · BNCC",
  title,
  subtitle,
  breadcrumb,
  onBack,
  backLabel = "Voltar",
  actions,
  className = "",
}: StudioToolHeaderProps) {
  return (
    <header
      className={`ps-pro-header flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80 hover:text-slate-950"
            aria-label={backLabel}
          >
            <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
          </button>
        ) : null}
        {icon ? (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconAccent} text-white shadow-sm`}
          >
            <PlanifyIcon name={icon} className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          {breadcrumb ? (
            <div className="mb-0.5 text-[11px] font-semibold text-slate-500">{breadcrumb}</div>
          ) : eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="truncate text-base font-extrabold text-slate-950 sm:text-lg">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs font-medium text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export default StudioToolHeader;
