"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import TeachyStudioHome from "@/components/dashboard/TeachyStudioHome";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import { useSidebarSearchShortcut } from "@/hooks/useSidebarSearchShortcut";
import {
  getPlanifyTool,
  planifyTools,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

function isValidToolId(value: string | null): value is PlanifyToolId {
  return planifyTools.some((tool) => tool.id === value);
}

export default function PlanifyDashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useSidebarSearchShortcut(searchRef);

  const selectedToolId = useMemo(() => {
    const tipo = searchParams.get("tipo");
    return isValidToolId(tipo) ? tipo : null;
  }, [searchParams]);

  const initialTopic = useMemo(
    () => searchParams.get("tema")?.trim() ?? "",
    [searchParams],
  );

  const selectTool = useCallback(
    (toolId: PlanifyToolId | null) => {
      const params = new URLSearchParams();
      let tema = searchParams.get("tema");
      if (!tema) {
        try {
          tema = sessionStorage.getItem("planify-studio-tema");
        } catch {
          /* ignore */
        }
      }
      if (tema?.trim()) params.set("tema", tema.trim());

      if (toolId) {
        params.set("tipo", toolId);
        router.replace(`/dashboard?${params.toString()}`, { scroll: false });
        return;
      }
      router.replace(
        params.toString() ? `/dashboard?${params.toString()}` : "/dashboard",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const activeTool = selectedToolId ? getPlanifyTool(selectedToolId) : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedToolId) {
        selectTool(null);
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
        setSidebarOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedToolId, selectTool]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const primaryAction = (
    <Link
      href={
        initialTopic
          ? `/planejamentos?tema=${encodeURIComponent(initialTopic)}`
          : "/planejamentos"
      }
      onClick={closeSidebar}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
    >
      <PlanifyIcon name="layers" className="h-4 w-4" />
      Construtor de aula
    </Link>
  );

  return (
    /* Container pai: flex lado a lado, 100% da tela, sem scroll da página */
    <div className="planify-ui3 pl-dashboard-root flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-950">
      <PlanifyShellSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        variant="teachy"
        lumiHint="Ferramentas na barra lateral · / para buscar"
      >
        <PlanifySidebarNav
          mode="studio"
          query={query}
          onQueryChange={setQuery}
          primaryAction={primaryAction}
          selectedToolId={selectedToolId}
          onSelectTool={selectTool}
          onActivate={closeSidebar}
          pathname="/dashboard"
          searchInputRef={searchRef}
        />
      </PlanifyShellSidebar>

      {/* Área principal: flex-1, h-screen, overflow-hidden */}
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f0f2f8]">
        {selectedToolId ? (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu de ferramentas"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <PlanifyIcon name="menu" className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <nav
                  aria-label="Localização"
                  className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-400"
                >
                  <button
                    type="button"
                    onClick={() => selectTool(null)}
                    className="transition hover:text-indigo-600"
                  >
                    Início
                  </button>
                  <PlanifyIcon
                    name="chevronRight"
                    className="h-3 w-3 shrink-0 opacity-60"
                  />
                  <span className="text-indigo-600">
                    {activeTool?.shortTitle}
                  </span>
                </nav>
                <h1 className="truncate text-base font-black text-slate-950">
                  {activeTool?.title}
                </h1>
              </div>

              <div className="hidden shrink-0 sm:block">
                <PlanifyBrand compact />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/historico"
                className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-indigo-200 sm:inline-flex"
              >
                Histórico
              </Link>
              <Link
                href="/planos"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-indigo-700"
              >
                Planos
              </Link>
            </div>
          </header>
        ) : (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-4 py-2 sm:px-5 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <PlanifyIcon name="menu" className="h-5 w-5" />
            </button>
            <PlanifyBrand compact />
            <Link
              href="/planos"
              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-black text-white"
            >
              Planos
            </Link>
          </div>
        )}

        {/* Quadrante: home estilo Teachy ou ferramenta in-panel */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {selectedToolId ? (
            <TeachyMateriaisStudio
              toolId={selectedToolId}
              temaFromUrl={initialTopic}
              onClose={() => selectTool(null)}
            />
          ) : (
            <TeachyStudioHome
              onSelectTool={selectTool}
              initialTopic={initialTopic}
            />
          )}
        </div>
      </main>
    </div>
  );
}
