import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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

export function PlanifyNavIcon({ name }: { name: PlanifyIconName }) {
  const tone = navIconTone[name] ?? "from-indigo-400 to-violet-500";
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-[0_4px_12px_-4px_rgba(139,92,246,0.45)] ring-2 ring-white/80`}
    >
      <PlanifyIcon name={name} className="h-4 w-4" />
    </span>
  );
}

/** Rota preferida para abrir ferramenta no Studio fullscreen */
export function studioToolHref(toolId: string) {
  return `/dashboard?tipo=${toolId}`;
}
