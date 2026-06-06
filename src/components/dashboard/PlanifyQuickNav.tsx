"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

const links: {
  id: "inicio" | DashboardSectionId;
  label: string;
  icon: PlanifyIconName;
}[] = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "planejamentos", label: "Planejamentos", icon: "clipboard" },
  { id: "editor", label: "Editor", icon: "editor" },
  { id: "historico", label: "Meus materiais", icon: "history" },
  { id: "biblioteca", label: "Biblioteca", icon: "library" },
  { id: "marketplace", label: "Comunidade", icon: "market" },
];

type PlanifyQuickNavProps = {
  activeTool?: boolean;
  activeSection?: DashboardSectionId | null;
  onSelectInicio: () => void;
  onSelectSection: (id: DashboardSectionId) => void;
};

export function PlanifyQuickNav({
  activeTool,
  activeSection,
  onSelectInicio,
  onSelectSection,
}: PlanifyQuickNavProps) {
  function isActive(id: (typeof links)[number]["id"]) {
    if (id === "inicio") return !activeTool && !activeSection;
    return activeSection === id && !activeTool;
  }

  return (
    <div className="hidden min-w-0 flex-1 overflow-x-auto lg:block">
      <div className="flex gap-1">
        {links.map((link) => {
          const active = isActive(link.id);
          return (
            <button
              key={link.id}
              type="button"
              onClick={() =>
                link.id === "inicio"
                  ? onSelectInicio()
                  : onSelectSection(link.id)
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                active
                  ? "bg-cyan-500/15 text-cyan-800 ring-1 ring-cyan-400/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <PlanifyIcon name={link.icon} className="h-3.5 w-3.5" />
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
