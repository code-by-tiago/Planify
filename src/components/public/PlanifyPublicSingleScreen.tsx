"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TeachyMateriaisStudio } from "@/components/dashboard/TeachyMateriaisStudio";
import { PlanifyDashboardWelcome } from "@/components/dashboard/PlanifyDashboardWelcome";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";
import {
  getPlanifyTool,
  planifyTools,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

function isValidToolId(value: string | null): value is PlanifyToolId {
  return planifyTools.some((tool) => tool.id === value);
}

function PublicScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const selectedToolId = useMemo(() => {
    const tipo = searchParams.get("tipo");
    return isValidToolId(tipo) ? tipo : null;
  }, [searchParams]);

  const initialTopic = useMemo(
    () => searchParams.get("tema")?.trim() ?? "",
    [searchParams],
  );

  const activeTool = selectedToolId ? getPlanifyTool(selectedToolId) : null;

  function closePanel() {
    router.replace("/", { scroll: false });
  }

  return (
    <div className="planify-ui3 planify-public pl-single-screen flex h-screen w-screen overflow-hidden bg-[#f8f5ff] text-slate-950">
      <PlanifyShellSidebar
        variant="hud"
        alwaysVisible
        showUserFooter={false}
        brandHref="/"
        lumiHint="Clique numa ferramenta para abrir no painel"
      >
        <PlanifySidebarNav
          mode="public"
          toolCardStyle="thin"
          query={query}
          onQueryChange={setQuery}
          pathname="/"
          activeTipo={selectedToolId}
        />
      </PlanifyShellSidebar>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-indigo-100/80 bg-white/95 px-4 py-2.5 sm:px-6">
          {selectedToolId ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                onClick={closePanel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                aria-label="Voltar ao início"
              >
                <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-indigo-500">
                  Ferramenta IA
                </p>
                <h1 className="truncate text-base font-black text-slate-950">
                  {activeTool?.title}
                </h1>
              </div>
            </div>
          ) : (
            <PlanifyBrand compact href="/" />
          )}
          <div className="flex items-center gap-2">
            <Link
              href="/planos"
              className="hidden rounded-lg px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-50 sm:inline-flex"
            >
              Planos
            </Link>
            <Link href="/login" className="pl-btn-secondary !px-4 !py-2 text-xs">
              Entrar
            </Link>
            <Link href="/dashboard" className="pl-btn-brand !px-4 !py-2 text-xs">
              Acessar painel
            </Link>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          {selectedToolId ? (
            <TeachyMateriaisStudio
              key={`${selectedToolId}-${initialTopic}`}
              toolId={selectedToolId}
              temaFromUrl={initialTopic}
              onClose={closePanel}
            />
          ) : (
            <PlanifyDashboardWelcome />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Landing em uma única tela: sidebar com ferramentas + área principal (sem scroll da página).
 */
export function PlanifyPublicSingleScreen() {
  return (
    <Suspense
      fallback={
        <div className="planify-ui3 flex h-screen w-screen items-center justify-center bg-[#f8f5ff]">
          <p className="text-sm font-bold text-indigo-600">Carregando…</p>
        </div>
      }
    >
      <PublicScreenContent />
    </Suspense>
  );
}

export default PlanifyPublicSingleScreen;
