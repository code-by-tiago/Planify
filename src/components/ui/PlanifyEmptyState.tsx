import { type ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { PlanifyButton } from "./PlanifyButton";

type PlanifyEmptyStateProps = {
  icon?: PlanifyIconName;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
};

export function PlanifyEmptyState({
  icon = "spark",
  eyebrow,
  title,
  description,
  action,
  onAction,
  actionLabel,
  className = "",
}: PlanifyEmptyStateProps) {
  return (
    <div
      className={[
        "pf-empty-state flex flex-col items-center px-6 py-12 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="pf-empty-state-icon flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--pl-border-teal)] bg-[var(--pl-surface-teal)] text-[var(--pl-teal-deep)]">
        <PlanifyIcon name={icon} className="h-6 w-6" />
      </span>
      {eyebrow ? <p className="pf-eyebrow mt-4">{eyebrow}</p> : null}
      <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      {action ?? (onAction && actionLabel ? (
        <PlanifyButton className="mt-5" onClick={onAction}>
          {actionLabel}
        </PlanifyButton>
      ) : null)}
    </div>
  );
}
