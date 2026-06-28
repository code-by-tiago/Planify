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
  const box = size === "sm" ? "h-8 w-8 rounded-md" : "h-10 w-10 rounded-xl";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${accent} text-white shadow-sm ${box}`}
    >
      <PlanifyIcon name={icon} className={iconSize} />
    </span>
  );
}
