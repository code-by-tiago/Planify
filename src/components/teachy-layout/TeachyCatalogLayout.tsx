"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingFooter } from "@/components/public/landing-professor-primeiro/LandingFooter";
import { ppBtnPrimarySm } from "@/components/public/landing-professor-primeiro/theme";
import {
  planifyTools,
  toolCategories,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

type TeachyCatalogLayoutProps = {
  children?: ReactNode;
  /** When true, renders the full catalog grid (default for /ferramentas) */
  showCatalog?: boolean;
};

function CatalogToolCard({ tool }: { tool: (typeof planifyTools)[number] }) {
  return (
    <Link href={tool.href} className="pf-tool-card group ps-pro-tool-card">
      <span className={`ps-pro-tool-card-icon bg-gradient-to-br ${tool.accent}`}>
        <PlanifyIcon name={tool.icon} className="h-5 w-5" />
      </span>
      {tool.popular ? <span className="pf-tool-card-badge">Mais usado</span> : null}
      <span className="relative mt-4 text-lg font-extrabold text-slate-950">{tool.shortTitle}</span>
      <span className="relative mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
        {tool.description}
      </span>
      <span className="relative mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-cyan-700 opacity-80 transition group-hover:gap-1.5 group-hover:opacity-100">
        Acessar
        <PlanifyIcon name="arrowRight" className="h-3 w-3 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Public tools catalog — grouped by category, Teachy-style grid.
 */
export function TeachyCatalogLayout({
  children,
  showCatalog = true,
}: TeachyCatalogLayoutProps) {
  const categories = toolCategories.filter((c) => c.id !== "todos") as Array<{
    id: Exclude<ToolCategoryId, "todos">;
    label: string;
    icon: (typeof toolCategories)[number]["icon"];
  }>;

  return (
    <div className="pf-scope planify-hud planify-public flex min-h-screen flex-col bg-[var(--pf-canvas)]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
          <PlanifyBrand href="/" dark hideTagline />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-cyan-700 sm:px-4"
            >
              Entrar
            </Link>
            <Link href="/planos" className={ppBtnPrimarySm}>
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="pl-catalog-hero border-b bg-white px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <p className="pf-eyebrow">Catálogo Planify</p>
            <h1 className="pf-headline mt-3 max-w-4xl text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
              O cockpit de produção pedagógica para professores e escolas
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
              {planifyTools.length} ferramentas conectadas para transformar objetivos, temas e
              turmas em planejamentos, materiais, avaliações, correções e documentos editáveis.
            </p>
            <div className="pl-catalog-stat-row" aria-label="Resumo do catálogo">
              <span>
                <strong>{planifyTools.length}</strong>
                ferramentas com IA
              </span>
              <span>
                <strong>BNCC</strong>
                como base do fluxo
              </span>
              <span>
                <strong>Docs</strong>
                exportação editável
              </span>
            </div>
            <Link href="/login" className="pf-btn-primary mt-8 inline-flex">
              Começar grátis
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {showCatalog ? (
          <div className="pl-catalog-body mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
            {categories.map((cat) => {
              const tools = planifyTools.filter((t) => t.category === cat.id);
              if (tools.length === 0) return null;
              return (
                <section key={cat.id} className="pl-catalog-category mb-12 last:mb-0">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <PlanifyIcon name={cat.icon} className="h-5 w-5 text-cyan-600" />
                      <h2 className="text-xl font-extrabold text-slate-950">{cat.label}</h2>
                    </div>
                    <span>{tools.length} ferramentas</span>
                  </div>
                  <div className="pf-catalog-grid pl-hud-tools-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                      <CatalogToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {children}
      </main>

      <LandingFooter />
    </div>
  );
}

export default TeachyCatalogLayout;
