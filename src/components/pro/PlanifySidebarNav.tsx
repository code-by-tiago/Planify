"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { PlanifyNavIcon } from "@/components/pro/PlanifyNavIcon";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  sidebarNavigation,
  type AppNavItem,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

export type SidebarNavMode = "studio" | "routes" | "public";

type PlanifySidebarNavProps = {
  mode: SidebarNavMode;
  primaryAction?: ReactNode;
  onActivate?: () => void;
  selectedToolId?: PlanifyToolId | null;
  onSelectTool?: (toolId: PlanifyToolId | null) => void;
  selectedSectionId?: DashboardSectionId | null;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  onSelectInicio?: () => void;
  pathname?: string;
  activeTipo?: string | null;
  isNavActive?: (href: string) => boolean;
  /** @deprecated Sidebar no longer includes tool search */
  query?: string;
  onQueryChange?: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  toolCardStyle?: "default" | "thin";
};

export function PlanifySidebarNav({
  mode,
  primaryAction,
  onActivate,
  selectedToolId = null,
  selectedSectionId = null,
  onSelectSection,
  pathname = "",
  isNavActive,
}: PlanifySidebarNavProps) {
  const navItems: AppNavItem[] = sidebarNavigation;

  function isWorkspaceSelected(item: AppNavItem): boolean {
    if (mode === "studio") {
      if (item.panel !== "external") {
        return selectedSectionId === item.panel && !selectedToolId;
      }
      return false;
    }

    if (isNavActive) return isNavActive(item.href);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function handleWorkspaceClick(item: AppNavItem) {
    onActivate?.();
    if (mode !== "studio") return;

    if (item.panel !== "external" && item.panel !== "inicio") {
      onSelectSection?.(item.panel);
    }
  }

  function navButtonClass(selected: boolean) {
    return `pl-sidebar-nav-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
      selected
        ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_16px_rgba(0,212,255,0.25)]"
        : "hover:bg-white/5"
    }`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {primaryAction ? (
        <div className="shrink-0 px-3 pt-3">{primaryAction}</div>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3"
      >
        <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
          Menu
        </p>
        {navItems.map((item) => {
          const selected = isWorkspaceSelected(item);
          const className = navButtonClass(selected);

          if (mode === "studio" && item.panel !== "external") {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleWorkspaceClick(item)}
                aria-current={selected ? "page" : undefined}
                className={className}
              >
                <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
                <span className="pl-sidebar-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onActivate}
              aria-current={selected ? "page" : undefined}
              className={className}
            >
              <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
              <span className="pl-sidebar-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
