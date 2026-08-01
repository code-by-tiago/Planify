"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";

type MaterialTypeCoverProps = {
  typeLabel: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

export function MaterialTypeCover({
  typeLabel,
  subtitle,
  compact = false,
  className = "",
}: MaterialTypeCoverProps) {
  const visual = resolveMaterialCoverVisual(typeLabel);
  const heightClass = compact ? "h-24" : "h-36 sm:h-40";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${visual.accent} ${heightClass} ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/30 bg-black/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
            {visual.label}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/20 text-white backdrop-blur-sm">
            <PlanifyIcon name={visual.icon} className="h-5 w-5" />
          </span>
        </div>
        {subtitle ? (
          <p className="line-clamp-1 text-xs font-semibold text-white/90">{subtitle}</p>
        ) : (
          <span className="h-4" />
        )}
      </div>
    </div>
  );
}
