"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyDashboardMain } from "@/components/dashboard/PlanifyDashboardMain";
import { PlanifyQuickNav } from "@/components/dashboard/PlanifyQuickNav";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { LandingHomeLink } from "@/components/public/LandingHomeLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import {
  dashboardSectionLabels,
  isDashboardSection,
  type DashboardSectionId,
} from "@/lib/pro/dashboardViews";
import { sectionHasOwnLayout } from "@/lib/pro/dashboardNav";
import {
  getPlanifyTool,
  planifyToolCount,
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";
import { setHistorySupabaseSync, syncLocalHistoryToSupabase } from "@/lib/history/history-storage";

function isValidToolId(value: string | null): value is PlanifyToolId {
  return planifyTools.some((tool) => tool.id === value);
}

function isValidCategory(value: string | null): value is ToolCategoryId {
  return toolCategories.some((c) => c.id === value);
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
  const access = usePlanifyAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebarCollapsed } =
    usePersistedSidebarCollapsed("planify:sidebar-collapsed");

  useEffect(() => {
    if (!access.loading && access.authenticated) {
      setHistorySupabaseSync(true);
      void syncLocalHistoryToSupabase();
    }
  }, [access.authenticated, access.loading]);

  const closeSidebar = () => setSidebarOpen(false);

  const selectedToolId = useMemo(() => {
    const tipo = searchParams.get("tipo");
    return isValidToolId(tipo) ? tipo : null;
  }, [searchParams]);

  const selectedSectionId = useMemo(() => {
    if (selectedToolId) return null;
    const secao = searchParams.get("secao");
    return isDashboardSection(secao) ? secao : null;
  }, [searchParams, selectedToolId]);

  useEffect(() => {
    if (searchParams.get("secao") !== "banco-questoes") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("secao");
    params.set("tipo", "prova");
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const activeCategory = useMemo(() => {
    const cat = searchParams.get("categoria");
    return isValidCategory(cat) ? cat : null;
  }, [searchParams]);

  const initialTopic = useMemo(
    () => readTemaParam(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (access.loading || !access.authenticated) return;
    if (access.isSiteAdmin) return;
    if (!access.isManagerView || !access.canViewDirectorPanel) return;
    if (selectedToolId || selectedSectionId) return;

    router.replace("/gestor");
  }, [
    access.authenticated,
    access.canViewDirectorPanel,
    access.isManagerView,
    access.isSiteAdmin,
    access.loading,
    router,
    selectedSectionId,
    selectedToolId,
  ]);

  const replaceDashboardUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams],
  );

  const selectCategory = useCallback(
    (categoryId: ToolCategoryId) => {
      replaceDashboardUrl((params) => {
        params.delete("tipo");
        params.delete("secao");
        if (categoryId === "todos") params.delete("categoria");
        else params.set("categoria", categoryId);
      });
    },
    [replaceDashboardUrl],
  );

  const selectInicio = useCallback(() => {
    replaceDashboardUrl((params) => {
      params.delete("tipo");
      params.delete("secao");
      params.delete("categoria");
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
  /** Ferramentas e hubs com layout próprio — evita header duplicado com o sidebar. */
  const panelHasOwnHeader =
    Boolean(selectedToolId) || sectionHasOwnLayout(selectedSectionId);

  const panelTitle = useMemo(() => {
    if (activeTool) return activeTool.title;
    if (selectedSectionId === "planejamentos") {
      return "BNCC → IA → Google Docs oficial";
    }
    if (selectedSectionId) return dashboardSectionLabels[selectedSectionId];
    return "Início";
  }, [activeTool, selectedSectionId]);

  const panelSubtitle = useMemo(() => {
    if (activeTool) return activeTool.description;
    if (selectedSectionId === "planejamentos") {
      return "Sugira habilidades por conteúdo, gere a matriz pedagógica com IA e exporte com os modelos oficiais.";
    }
    return null;
  }, [activeTool, selectedSectionId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && hasPanel) {
        selectInicio();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasPanel, selectInicio]);

  const primaryAction =
    access.isManagerView && !access.isSiteAdmin ? (
    <Link
      href="/gestor"
      onClick={closeSidebar}
      title="Início"
      className={[
        "pl-hud-btn flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold",
        sidebarCollapsed ? "w-full px-0" : "w-full",
      ].join(" ")}
    >
      <PlanifyIcon name="home" className="h-4 w-4" />
      {!sidebarCollapsed ? "Início" : null}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => {
        selectInicio();
        closeSidebar();
      }}
      title="Início"
      className={[
        "pl-hud-btn flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold",
        sidebarCollapsed ? "w-full px-0" : "w-full",
      ].join(" ")}
    >
      <PlanifyIcon name="home" className="h-4 w-4" />
      {!sidebarCollapsed ? "Início" : null}
    </button>
  );

  return (
    <div className="pf-ecosystem-scope planify-hud planify-ui3 planify-hud-app pl-hud-shell pl-dashboard-root pl-app-bg flex h-[100dvh] w-full max-w-[100vw] overflow-hidden text-slate-950">
      <PlanifyShellSidebar
        variant="hud"
        brandHref="/"
        lumiHint="Toque numa ferramenta e crie em segundos."
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        collapsible
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      >
        <PlanifySidebarNav
          mode="studio"
          primaryAction={primaryAction}
          selectedToolId={selectedToolId}
          selectedSectionId={selectedSectionId}
          onSelectTool={selectTool}
          onSelectSection={selectSection}
          onSelectInicio={selectInicio}
          activeCategory={activeCategory}
          onSelectCategory={selectCategory}
          onActivate={closeSidebar}
          pathname="/dashboard"
          canViewBnccProgress={access.canViewBnccProgress}
          canViewDirectorPanel={access.canViewDirectorPanel}
          isManagerView={access.isManagerView}
          isSiteAdmin={access.isSiteAdmin}
          collapsed={sidebarCollapsed}
        />
      </PlanifyShellSidebar>

      <main className="pl-hud-main flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--ps-pro-canvas)]">
        {hasPanel && !panelHasOwnHeader ? (
          <header className="ps-pro-header flex shrink-0 flex-col gap-2 border-b px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80 lg:hidden"
                >
                  <PlanifyIcon name="menu" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={selectInicio}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80"
                  aria-label="Voltar ao início"
                >
                  <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
                </button>
                {activeTool ? (
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${activeTool.accent} text-white shadow-sm`}
                  >
                    <PlanifyIcon name={activeTool.icon} className="h-5 w-5" />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">
                    {selectedToolId ? "Ferramenta IA · BNCC" : "Espaço de trabalho"}
                  </p>
                  <h1 className="truncate text-base font-extrabold text-slate-950 sm:text-lg">
                    {panelTitle}
                  </h1>
                  {panelSubtitle ? (
                    <p className="truncate text-xs font-medium text-slate-500">
                      {panelSubtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
                <span className="hidden sm:inline-flex">
                  <LandingHomeLink compact />
                </span>
                <CreditsBalancePill />
                <Link
                  href="/planos"
                  className="pl-hud-btn inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-4 sm:py-1.5"
                >
                  Planos
                </Link>
              </div>
            </div>
            <PlanifyQuickNav
              activeTool={Boolean(selectedToolId)}
              activeSection={selectedSectionId}
              onSelectInicio={selectInicio}
              onSelectSection={selectSection}
            />
          </header>
        ) : !hasPanel ? (
          <header className="pf-studio-header shrink-0 border-b border-[var(--pf-border)] bg-white/95 px-3 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-sm sm:px-5 sm:py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--pf-border)] bg-white text-slate-600 transition hover:border-[var(--pf-border-strong)] lg:hidden"
                >
                  <PlanifyIcon name="menu" className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="pf-eyebrow">Centro operacional</p>
                  <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">
                    Planeje · Crie · Revise · Compartilhe
                  </h1>
                  <p className="hidden text-xs font-medium text-slate-500 sm:block">
                    {planifyToolCount} geradores · BNCC · Google Docs · Classroom
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline-flex">
                  <LandingHomeLink compact />
                </span>
                <CreditsBalancePill />
                <Link
                  href="/planos"
                  className="pf-btn-secondary min-h-11 px-3 py-2 text-xs sm:min-h-0 sm:px-4"
                >
                  Planos
                </Link>
              </div>
            </div>
          </header>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden">
          <PlanifyDashboardMain
            toolId={selectedToolId}
            sectionId={selectedSectionId}
            initialTopic={initialTopic}
            initialCategory={activeCategory}
            onTopicChange={setTopic}
            onSelectTool={selectTool}
            onSelectSection={selectSection}
            onSelectCategory={selectCategory}
            onClosePanel={selectInicio}
          />
        </div>
      </main>
    </div>
  );
}
