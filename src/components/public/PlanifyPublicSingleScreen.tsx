"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyDashboardWelcome } from "@/components/dashboard/PlanifyDashboardWelcome";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyShellSidebar } from "@/components/pro/PlanifyShellSidebar";
import { PlanifySidebarNav } from "@/components/pro/PlanifySidebarNav";

/**
 * Landing em uma única tela: sidebar com ferramentas + área principal (sem scroll da página).
 */
export function PlanifyPublicSingleScreen() {
  const [query, setQuery] = useState("");

  return (
    <div className="planify-ui3 planify-public pl-single-screen flex h-screen w-screen overflow-hidden bg-[#f8f5ff] text-slate-950">
      <PlanifyShellSidebar
        variant="teachy"
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
        />
      </PlanifyShellSidebar>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-indigo-100/80 bg-white/95 px-4 py-2.5 sm:px-6">
          <PlanifyBrand compact href="/" />
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
          <PlanifyDashboardWelcome />
        </div>
      </div>
    </div>
  );
}

export default PlanifyPublicSingleScreen;
