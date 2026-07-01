import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

function colorFromAccent(accent: string): string {
  if (accent.includes("blue") || accent.includes("sky")) return "#2563eb";
  if (accent.includes("cyan") || accent.includes("teal")) return "#06b6d4";
  if (accent.includes("emerald") || accent.includes("green") || accent.includes("lime")) {
    return "#10b981";
  }
  if (accent.includes("violet") || accent.includes("purple") || accent.includes("fuchsia")) {
    return "#8b5cf6";
  }
  if (accent.includes("pink") || accent.includes("rose") || accent.includes("red")) {
    return "#f472b6";
  }
  if (accent.includes("amber") || accent.includes("orange")) return "#f59e0b";
  return "#64748b";
}

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
      className={`inline-flex shrink-0 items-center justify-center text-white sm:shadow-sm ${box}`}
      style={{ backgroundColor: colorFromAccent(accent) }}
    >
      <PlanifyIcon name={icon} className={`${iconSize} pointer-events-none`} />
    </span>
  );
}
