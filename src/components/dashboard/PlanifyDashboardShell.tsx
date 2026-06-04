"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyDashboardMain } from "@/components/dashboard/PlanifyDashboardMain";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import { useSidebarSearchShortcut } from "@/hooks/useSidebarSearchShortcut";
import { isDashboardSection } from "@/lib/pro/dashboardViews";
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

/** Rotas antigas ?secao= → ferramenta equivalente no painel único */
const sectionToTool: Partial<Record<string, PlanifyToolId>> = {
  planejamentos: "plano-aula",
};

export default function PlanifyDashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  useSidebarSearchShortcut(searchRef);

  const query = searchParams.get("q") ?? "";

  const selectedToolId = useMemo(() => {
    const tipo = searchParams.get("tipo");
    return isValidToolId(tipo) ? tipo : null;
  }, [searchParams]);

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

  /** Converte ?secao= legado em ?tipo= e remove secao */
  useEffect(() => {
    const secao = searchParams.get("secao");
    if (!secao || !isDashboardSection(secao) || selectedToolId) return;

    const mapped = sectionToTool[secao];
    replaceDashboardUrl((params) => {
      params.delete("secao");
      if (mapped) params.set("tipo", mapped);
    });
  }, [searchParams, selectedToolId, replaceDashboardUrl]);

  const selectInicio = useCallback(() => {
    replaceDashboardUrl((params) => {
      params.delete("tipo");
      params.delete("secao");
    });
  }, [replaceDashboardUrl]);

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedToolId) {
        selectInicio();
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !selectedToolId
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
  }, [selectedToolId, selectInicio]);

  return (
    <div className="planify-ui3 pl-dashboard-root pl-app-bg flex h-screen w-screen overflow-hidden text-slate-950">
      <PlanifyShellSidebar variant="teachy" alwaysVisible lumiHint="Início e ferramentas no painel">
        <PlanifySidebarNav
          mode="studio"
          hideToolList
          query={query}
          onQueryChange={setQuery}
          selectedToolId={selectedToolId}
          onSelectTool={selectTool}
          onSelectInicio={selectInicio}
          pathname="/dashboard"
          searchInputRef={searchRef}
        />
      </PlanifyShellSidebar>

      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {selectedToolId ? (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={selectInicio}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                aria-label="Voltar às ferramentas"
              >
                <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400">
                  Ferramenta
                </p>
                <h1 className="truncate text-base font-black text-slate-950">
                  {activeTool?.title}
                </h1>
              </div>
            </div>
            <div className="hidden shrink-0 sm:block">
              <PlanifyBrand compact />
            </div>
            <Link
              href="/planos"
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-700"
            >
              Planos
            </Link>
          </header>
        ) : (
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 sm:px-5">
            <PlanifyBrand compact />
            <Link
              href="/planos"
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-700"
            >
              Planos
            </Link>
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <PlanifyDashboardMain
            toolId={selectedToolId}
            query={query}
            onQueryChange={setQuery}
            initialTopic={initialTopic}
            onTopicChange={setTopic}
            onSelectTool={(id) => selectTool(id)}
            onCloseTool={selectInicio}
            searchInputRef={searchRef}
          />
        </div>
      </main>
    </div>
  );
}
