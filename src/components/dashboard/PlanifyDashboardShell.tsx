"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyDashboardMain } from "@/components/dashboard/PlanifyDashboardMain";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { LandingHomeLink } from "@/components/public/LandingHomeLink";
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
  const searchRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useSidebarSearchShortcut(searchRef);

  const closeSidebar = () => setSidebarOpen(false);

  const query = searchParams.get("q") ?? "";

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
    (sectionId: DashboardSectionId) => {
      replaceDashboardUrl((params) => {
        params.delete("tipo");
        params.set("secao", sectionId);
      });
    },
    [replaceDashboardUrl],
  );

  const selectTool = useCallback(
    (toolId: PlanifyToolId) => {
      replaceDashboardUrl((params) => {
        params.delete("secao");
        params.set("tipo", toolId);
      });
    },
    [replaceDashboardUrl],
  );

  const setQuery = useCallback(
    (value: string) => {
      replaceDashboardUrl((params) => {
        const term = value.trim();
        if (term) params.set("q", term);
        else params.delete("q");
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
  const hasPanel = Boolean(selectedToolId || selectedSectionId);

  const panelTitle = useMemo(() => {
    if (activeTool) return activeTool.title;
    if (selectedSectionId) return dashboardSectionLabels[selectedSectionId];
    return "Início";
  }, [activeTool, selectedSectionId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && hasPanel) {
        selectInicio();
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !hasPanel
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
  }, [hasPanel, selectInicio]);

  return (
    <div className="planify-hud planify-ui3 planify-hud-app pl-hud-shell pl-dashboard-root pl-app-bg flex h-[100dvh] w-full max-w-[100vw] overflow-hidden text-slate-950">
      <PlanifyShellSidebar
        variant="teachy"
        brandHref="/"
        lumiHint="Toque numa ferramenta e crie em segundos."
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <PlanifySidebarNav
          mode="studio"
          toolCardStyle="thin"
          query={query}
          onQueryChange={setQuery}
          selectedToolId={selectedToolId}
          selectedSectionId={selectedSectionId}
          onSelectTool={(id) => (id ? selectTool(id) : selectInicio())}
          onSelectSection={selectSection}
          onSelectInicio={selectInicio}
          onActivate={closeSidebar}
          pathname="/dashboard"
          searchInputRef={searchRef}
        />
      </PlanifyShellSidebar>

      <main className="pl-hud-main flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {hasPanel ? (
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-white px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <PlanifyIcon name="menu" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={selectInicio}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                aria-label="Voltar ao início"
              >
                <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  {selectedToolId ? "Ferramenta IA · BNCC" : "Página"}
                </p>
                <h1 className="truncate text-base font-black text-slate-950">
                  {panelTitle}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex">
                <LandingHomeLink compact />
              </span>
              <CreditsBalancePill />
              <Link
                href="/planos"
                className="pl-hud-btn rounded-full px-3 py-1.5 text-xs font-black text-slate-900 sm:px-4"
              >
                Planos
              </Link>
            </div>
          </header>
        ) : (
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-white px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <PlanifyIcon name="menu" className="h-5 w-5" />
              </button>
              <PlanifyBrand compact href="/" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex">
                <LandingHomeLink compact />
              </span>
              <CreditsBalancePill />
              <Link
                href="/planos"
                className="pl-hud-btn rounded-full px-3 py-1.5 text-xs font-black text-slate-900 sm:px-4"
              >
                Planos
              </Link>
            </div>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <PlanifyDashboardMain
            toolId={selectedToolId}
            sectionId={selectedSectionId}
            initialTopic={initialTopic}
            onTopicChange={setTopic}
            onSelectTool={selectTool}
            onSelectSection={selectSection}
            onClosePanel={selectInicio}
          />
        </div>
      </main>
    </div>
  );
}
