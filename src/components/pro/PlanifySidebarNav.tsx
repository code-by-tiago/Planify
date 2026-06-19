"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode, type RefObject } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyNavIcon } from "@/components/pro/PlanifyNavIcon";
import { PlanifySidebarRecents } from "@/components/pro/PlanifySidebarRecents";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  filterJourneyGroups,
  filterToolsForSidebar,
  getJourneyCuratedToolIds,
  isDashboardRouteActive,
  type JourneyNavTarget,
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
  isSiteAdmin?: boolean;
  collapsed?: boolean;
};

function navButtonClass(selected: boolean, collapsed: boolean) {
  return [
    "pl-sidebar-nav-item",
    selected ? "is-active" : "",
    collapsed ? "pl-sidebar-nav-item--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function toolButtonClass(selected: boolean, collapsed: boolean) {
  return [
    "pf-sidebar-tool",
    selected ? "is-active" : "",
    collapsed ? "pf-sidebar-tool--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function SidebarSection({
  label,
  collapsed,
  children,
  className = "",
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`pl-sidebar-section ${className}`.trim()} aria-label={label}>
      {!collapsed ? (
        <h2 className="pl-sidebar-section-label">{label}</h2>
      ) : (
        <span className="sr-only">{label}</span>
      )}
      {children}
    </section>
  );
}

function renderNavItem(
  item: AppNavItem,
  opts: {
    selected: boolean;
    collapsed: boolean;
    mode: SidebarNavMode;
    onActivate?: () => void;
    handleWorkspaceClick: (item: AppNavItem) => void;
  },
) {
  const { selected, collapsed, mode, onActivate, handleWorkspaceClick } = opts;
  const className = navButtonClass(selected, collapsed);

  if (mode === "studio" && item.panel !== "external" && item.panel !== "diretor") {
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
        {!collapsed ? <span className="pl-sidebar-nav-label">{item.label}</span> : null}
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
      {!collapsed ? <span className="pl-sidebar-nav-label">{item.label}</span> : null}
    </Link>
  );
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
  isSiteAdmin = false,
  collapsed = false,
}: PlanifySidebarNavProps) {
  const [toolQuery, setToolQuery] = useState("");
  const [maisExpanded, setMaisExpanded] = useState(false);

  const navItems: AppNavItem[] = filterSidebarNavigation({
    canViewBnccProgress,
    canViewDirectorPanel,
    isManagerView,
  });

  const journeyGroups = useMemo(
    () =>
      filterJourneyGroups({
        canViewBnccProgress,
        isSiteAdmin,
      }),
    [canViewBnccProgress, isSiteAdmin],
  );

  const curatedToolIds = useMemo(() => getJourneyCuratedToolIds(), []);

  const filteredTools = useMemo(
    () =>
      filterToolsForSidebar({
        query: toolQuery,
        category: activeCategory,
        limit: collapsed ? 8 : 16,
        excludeToolIds: curatedToolIds,
      }),
    [activeCategory, collapsed, curatedToolIds, toolQuery],
  );

  const categoryTabs = toolCategories.filter((c) => c.id !== "todos");

  function isSectionSelected(sectionId: DashboardSectionId, label?: string): boolean {
    if (mode !== "studio") return false;
    if (selectedToolId) return false;
    if (selectedSectionId !== sectionId) return false;
    if (sectionId === "editor" && label === "Classroom") {
      return selectedSectionId === "editor";
    }
    if (sectionId === "editor" && label === "Editor") {
      return selectedSectionId === "editor";
    }
    return true;
  }

  function isToolSelected(toolId: PlanifyToolId): boolean {
    return mode === "studio" && selectedToolId === toolId;
  }

  function handleToolClick(toolId: PlanifyToolId) {
    onActivate?.();
    if (mode === "studio") {
      onSelectTool?.(toolId);
    }
  }

  function handleSectionClick(sectionId: DashboardSectionId) {
    onActivate?.();
    if (mode === "studio") {
      onSelectSection?.(sectionId);
    }
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

  function renderJourneyItem(item: JourneyNavTarget, key: string) {
    if (item.type === "tool") {
      const selected = isToolSelected(item.toolId);
      return (
        <button
          key={key}
          type="button"
          title={collapsed ? item.label : undefined}
          onClick={() => handleToolClick(item.toolId)}
          className={toolButtonClass(selected, collapsed)}
        >
          <span className="pf-sidebar-tool-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#bfece5] bg-[#dff7f2] text-[#082f3a]">
            <PlanifyIcon name={item.icon} className="h-3.5 w-3.5" />
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1 truncate text-xs font-bold">{item.label}</span>
          ) : null}
        </button>
      );
    }

    if (item.type === "section") {
      const selected = isSectionSelected(item.sectionId, item.label);
      return (
        <button
          key={key}
          type="button"
          title={collapsed ? item.label : undefined}
          onClick={() => handleSectionClick(item.sectionId)}
          aria-current={selected ? "page" : undefined}
          className={navButtonClass(selected, collapsed)}
        >
          <PlanifyNavIcon name={item.icon} className="pl-sidebar-nav-icon" />
          {!collapsed ? <span className="pl-sidebar-nav-label">{item.label}</span> : null}
        </button>
      );
    }

    const selected = isNavActive
      ? isNavActive(item.href)
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={key}
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
  }

  const directorItems = navItems.filter((item) => item.panel === "diretor");
  const padX = collapsed ? "px-2" : "px-3";

  const maisSection =
    mode === "studio" && !isManagerView ? (
      <SidebarSection label="Mais ferramentas" collapsed={collapsed} className="pl-sidebar-section--criar">
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setMaisExpanded((current) => !current)}
            aria-expanded={maisExpanded}
            className="pl-sidebar-section-toggle mb-1.5"
          >
            <span className="text-[11px] font-semibold text-slate-400">
              {filteredTools.length} geradores extras
            </span>
            <PlanifyIcon
              name="chevronDown"
              className={`h-3.5 w-3.5 text-slate-400 transition ${maisExpanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}

        {!collapsed && maisExpanded ? (
          <>
            <div className="relative mb-2">
              <PlanifyIcon
                name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                value={toolQuery}
                onChange={(event) => setToolQuery(event.target.value)}
                placeholder="Buscar ferramenta…"
                aria-label="Buscar ferramentas de IA"
                className="pf-sidebar-search w-full rounded-lg py-2 pl-8 pr-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
              />
            </div>
            <div
              className="pl-sidebar-category-rail mb-2 flex gap-1 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="Filtrar por categoria"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!activeCategory || activeCategory === "todos"}
                onClick={() => {
                  onSelectCategory?.("todos");
                  onActivate?.();
                }}
                className={`pl-sidebar-category-pill ${!activeCategory || activeCategory === "todos" ? "is-active" : ""}`}
              >
                Todos
              </button>
              {categoryTabs.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  onClick={() => {
                    onSelectCategory?.(cat.id);
                    onActivate?.();
                  }}
                  className={`pl-sidebar-category-pill ${activeCategory === cat.id ? "is-active" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {(collapsed || maisExpanded) && (
          <div
            className={`pl-sidebar-tool-list space-y-0.5 ${collapsed ? "max-h-[36vh] overflow-y-auto" : "max-h-44 overflow-y-auto"}`}
          >
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
                    className={`pf-sidebar-tool-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={tool.icon} className="h-3.5 w-3.5" />
                  </span>
                  {!collapsed ? (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{tool.shortTitle}</span>
                      {tool.popular ? (
                        <span className="text-[10px] font-semibold opacity-80">Popular</span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {!collapsed && filteredTools.length === 0 ? (
              <p className="px-2 py-2 text-[11px] font-medium opacity-70">
                Nenhuma ferramenta encontrada.
              </p>
            ) : null}
          </div>
        )}
      </SidebarSection>
    ) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {primaryAction ? (
        <div className={`shrink-0 pt-3 ${padX}`}>{primaryAction}</div>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain py-2 ${padX}`}
      >
        {directorItems.length > 0 ? (
          <SidebarSection label="Gestão" collapsed={collapsed}>
            <div className="pl-sidebar-nav-group">
              {directorItems.map((item) =>
                renderNavItem(item, {
                  selected: isWorkspaceSelected(item),
                  collapsed,
                  mode,
                  onActivate,
                  handleWorkspaceClick,
                }),
              )}
            </div>
          </SidebarSection>
        ) : null}

        {!isManagerView
          ? journeyGroups.map((group) => (
              <SidebarSection key={group.id} label={group.label} collapsed={collapsed}>
                <div className="pl-sidebar-nav-group space-y-0.5">
                  {group.items.map((item, index) =>
                    renderJourneyItem(item, `${group.id}-${index}`),
                  )}
                </div>
              </SidebarSection>
            ))
          : null}

        {maisSection}

        {mode === "studio" && onSelectSection && !isManagerView ? (
          <PlanifySidebarRecents
            collapsed={collapsed}
            onOpenHistorico={() => onSelectSection("historico")}
            onActivate={onActivate}
          />
        ) : null}
      </nav>
    </div>
  );
}
