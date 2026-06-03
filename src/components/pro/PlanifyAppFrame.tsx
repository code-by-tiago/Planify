"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { type ReactNode } from "react";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { appNavigation } from "@/lib/pro/planifyTools";

type FrameProps = {
  children: ReactNode;
  /**
   * Sobrescreve a detecção automática de rota ativa.
   * Deixar vazio para usar usePathname() (recomendado).
   */
  active?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  /**
   * Modo compacto: omite o header com título/subtítulo.
   * Útil para páginas que têm seu próprio cabeçalho interno.
   */
  compact?: boolean;
};

export default function PlanifyAppFrame({
  children,
  active,
  title = "Planify Studio",
  subtitle = "Central de criação pedagógica",
  action,
  compact = false,
}: FrameProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string): boolean {
    if (active) return active === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navItems = (
    <nav className="mt-7 space-y-1">
      {appNavigation.map((item) => {
        const selected = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
              selected
                ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <PlanifyIcon name={item.icon} className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        {/* Sidebar — desktop (sempre visível) */}
        <aside className="hidden border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:flex-col">
          <PlanifyBrand />
          {navItems}
          <div className="mt-auto pt-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Planify Studio</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Ferramentas organizadas para professores.
              </p>
            </div>
          </div>
        </aside>

        {/* Sidebar — mobile (drawer deslizante) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl transition-transform duration-300 lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <PlanifyBrand />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100"
            >
              <PlanifyIcon name="close" className="h-5 w-5" />
            </button>
          </div>
          {navItems}
          <div className="mt-auto pt-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Planify Studio</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Ferramentas organizadas para professores.
              </p>
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <section className="flex min-w-0 flex-col">
          {compact ? (
            /* Header mínimo — só aparece no mobile (o sidebar resolve o desktop) */
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menu"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
                >
                  <PlanifyIcon name="menu" className="h-5 w-5" />
                </button>
                <PlanifyBrand compact />
              </div>
            </header>
          ) : (
            /* Header completo com título/subtítulo/ação */
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menu"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
                  >
                    <PlanifyIcon name="menu" className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {title}
                    </h1>
                    <p className="truncate text-sm font-semibold text-slate-500">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action}
                  <Link
                    href="/planos"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
                  >
                    Planos
                  </Link>
                </div>
              </div>
            </header>
          )}

          {children}
        </section>
      </div>
    </main>
  );
}
