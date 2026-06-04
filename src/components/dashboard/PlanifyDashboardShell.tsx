"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyDashboardMain } from "@/components/dashboard/PlanifyDashboardMain";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import { useSidebarSearchShortcut } from "@/hooks/useSidebarSearchShortcut";
import {
  dashboardSectionLabels,
  isDashboardSection,
  type DashboardSectionId,
} from "@/lib/pro/dashboardViews";
import {
  getPlanifyTool,
  planifyTools,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

function isValidToolId(value: string | null): value is PlanifyToolId {
  return planifyTools.some((tool) => tool.id === value);
}

function readTemaParam(searchParams: URLSearchParams): string {
  const fromUrl = searchParams.get("tema")?.trim() ?? "";
  if (fromUrl) return fromUrl;
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("planify-studio-tema")?.trim() ?? "";
  } catch {
    return "";
  }
}

export default function PlanifyDashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useSidebarSearchShortcut(searchRef);

  const selectedToolId = useMemo(() => {
    const tipo = searchParams.get("tipo");
    return isValidToolId(tipo) ? tipo : null;
  }, [searchParams]);

  const selectedSectionId = useMemo(() => {
    if (selectedToolId) return null;
    const secao = searchParams.get("secao");
    return isDashboardSection(secao) ? secao : null;
  }, [searchParams, selectedToolId]);

  const initialTopic = useMemo(
    () => readTemaParam(searchParams),
    [searchParams],
  );

  const replaceDashboardUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams],
  );

  const selectInicio = useCallback(() => {
    replaceDashboardUrl((params) => {
      params.delete("tipo");
      params.delete("secao");
    });
  }, [replaceDashboardUrl]);

  const selectSection = useCallback(
    (sectionId: DashboardSectionId | null) => {
      replaceDashboardUrl((params) => {
        params.delete("tipo");
        if (sectionId) {
          params.set("secao", sectionId);
        } else {
          params.delete("secao");
        }
      });
    },
    [replaceDashboardUrl],
  );

  const selectTool = useCallback(
    (toolId: PlanifyToolId | null) => {
      replaceDashboardUrl((params) => {
        params.delete("secao");
        if (toolId) {
          params.set("tipo", toolId);
        } else {
          params.delete("tipo");
        }
      });
    },
    [replaceDashboardUrl],
  );

  const setTopic = useCallback(
    (topic: string) => {
      const tema = topic.trim();
      if (tema) {
        try {
          sessionStorage.setItem("planify-studio-tema", tema);
        } catch {
          /* ignore */
        }
      }
      replaceDashboardUrl((params) => {
        if (tema) params.set("tema", tema);
        else params.delete("tema");
      });
    },
    [replaceDashboardUrl],
  );

  const activeTool = selectedToolId ? getPlanifyTool(selectedToolId) : null;

  const panelTitle = useMemo(() => {
    if (activeTool) return activeTool.title;
    if (selectedSectionId) return dashboardSectionLabels[selectedSectionId];
    return "Início";
  }, [activeTool, selectedSectionId]);

  const panelSubtitle = useMemo(() => {
    if (activeTool) return activeTool.shortTitle;
    if (selectedSectionId) return "Workspace";
    return "Painel Planify";
  }, [activeTool, selectedSectionId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && (selectedToolId || selectedSectionId)) {
        selectInicio();
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedToolId, selectedSectionId, selectInicio]);

  const primaryAction = (
    <button
      type="button"
      onClick={() => selectSection("planejamentos")}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-95"
    >
      <PlanifyIcon name="layers" className="h-4 w-4" />
      Construtor de aula
    </button>
  );

  return (
    <div className="planify-ui3 pl-dashboard-root pl-app-bg flex h-screen w-screen overflow-hidden text-slate-950">
      <PlanifyShellSidebar variant="teachy" alwaysVisible lumiHint="Menu fixo · / para buscar">
        <PlanifySidebarNav
          mode="studio"
          query={query}
          onQueryChange={setQuery}
          primaryAction={primaryAction}
          selectedToolId={selectedToolId}
          selectedSectionId={selectedSectionId}
          onSelectTool={selectTool}
          onSelectSection={selectSection}
          onSelectInicio={selectInicio}
          pathname="/dashboard"
          searchInputRef={searchRef}
        />
      </PlanifyShellSidebar>

      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f5ff]/80">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <nav
              aria-label="Localização"
              className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-400"
            >
              <button
                type="button"
                onClick={selectInicio}
                className="transition hover:text-indigo-600"
              >
                Início
              </button>
              {(selectedToolId || selectedSectionId) && (
                <>
                  <PlanifyIcon
                    name="chevronRight"
                    className="h-3 w-3 shrink-0 opacity-60"
                  />
                  <span className="text-indigo-600">{panelSubtitle}</span>
                </>
              )}
            </nav>
            <h1 className="truncate text-base font-black text-slate-950 sm:text-lg">
              {panelTitle}
            </h1>
          </div>

          <div className="hidden shrink-0 sm:block">
            <PlanifyBrand compact />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/planos"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-black text-white transition hover:opacity-95"
            >
              Planos
            </Link>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <PlanifyDashboardMain
            toolId={selectedToolId}
            sectionId={selectedSectionId}
            initialTopic={initialTopic}
            onTopicChange={setTopic}
            onOpenSection={selectSection}
            onCloseTool={selectInicio}
          />
        </div>
      </main>
    </div>
  );
}
