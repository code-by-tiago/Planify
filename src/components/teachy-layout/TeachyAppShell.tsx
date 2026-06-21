"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { LandingHomeLink } from "@/components/public/LandingHomeLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";
import {
  setHistorySupabaseSync,
  syncLocalHistoryToSupabase,
} from "@/lib/history/history-storage";

export type TeachyAppShellProps = {
  children: ReactNode;
  /** Panel mode: show back header with title */
  panelMode?: boolean;
  panelTitle?: string;
  panelSubtitle?: string | null;
  panelEyebrow?: string;
  onBack?: () => void;
  onOpenSidebar?: () => void;
  headerExtra?: ReactNode;
  /** Dashboard studio mode vs route-based nav */
  navMode?: "studio" | "routes";
  selectedToolId?: string | null;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  primaryAction?: ReactNode;
  activeTipo?: string | null;
  isNavActive?: (href: string) => boolean;
  quickNav?: ReactNode;
  className?: string;
};

/**
 * Logged app shell — sidebar + header + main canvas.
 * Patterns from PlanifyDashboardShell + PlanifyAppFrame.
 */
export function TeachyAppShell({
  children,
  panelMode = false,
  panelTitle = "Planify",
  panelSubtitle = null,
  panelEyebrow,
  onBack,
  headerExtra,
  navMode = "routes",
  selectedToolId = null,
  selectedSectionId = null,
  onSelectSection,
  primaryAction,
  activeTipo = null,
  isNavActive,
  quickNav,
  className = "",
}: TeachyAppShellProps) {
  const pathname = usePathname();
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

  const defaultPrimaryAction = useMemo(() => {
    if (primaryAction) return primaryAction;
    if (access.isManagerView && !access.isSiteAdmin) {
      return (
        <Link
          href="/gestor"
          onClick={closeSidebar}
          className="pl-hud-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold"
        >
          <PlanifyIcon name="home" className="h-4 w-4" />
          {!sidebarCollapsed ? "Início" : null}
        </Link>
      );
    }
    return (
      <Link
        href="/dashboard"
        onClick={closeSidebar}
        className="pl-hud-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold"
      >
        <PlanifyIcon name="spark" className="h-4 w-4" />
        {!sidebarCollapsed ? "Início" : null}
      </Link>
    );
  }, [access.isManagerView, access.isSiteAdmin, primaryAction, sidebarCollapsed]);

  return (
    <div
      className={`pf-scope pf-ecosystem-scope pf-app-shell planify-hud planify-ui3 planify-hud-app pl-hud-shell pl-dashboard-root pl-app-bg text-slate-950 ${className}`}
      data-embedded={panelMode ? "true" : undefined}
    >
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
          mode={navMode}
          primaryAction={defaultPrimaryAction}
          selectedToolId={selectedToolId as Parameters<typeof PlanifySidebarNav>[0]["selectedToolId"]}
          selectedSectionId={selectedSectionId as Parameters<typeof PlanifySidebarNav>[0]["selectedSectionId"]}
          onSelectSection={onSelectSection as Parameters<typeof PlanifySidebarNav>[0]["onSelectSection"]}
          onActivate={closeSidebar}
          pathname={pathname}
          activeTipo={activeTipo}
          isNavActive={isNavActive}
          canViewBnccProgress={access.canViewBnccProgress}
          canViewDirectorPanel={access.canViewDirectorPanel}
          isManagerView={access.isManagerView}
          collapsed={sidebarCollapsed}
        />
      </PlanifyShellSidebar>

      <section className="pf-app-main pl-hud-main bg-[var(--pf-canvas)]">
        <header
          className={`ps-pro-header flex shrink-0 flex-col gap-2 border-b px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5 ${
            panelMode ? "" : "pl-hud-hub-shell-header relative overflow-hidden border-b py-3 sm:py-4"
          }`}
        >
          {!panelMode ? (
            <>
              <div className="pl-hud-hub-mesh pointer-events-none absolute inset-0 opacity-40" aria-hidden />
              <div className="pl-hud-hub-grid-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden />
            </>
          ) : null}
          <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80 lg:hidden"
              >
                <PlanifyIcon name="menu" className="h-5 w-5" />
              </button>
              {panelMode && onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80"
                  aria-label="Voltar ao início"
                >
                  <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
                </button>
              ) : null}
              <div className="min-w-0">
                <p className="pf-eyebrow text-[10px]">
                  {panelEyebrow ?? (panelMode ? "Espaço de trabalho" : "Estúdio Planify")}
                </p>
                <h1 className="pf-headline truncate text-base font-extrabold sm:text-lg">
                  {panelMode ? panelTitle : "O que vamos criar hoje?"}
                </h1>
                {panelSubtitle ? (
                  <p className="truncate text-xs font-medium text-slate-500">{panelSubtitle}</p>
                ) : !panelMode ? (
                  <p className="hidden text-xs font-medium text-slate-500 sm:block">
                    Ferramentas IA · BNCC · Google Docs · Comunidade
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {headerExtra}
              <span className="hidden sm:inline-flex">
                <LandingHomeLink compact />
              </span>
              <CreditsBalancePill />
              {!access.isManagerView ? (
                <Link
                  href="/planos"
                  className="pl-hud-btn inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-semibold sm:min-h-0 sm:px-4 sm:py-1.5"
                >
                  Planos
                </Link>
              ) : null}
            </div>
          </div>
          {quickNav}
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </section>
    </div>
  );
}

export default TeachyAppShell;
