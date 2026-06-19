"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LandingHomeLink } from "@/components/public/LandingHomeLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import {
  setHistorySupabaseSync,
  syncLocalHistoryToSupabase,
} from "@/lib/history/history-storage";

type FrameProps = {
  children: ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
};

export default function PlanifyAppFrame({
  children,
  active,
  title = "Planify",
  subtitle = "Central de criação pedagógica",
  action,
  compact = false,
}: FrameProps) {
  const pathname = usePathname();
  const access = usePlanifyAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTipo, setActiveTipo] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCurrentSearch(window.location.search);
    setActiveTipo(new URLSearchParams(window.location.search).get("tipo"));
  }, [pathname]);

  useEffect(() => {
    if (!access.loading && access.authenticated) {
      setHistorySupabaseSync(true);
      void syncLocalHistoryToSupabase();
    }
  }, [access.authenticated, access.loading]);

  function isNavActive(href: string): boolean {
    if (active) return active === href;
    const [path, query] = href.split("?");
    const currentPath = pathname.split("?")[0];

    if (query && path === currentPath) {
      const expected = new URLSearchParams(query);
      const current = new URLSearchParams(currentSearch);
      for (const [key, value] of expected.entries()) {
        if (current.get(key) !== value) return false;
      }
      return true;
    }

    if (path === "/gestor") {
      return currentPath === "/gestor";
    }

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return currentPath === path || currentPath.startsWith(`${path}/`);
  }

  const pageMeta = useMemo(() => {
    if (pathname === "/dashboard") {
      return { title: "Planify", subtitle: "Sua central de criação" };
    }
    if (pathname.startsWith("/materiais")) {
      return { title: "Materiais", subtitle: "Ferramentas com IA" };
    }
    if (pathname.startsWith("/planejamentos")) {
      return { title: "Planejamentos", subtitle: "BNCC + Google Docs oficial" };
    }
    if (pathname.startsWith("/editor")) {
      return { title: "Editor", subtitle: "Finalize e exporte" };
    }
    if (pathname.startsWith("/historico")) {
      return { title: "Meus materiais", subtitle: "Tudo que você gerou" };
    }
    if (pathname.startsWith("/biblioteca")) {
      return { title: "Biblioteca", subtitle: "Seus materiais salvos" };
    }
    if (pathname.startsWith("/marketplace")) {
      return { title: "Comunidade", subtitle: "Materiais compartilhados por professores" };
    }
    if (pathname.startsWith("/comunidade")) {
      return { title: "Comunidade Docente", subtitle: "Conecte-se com professores de todo o Brasil" };
    }
    if (pathname.startsWith("/diretor") || pathname.startsWith("/gestor")) {
      return { title: "Painel do Gestor", subtitle: "Turmas, professores e BNCC" };
    }
    return { title, subtitle };
  }, [pathname, title, subtitle]);

  const closeSidebar = () => setSidebarOpen(false);

  const primaryAction = access.isManagerView ? (
    <Link
      href="/gestor"
      onClick={closeSidebar}
      className="pl-hud-btn w-full justify-center rounded-xl py-3 font-semibold"
    >
      <PlanifyIcon name="spark" className="h-4 w-4" />
      Início
    </Link>
  ) : (
    <Link
      href="/dashboard"
      onClick={closeSidebar}
      className="pl-hud-btn w-full justify-center rounded-xl py-3 font-semibold"
    >
      <PlanifyIcon name="spark" className="h-4 w-4" />
      Início
    </Link>
  );

  return (
    <main className="planify-hud planify-ui3 planify-hud-app pl-shell-root pl-hud-shell pl-app-bg flex h-[100dvh] w-full max-w-[100vw] overflow-hidden text-slate-950">
      <PlanifyShellSidebar
        variant="hud"
        brandHref="/"
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <PlanifySidebarNav
          mode="routes"
          primaryAction={primaryAction}
          onActivate={closeSidebar}
          pathname={pathname}
          activeTipo={activeTipo}
          isNavActive={isNavActive}
          canViewBnccProgress={access.canViewBnccProgress}
          canViewDirectorPanel={access.canViewDirectorPanel}
          isManagerView={access.isManagerView}
        />
      </PlanifyShellSidebar>

      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--ps-pro-canvas)]">
        <header className="ps-pro-header flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/80 lg:hidden"
            >
              <PlanifyIcon name="menu" className="h-5 w-5" />
            </button>
            {!compact ? (
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">
                  Estúdio Planify
                </p>
                <h1 className="truncate text-sm font-black tracking-tight text-slate-950 sm:text-lg">
                  {pageMeta.title}
                </h1>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {pageMeta.subtitle}
                </p>
              </div>
            ) : (
              <div className="min-w-0 lg:hidden">
                <PlanifyBrand compact href="/" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {action}
            <LandingHomeLink compact />
            {!access.isManagerView ? (
              <Link
                href="/planos"
                className="pl-hud-btn rounded-xl px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2"
              >
                Planos
              </Link>
            ) : null}
          </div>
        </header>

        <div
          key={pathname}
          className="planify-studio-pro ps-pro-shell pl-main-pane pl-fade-rise min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {children}
        </div>
      </section>
    </main>
  );
}
