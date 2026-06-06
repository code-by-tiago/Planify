"use client";

import Link from "next/link";
import { useMemo, type ReactNode, type RefObject } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyNavIcon, studioToolHref } from "@/components/pro/PlanifyNavIcon";
import { dashboardToolHref, homeToolHref } from "@/lib/pro/toolRoutes";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import {
  appNavigation,
  planifyToolCount,
  planifyTools,
  toolCategories,
  type AppNavItem,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

export type SidebarNavMode = "studio" | "routes" | "public";

type PlanifySidebarNavProps = {
  mode: SidebarNavMode;
  query: string;
  onQueryChange: (value: string) => void;
  primaryAction?: ReactNode;
  onActivate?: () => void;
  selectedToolId?: PlanifyToolId | null;
  onSelectTool?: (toolId: PlanifyToolId | null) => void;
  selectedSectionId?: DashboardSectionId | null;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  onSelectInicio?: () => void;
  toolCardStyle?: "default" | "thin";
  pathname?: string;
  activeTipo?: string | null;
  isNavActive?: (href: string) => boolean;
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

export function PlanifySidebarNav({
  mode,
  query,
  onQueryChange,
  primaryAction,
  onActivate,
  selectedToolId = null,
  onSelectTool,
  selectedSectionId = null,
  onSelectSection,
  onSelectInicio,
  toolCardStyle = "thin",
  pathname = "",
  activeTipo = null,
  isNavActive,
  searchInputRef,
}: PlanifySidebarNavProps) {
  const filteredTools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return planifyTools;
    return planifyTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(term) ||
        tool.shortTitle.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term),
    );
  }, [query]);

  const groupedTools = useMemo(
    () =>
      toolCategories
        .filter((category) => category.id !== "todos")
        .map((category) => ({
          category,
          tools: filteredTools.filter((tool) => tool.category === category.id),
        }))
        .filter((group) => group.tools.length > 0),
    [filteredTools],
  );

  const isThin = toolCardStyle === "thin";

  function isToolSelected(toolId: string): boolean {
    if (mode === "studio") return selectedToolId === toolId;
    return (
      (pathname === "/" ||
        pathname === "/dashboard" ||
        pathname === "/materiais") &&
      activeTipo === toolId
    );
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

    if (mode === "public" && item.panel === "inicio") {
      return pathname === "/";
    }

    if (isNavActive) return isNavActive(item.href);
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function handleWorkspaceClick(item: AppNavItem) {
    onActivate?.();
    if (mode !== "studio") return;

    if (item.panel === "inicio") {
      onSelectInicio?.();
      onSelectTool?.(null);
      return;
    }

    if (item.panel !== "external") {
      onSelectSection?.(item.panel);
    }
  }

  function toolButtonClass(selected: boolean) {
    if (isThin) {
      return `group flex w-full items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition ${
        selected
          ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,212,255,0.12)]"
          : "border-slate-200/80 bg-white/60 hover:border-cyan-400/25 hover:bg-white"
      }`;
    }
    return `pl-tool-item group flex w-full items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left text-sm font-semibold transition ${
      selected
        ? "border-cyan-400/35 bg-cyan-50 shadow-sm"
        : "border-transparent text-slate-700 hover:bg-slate-50"
    }`;
  }

  const workspaceItems: AppNavItem[] =
    mode === "public"
      ? [
          { label: "Início", href: "/", icon: "home", panel: "inicio" },
          {
            label: "Planejamentos",
            href: "/dashboard?secao=planejamentos",
            icon: "clipboard",
            panel: "planejamentos",
          },
          {
            label: "Editor",
            href: "/dashboard?secao=editor",
            icon: "editor",
            panel: "editor",
          },
          {
            label: "Histórico",
            href: "/dashboard?secao=historico",
            icon: "history",
            panel: "historico",
          },
          {
            label: "Biblioteca",
            href: "/dashboard?secao=biblioteca",
            icon: "library",
            panel: "biblioteca",
          },
          {
            label: "Marketplace",
            href: "/dashboard?secao=marketplace",
            icon: "market",
            panel: "marketplace",
          },
          { label: "Planos", href: "/planos", icon: "plans", panel: "external" },
        ]
      : appNavigation;

  return (
    <>
      <div className="shrink-0 px-3 pt-3">
        <div className="relative">
          <PlanifyIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar ferramenta…"
            aria-label="Buscar ferramenta"
            className="h-9 w-full rounded-xl border border-cyan-400/15 bg-white/90 py-2 pl-9 pr-2 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
        {primaryAction ? <div className="mt-2">{primaryAction}</div> : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-3">
        {mode !== "public" ? (
          <div>
            <Link
              href="/"
              onClick={onActivate}
              className="flex w-full items-center gap-2 rounded-xl border border-cyan-400/15 bg-white/60 px-2 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-cyan-400/30 hover:bg-cyan-50/50"
            >
              <PlanifyNavIcon name="externalLink" />
              <span className="truncate">Página inicial do site</span>
            </Link>
          </div>
        ) : null}

        <div>
            <p className="px-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600/80">
              {mode === "public" ? "Acessar" : "Páginas"}
            </p>
            <div className="mt-1.5 space-y-0.5">
              {workspaceItems.map((item) => {
                const selected = isWorkspaceSelected(item);
                const className = `flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-semibold transition ${
                  selected
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_16px_rgba(0,212,255,0.25)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`;

                if (mode === "studio" && item.panel !== "external") {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleWorkspaceClick(item)}
                      aria-current={selected ? "page" : undefined}
                      className={className}
                    >
                      <PlanifyNavIcon name={item.icon} />
                      <span className="truncate">{item.label}</span>
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
                    <PlanifyNavIcon name={item.icon} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        {groupedTools.map((group) => (
          <div key={group.category.id}>
            <p className="px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {group.category.label}
            </p>
            <div className="mt-1 space-y-1">
              {group.tools.map((tool) => {
                const selected = isToolSelected(tool.id);
                const className = toolButtonClass(selected);

                if (mode === "studio" && onSelectTool) {
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        onSelectTool(tool.id);
                        onActivate?.();
                      }}
                      aria-current={selected ? "page" : undefined}
                      className={className}
                    >
                      <ToolIcon tool={tool} thin={isThin} />
                      <span
                        className={`min-w-0 flex-1 truncate ${isThin ? "text-[11px] font-bold text-slate-800" : ""}`}
                      >
                        {tool.shortTitle}
                      </span>
                      {tool.popular ? <PopularBadge /> : null}
                    </button>
                  );
                }

                const href =
                  mode === "public"
                    ? homeToolHref(tool.id)
                    : studioToolHref(tool.id);

                return (
                  <Link
                    key={tool.id}
                    href={href}
                    onClick={onActivate}
                    aria-current={selected ? "page" : undefined}
                    className={className}
                  >
                    <ToolIcon tool={tool} thin={isThin} />
                    <span
                      className={`min-w-0 flex-1 truncate ${isThin ? "text-[11px] font-bold text-slate-800" : ""}`}
                    >
                      {tool.shortTitle}
                    </span>
                    {tool.popular ? <PopularBadge /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {groupedTools.length === 0 ? (
          <p className="px-0.5 text-xs font-semibold text-slate-400">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </nav>
    </>
  );
}

function ToolIcon({
  tool,
  thin,
}: {
  tool: (typeof planifyTools)[number];
  thin?: boolean;
}) {
  const size = thin ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl";
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${tool.accent} text-white shadow-sm ring-1 ring-white/80 transition group-hover:scale-105 ${size}`}
    >
      <PlanifyIcon name={tool.icon} className={thin ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

function PopularBadge() {
  return (
    <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[8px] font-black uppercase text-amber-800">
      ★
    </span>
  );
}
