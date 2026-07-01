import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

export function LandingToolIconBadge({
  accent,
  icon,
  size = "sm",
}: {
  accent: string;
  icon: PlanifyIconName;
  size?: "sm" | "md";
}) {
  const box =
    size === "sm"
      ? "h-8 w-8 min-w-8 rounded-lg"
      : "h-10 w-10 min-w-10 rounded-xl";
  const iconSize =
    size === "sm"
      ? "block h-4 w-4 shrink-0"
      : "block h-5 w-5 shrink-0";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${accent} text-white shadow-sm ${box}`}
    >
      <PlanifyIcon name={icon} className={`${iconSize} pointer-events-none`} />
    </span>
  );
}
