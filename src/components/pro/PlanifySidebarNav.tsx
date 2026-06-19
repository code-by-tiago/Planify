"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { PlanifyNavIcon } from "@/components/pro/PlanifyNavIcon";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  filterSidebarNavigation,
  toolCategories,
  type AppNavItem,
  type PlanifyToolId,
  type ToolCategoryId,
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
  /** Highlight tool category on dashboard home (studio mode) */
  activeCategory?: ToolCategoryId | null;
  onSelectCategory?: (category: ToolCategoryId) => void;
  pathname?: string;
  activeTipo?: string | null;
  isNavActive?: (href: string) => boolean;
  /** @deprecated Sidebar no longer includes tool search */
  query?: string;
  onQueryChange?: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  toolCardStyle?: "default" | "thin";
  canViewBnccProgress?: boolean;
  canViewDirectorPanel?: boolean;
  isManagerView?: boolean;
  collapsed?: boolean;
};

export function PlanifySidebarNav({
  mode,
  primaryAction,
  onActivate,
  selectedToolId = null,
  selectedSectionId = null,
  onSelectSection,
  activeCategory = null,
  onSelectCategory,
  pathname = "",
  isNavActive,
  canViewBnccProgress = false,
  canViewDirectorPanel = false,
  isManagerView = false,
  collapsed = false,
}: PlanifySidebarNavProps) {
  const navItems: AppNavItem[] = filterSidebarNavigation({
    canViewBnccProgress,
    canViewDirectorPanel,
    isManagerView,
  });

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
    return `pl-sidebar-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
      collapsed ? "justify-center px-2" : ""
    } ${
      selected
        ? "is-active bg-gradient-to-r from-cyan-500 to-blue-600 shadow-sm"
        : "hover:bg-cyan-400/10"
    }`;
  }

  const categoryTabs = toolCategories.filter((c) => c.id !== "todos");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {primaryAction ? (
        <div className={`shrink-0 pt-3 ${collapsed ? "px-2" : "px-3"}`}>{primaryAction}</div>
      ) : null}

      {mode === "studio" && !collapsed && onSelectCategory ? (
        <div className="shrink-0 px-3 pb-2">
          <p className="pl-sidebar-section-label px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
            Categorias
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectCategory("todos");
                onActivate?.();
              }}
              className={`pf-sidebar-category ${!activeCategory || activeCategory === "todos" ? "is-active" : ""}`}
            >
              <PlanifyNavIcon name="spark" className="h-4 w-4 shrink-0" />
              Todos
            </button>
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onActivate?.();
                }}
                className={`pf-sidebar-category ${activeCategory === cat.id ? "is-active" : ""}`}
              >
                <PlanifyNavIcon name={cat.icon} className="h-4 w-4 shrink-0" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className={`min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain py-3 ${collapsed ? "px-2" : "px-3"}`}
      >
        {!collapsed ? (
          <p className="pl-sidebar-section-label px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
            Menu
          </p>
        ) : null}
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
                title={collapsed ? item.label : undefined}
                className={className}
              >
                <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
                {!collapsed ? (
                  <span className="pl-sidebar-nav-label">{item.label}</span>
                ) : null}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onActivate?.()}
              aria-current={selected ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={className}
            >
              <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
              {!collapsed ? (
                <span className="pl-sidebar-nav-label">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
