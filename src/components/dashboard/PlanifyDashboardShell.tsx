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
import { isToolCategoryId } from "@/lib/pro/teachyStudio";
import {
  getPlanifyTool,
  planifyTools,
  type PlanifyToolId,
  type ToolCategoryId,
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

  const initialCategory = useMemo((): ToolCategoryId => {
    const cat = searchParams.get("categoria");
    return isToolCategoryId(cat) ? cat : "todos";
  }, [searchParams]);

  const initialTopic = useMemo(
    () => searchParams.get("tema")?.trim() ?? "",
    [searchParams],
  );

  const setCategory = useCallback(
    (cat: ToolCategoryId) => {
      const params = new URLSearchParams();
      const tema = searchParams.get("tema");
      if (cat !== "todos") params.set("categoria", cat);
      if (tema?.trim()) params.set("tema", tema.trim());
      router.replace(
        params.toString() ? `/dashboard?${params.toString()}` : "/dashboard",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const selectTool = useCallback(
    (toolId: PlanifyToolId | null) => {
      const params = new URLSearchParams();
      const categoria = searchParams.get("categoria");
      let tema = searchParams.get("tema");
      if (!tema) {
        try {
          tema = sessionStorage.getItem("planify-studio-tema");
        } catch {
          /* ignore */
        }
      }
      if (categoria && isToolCategoryId(categoria)) {
        params.set("categoria", categoria);
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
      className="pl-btn-primary w-full justify-center rounded-2xl py-3"
    >
      <PlanifyIcon name="layers" className="h-4 w-4" />
      Construtor de aula
    </Link>
  );

  const sidebarNav = (
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
  );

  return (
    <main className="planify-ui3 pl-dashboard-root pl-teachy-shell flex h-screen w-screen overflow-hidden text-slate-950">
      <PlanifyShellSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        lumiHint="Assistente IA · pressione / para buscar ferramentas"
      >
        {sidebarNav}
      </PlanifyShellSidebar>

      <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <PlanifyIcon name="menu" className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              {selectedToolId ? (
                <nav
                  aria-label="Localização"
                  className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-400"
                >
                  <button
                    type="button"
                    onClick={() => selectTool(null)}
                    className="transition hover:text-indigo-600"
                  >
                    Assistente IA
                  </button>
                  <PlanifyIcon
                    name="chevronRight"
                    className="h-3 w-3 shrink-0 opacity-60"
                  />
                  <span className="text-indigo-600">
                    {activeTool?.shortTitle}
                  </span>
                </nav>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  Assistente IA para professoras
                </span>
              )}
              <h1 className="truncate text-lg font-black tracking-tight text-slate-950">
                {activeTool ? activeTool.title : "Materiais com IA"}
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                {activeTool
                  ? activeTool.description
                  : "BNCC · planejamento · criação · correção"}
              </p>
            </div>

            <div className="hidden shrink-0 lg:block">
              <PlanifyBrand compact />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/historico"
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-indigo-200 sm:inline-flex"
            >
              Histórico
            </Link>
            <Link
              href="/planos"
              className="rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
            >
              Planos
            </Link>
          </div>
        </header>

        <div
          key={selectedToolId ?? "home"}
          className="pl-main-pane pl-fade-rise min-h-0 flex-1 overflow-hidden"
        >
          {selectedToolId ? (
            <TeachyMateriaisStudio
              toolId={selectedToolId}
              temaFromUrl={initialTopic}
              onClose={() => selectTool(null)}
            />
          ) : (
            <TeachyStudioHome
              onSelectTool={selectTool}
              category={initialCategory}
              onCategoryChange={setCategory}
              initialTopic={initialTopic}
            />
          )}
        </div>
      </section>
    </main>
  );
}
