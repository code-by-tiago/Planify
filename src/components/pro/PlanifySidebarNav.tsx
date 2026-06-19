"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode, type RefObject } from "react";
import { PlanifyNavIcon } from "@/components/pro/PlanifyNavIcon";
import { PlanifySidebarRecents } from "@/components/pro/PlanifySidebarRecents";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  filterToolsForSidebar,
  isDashboardRouteActive,
  sidebarWorkspaceGroups,
} from "@/lib/pro/dashboardNav";
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
  onSelectTool?: (toolId: PlanifyToolId) => void;
  selectedSectionId?: DashboardSectionId | null;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  onSelectInicio?: () => void;
  activeCategory?: ToolCategoryId | null;
  onSelectCategory?: (category: ToolCategoryId) => void;
  pathname?: string;
  activeTipo?: string | null;
  isNavActive?: (href: string) => boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  toolCardStyle?: "default" | "thin";
  canViewBnccProgress?: boolean;
  canViewDirectorPanel?: boolean;
  isManagerView?: boolean;
  collapsed?: boolean;
};

function navButtonClass(selected: boolean, collapsed: boolean) {
  return `pl-sidebar-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
    collapsed ? "justify-center px-2" : ""
  } ${
    selected
      ? "is-active bg-gradient-to-r from-cyan-500 to-blue-600 shadow-sm"
      : "hover:bg-cyan-400/10"
  }`;
}

function toolButtonClass(selected: boolean, collapsed: boolean) {
  return `pf-sidebar-tool flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
    collapsed ? "justify-center px-1.5" : ""
  } ${
    selected
      ? "is-active bg-cyan-500/15 ring-1 ring-cyan-400/35"
      : "hover:bg-cyan-400/8"
  }`;
}

export function PlanifySidebarNav({
  mode,
  primaryAction,
  onActivate,
  selectedToolId = null,
  onSelectTool,
  selectedSectionId = null,
  onSelectSection,
  onSelectInicio,
  activeCategory = null,
  onSelectCategory,
  pathname = "",
  isNavActive,
  canViewBnccProgress = false,
  canViewDirectorPanel = false,
  isManagerView = false,
  collapsed = false,
}: PlanifySidebarNavProps) {
  const [toolQuery, setToolQuery] = useState("");
  const [toolsExpanded, setToolsExpanded] = useState(true);

  const navItems: AppNavItem[] = filterSidebarNavigation({
    canViewBnccProgress,
    canViewDirectorPanel,
    isManagerView,
  });

  const filteredTools = useMemo(
    () =>
      filterToolsForSidebar({
        query: toolQuery,
        category: activeCategory,
        limit: collapsed ? 8 : 16,
      }),
    [activeCategory, collapsed, toolQuery],
  );

  const categoryTabs = toolCategories.filter((c) => c.id !== "todos");

  function isWorkspaceSelected(item: AppNavItem): boolean {
    if (mode === "studio") {
      if (item.panel === "inicio") {
        return !selectedToolId && !selectedSectionId;
      }
      if (item.panel !== "external") {
        return selectedSectionId === item.panel && !selectedToolId;
      }
      return false;
    }

    if (isNavActive) return isNavActive(item.href);
    return isDashboardRouteActive({
      href: item.href,
      pathname,
      search: typeof window !== "undefined" ? window.location.search : "",
      selectedToolId,
      selectedSectionId,
    });
  }

  function isToolSelected(toolId: PlanifyToolId): boolean {
    return mode === "studio" && selectedToolId === toolId;
  }

  function handleWorkspaceClick(item: AppNavItem) {
    onActivate?.();
    if (mode !== "studio") return;

    if (item.panel === "inicio") {
      onSelectInicio?.();
      return;
    }

    if (item.panel !== "external") {
      onSelectSection?.(item.panel);
    }
  }

  function handleToolClick(toolId: PlanifyToolId) {
    onActivate?.();
    if (mode === "studio") {
      onSelectTool?.(toolId);
    }
  }

  function resolveGroupItems(groupSectionIds: DashboardSectionId[]): AppNavItem[] {
    return navItems.filter(
      (item) =>
        item.panel !== "external" &&
        item.panel !== "inicio" &&
        item.panel !== "diretor" &&
        groupSectionIds.includes(item.panel as DashboardSectionId),
    );
  }

  const externalItems = navItems.filter((item) => item.panel === "external");
  const directorItems = navItems.filter((item) => item.panel === "diretor");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {primaryAction ? (
        <div className={`shrink-0 pt-3 ${collapsed ? "px-2" : "px-3"}`}>{primaryAction}</div>
      ) : null}

      {mode === "studio" && !collapsed ? (
        <div className="shrink-0 px-3 pb-2">
          <p className="pl-sidebar-section-label px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
            Categorias
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectCategory?.("todos");
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
                  onSelectCategory?.(cat.id);
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

      {mode === "studio" && !isManagerView ? (
        <div className={`shrink-0 ${collapsed ? "px-2 pb-2" : "px-3 pb-2"}`}>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setToolsExpanded((current) => !current)}
              className="mb-1 flex w-full items-center justify-between px-1"
            >
              <p className="pl-sidebar-section-label text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
                Ferramentas IA
              </p>
              <PlanifyNavIcon
                name="chevronDown"
                className={`h-3.5 w-3.5 text-slate-400 transition ${toolsExpanded ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}

          {!collapsed && toolsExpanded ? (
            <div className="relative mb-2">
              <PlanifyNavIcon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                value={toolQuery}
                onChange={(event) => setToolQuery(event.target.value)}
                placeholder="Buscar ferramenta…"
                aria-label="Buscar ferramentas"
                className="pf-sidebar-search w-full rounded-xl border border-[var(--pf-border)] bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          ) : null}

          {(collapsed || toolsExpanded) && (
            <div className={`space-y-0.5 ${collapsed ? "max-h-[40vh] overflow-y-auto" : "max-h-52 overflow-y-auto"}`}>
              {filteredTools.map((tool) => {
                const selected = isToolSelected(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    title={collapsed ? tool.shortTitle : undefined}
                    onClick={() => handleToolClick(tool.id)}
                    className={toolButtonClass(selected, collapsed)}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                    >
                      <PlanifyNavIcon name={tool.icon} className="h-3.5 w-3.5" />
                    </span>
                    {!collapsed ? (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-slate-900">
                          {tool.shortTitle}
                        </span>
                        {tool.popular ? (
                          <span className="text-[10px] font-semibold text-amber-700">Popular</span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!collapsed && filteredTools.length === 0 ? (
                <p className="px-2 py-2 text-[11px] font-medium text-slate-500">
                  Nenhuma ferramenta encontrada.
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className={`min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain py-2 ${collapsed ? "px-2" : "px-3"}`}
      >
        {directorItems.map((item) => {
          const selected = isWorkspaceSelected(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onActivate?.()}
              aria-current={selected ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={navButtonClass(selected, collapsed)}
            >
              <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
              {!collapsed ? <span className="pl-sidebar-nav-label">{item.label}</span> : null}
            </Link>
          );
        })}

        {sidebarWorkspaceGroups.map((group) => {
          const groupItems = resolveGroupItems(group.sectionIds);
          if (groupItems.length === 0) return null;

          return (
            <div key={group.id}>
              {!collapsed ? (
                <p className="pl-sidebar-section-label px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const selected = isWorkspaceSelected(item);
                  const className = navButtonClass(selected, collapsed);

                  if (mode === "studio") {
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
              </div>
            </div>
          );
        })}

        {externalItems.length > 0 ? (
          <div>
            {!collapsed ? (
              <p className="pl-sidebar-section-label px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
                Conta
              </p>
            ) : null}
            <div className="space-y-0.5">
              {externalItems.map((item) => {
                const selected = isWorkspaceSelected(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onActivate?.()}
                    aria-current={selected ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={navButtonClass(selected, collapsed)}
                  >
                    <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
                    {!collapsed ? (
                      <span className="pl-sidebar-nav-label">{item.label}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>

      {mode === "studio" && onSelectSection && !isManagerView ? (
        <PlanifySidebarRecents
          collapsed={collapsed}
          onOpenHistorico={() => onSelectSection("historico")}
          onActivate={onActivate}
        />
      ) : null}
    </div>
  );
}
