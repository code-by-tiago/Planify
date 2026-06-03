"use client";

import Link from "next/link";
import { useMemo, type ReactNode, type RefObject } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyNavIcon, studioToolHref } from "@/components/pro/PlanifyNavIcon";
import {
  appNavigation,
  planifyTools,
  toolCategories,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

export type SidebarNavMode = "studio" | "routes";

type PlanifySidebarNavProps = {
  mode: SidebarNavMode;
  query: string;
  onQueryChange: (value: string) => void;
  primaryAction?: ReactNode;
  onActivate?: () => void;
  /** Modo studio: ferramenta ativa no painel */
  selectedToolId?: PlanifyToolId | null;
  onSelectTool?: (toolId: PlanifyToolId | null) => void;
  /** Modo routes: destaque por pathname */
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

  function isToolSelected(toolId: string): boolean {
    if (mode === "studio") return selectedToolId === toolId;
    return (
      (pathname === "/dashboard" || pathname === "/materiais") &&
      activeTipo === toolId
    );
  }

  function navSelected(href: string): boolean {
    if (isNavActive) return isNavActive(href);
    if (href === "/dashboard") {
      return mode === "studio"
        ? pathname === "/dashboard" && !selectedToolId
        : pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <div className="shrink-0 px-4 pt-4">
        <div className="relative">
          <PlanifyIcon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300"
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar ferramenta… ( / )"
            aria-label="Buscar ferramenta"
            className="w-full rounded-2xl border border-rose-100/80 bg-white/90 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-violet-300 focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100"
          />
        </div>
        {primaryAction ? <div className="mt-3">{primaryAction}</div> : null}
      </div>

      <nav className="flex-1 space-y-5 px-4 py-4">
        <div>
          <p className="pl-cat-label px-1 text-[10px] font-black uppercase tracking-[0.2em]">
            Workspace
          </p>
          <div className="mt-2 space-y-1">
            {appNavigation.map((item) => {
              const selected = navSelected(item.href);
              const isStudioHome = item.href === "/dashboard" && mode === "studio";

              if (isStudioHome && onSelectTool) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      onSelectTool(null);
                      onActivate?.();
                    }}
                    aria-current={selected ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-sm font-bold transition ${
                      selected
                        ? "pl-nav-active shadow-md"
                        : "text-violet-700/90 hover:bg-white/70 hover:text-violet-950"
                    }`}
                  >
                    <PlanifyNavIcon name={item.icon} />
                    <span className="truncate">
                      {item.href === "/dashboard" ? "Assistente IA" : item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onActivate}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm font-bold transition ${
                    selected
                      ? "pl-nav-active shadow-md"
                      : "text-violet-700/90 hover:bg-white/70 hover:text-violet-950"
                  }`}
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
            <p className="pl-cat-label px-1 text-[10px] font-black uppercase tracking-[0.2em]">
              {group.category.label}
            </p>
            <div className="mt-2 space-y-0.5">
              {group.tools.map((tool) => {
                const selected = isToolSelected(tool.id);
                const className = `pl-tool-item group flex w-full items-center gap-2.5 rounded-2xl border px-2 py-1.5 text-left text-sm font-bold transition ${
                  selected
                    ? "border-fuchsia-200/80 bg-white shadow-[0_6px_20px_-10px_rgba(236,72,153,0.35)]"
                    : "border-transparent text-violet-700/85"
                }`;

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
                      <ToolIcon tool={tool} />
                      <span className="min-w-0 truncate">{tool.shortTitle}</span>
                      {tool.popular ? <PopularBadge /> : null}
                    </button>
                  );
                }

                return (
                  <Link
                    key={tool.id}
                    href={studioToolHref(tool.id)}
                    onClick={onActivate}
                    aria-current={selected ? "page" : undefined}
                    className={className}
                  >
                    <ToolIcon tool={tool} />
                    <span className="min-w-0 truncate">{tool.shortTitle}</span>
                    {tool.popular ? <PopularBadge /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {groupedTools.length === 0 ? (
          <p className="px-1 text-sm font-semibold text-violet-300">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </nav>
    </>
  );
}

function ToolIcon({
  tool,
}: {
  tool: (typeof planifyTools)[number];
}) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-[0_4px_10px_-4px_rgba(139,92,246,0.4)] ring-2 ring-white/70 transition group-hover:scale-105`}
    >
      <PlanifyIcon name={tool.icon} className="h-4 w-4" />
    </span>
  );
}

function PopularBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-100 to-orange-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-700">
      ✦
    </span>
  );
}
