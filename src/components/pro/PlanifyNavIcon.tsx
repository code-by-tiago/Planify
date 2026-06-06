import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { dashboardToolHref } from "@/lib/pro/toolRoutes";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

const navIconTone: Record<string, string> = {
  home: "from-violet-400 to-fuchsia-500",
  materials: "from-indigo-400 to-violet-500",
  clipboard: "from-emerald-400 to-teal-500",
  editor: "from-rose-400 to-pink-500",
  history: "from-amber-400 to-orange-400",
  library: "from-sky-400 to-indigo-400",
  market: "from-fuchsia-400 to-rose-500",
  plans: "from-violet-500 to-indigo-600",
};

export function PlanifyNavIcon({
  name,
  className = "",
}: {
  name: PlanifyIconName;
  className?: string;
}) {
  const tone = navIconTone[name] ?? "from-indigo-400 to-violet-500";
  return (
    <span
      className={`pl-sidebar-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tone} shadow-sm ring-1 ring-cyan-300/30 ${className}`.trim()}
    >
      <PlanifyIcon name={name} className="h-3.5 w-3.5 text-white" />
    </span>
  );
}

/** Rota canônica para abrir ferramenta no painel */
export function studioToolHref(toolId: string) {
  return dashboardToolHref(toolId);
}
