"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSidebarSearchShortcut } from "@/hooks/useSidebarSearchShortcut";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LandingHomeLink } from "@/components/public/LandingHomeLink";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTipo, setActiveTipo] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useSidebarSearchShortcut(searchRef);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveTipo(new URLSearchParams(window.location.search).get("tipo"));
    }
  }, [pathname]);

  function isNavActive(href: string): boolean {
    if (active) return active === href;
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  const pageMeta = useMemo(() => {
    if (pathname === "/dashboard") {
      return { title: "Planify", subtitle: "Sua central de criação" };
    }
    if (pathname.startsWith("/materiais")) {
      return { title: "Materiais", subtitle: "Ferramentas com IA" };
    }
    if (pathname.startsWith("/planejamentos")) {
      return { title: "Planejamentos", subtitle: "BNCC + DOCX oficial" };
    }
    if (pathname.startsWith("/editor")) {
      return { title: "Editor", subtitle: "Finalize e exporte" };
    }
    if (pathname.startsWith("/historico")) {
      return { title: "Histórico", subtitle: "Tudo que você criou" };
    }
    if (pathname.startsWith("/biblioteca")) {
      return { title: "Biblioteca", subtitle: "Seus materiais salvos" };
    }
    if (pathname.startsWith("/marketplace")) {
      return { title: "Marketplace", subtitle: "Recursos da comunidade" };
    }
    return { title, subtitle };
  }, [pathname, title, subtitle]);

  const closeSidebar = () => setSidebarOpen(false);

  const primaryAction = (
    <Link
      href="/dashboard"
      onClick={closeSidebar}
      className="pl-teachy-cta w-full justify-center rounded-xl py-3 font-semibold"
    >
      <PlanifyIcon name="spark" className="h-4 w-4" />
      Início
    </Link>
  );

  return (
    <main className="planify-institutional planify-ui3 planify-teachy-app pl-shell-root pl-teachy-shell pl-app-bg flex h-[100dvh] w-full max-w-[100vw] overflow-hidden text-slate-950">
      <PlanifyShellSidebar
        variant="teachy"
        brandHref="/"
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <PlanifySidebarNav
          mode="routes"
          query={query}
          onQueryChange={setQuery}
          primaryAction={primaryAction}
          onActivate={closeSidebar}
          pathname={pathname}
          activeTipo={activeTipo}
          isNavActive={isNavActive}
          searchInputRef={searchRef}
        />
      </PlanifyShellSidebar>

      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <PlanifyIcon name="menu" className="h-5 w-5" />
            </button>
            {!compact ? (
              <div className="min-w-0 hidden sm:block">
                <h1 className="truncate text-lg font-black tracking-tight text-slate-950">
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
          <div className="flex items-center gap-2">
            {action}
            <LandingHomeLink compact />
            <Link
              href="/planos"
              className="pl-teachy-cta rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Planos
            </Link>
          </div>
        </header>

        <div
          key={pathname}
          className="pl-main-pane pl-fade-rise min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          {children}
        </div>
      </section>
    </main>
  );
}
