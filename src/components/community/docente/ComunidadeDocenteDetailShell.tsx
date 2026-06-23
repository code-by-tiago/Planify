"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ComunidadeDocenteSidebar } from "@/components/community/docente/ComunidadeDocenteSidebar";
import { ComunidadeDocenteTopBar } from "@/components/community/docente/ComunidadeDocenteTopBar";
import { IconArrowRight } from "@/components/community/docente/docente-icons";
import { comunidadeRoutes, homeWithAba, readEmbedded, buscaHref } from "@/lib/community/docente-utils";
import type { DocenteDisciplina, DocenteMenuItem } from "@/lib/community/docente-types";
import { usePersistedSidebarCollapsed } from "@/hooks/usePersistedSidebarCollapsed";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ComunidadeDocenteDetailShellProps = {
  activeMenu?: DocenteMenuItem;
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  embedded?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function ComunidadeDocenteDetailShell({
  activeMenu = "inicio",
  breadcrumbs,
  title,
  subtitle,
  embedded = false,
  children,
  actions,
}: ComunidadeDocenteDetailShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = embedded || readEmbedded(searchParams);
  const homeHref = isEmbedded ? comunidadeRoutes.homeEmbedded : comunidadeRoutes.home;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState<DocenteDisciplina | null>(null);
  const { collapsed: communitySidebarCollapsed, toggle: toggleCommunitySidebarCollapsed } =
    usePersistedSidebarCollapsed("planify:community-sidebar-collapsed");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      router.push(buscaHref(value.trim(), isEmbedded));
    }
  };

  return (
    <div
      className={[
        "flex min-h-0 flex-col bg-[#f8fafc]",
        isEmbedded ? "h-full" : "min-h-[100dvh]",
      ].join(" ")}
    >
      <ComunidadeDocenteTopBar
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onCreatePost={() => router.push(homeHref)}
        onOpenMenu={() => setSidebarOpen(true)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          />
        ) : null}

        <ComunidadeDocenteSidebar
          activeItem={activeMenu}
          selectedDisciplina={selectedDisciplina}
          onSelectItem={(item) => {
            setSidebarOpen(false);
            if (item === "desafios") {
              router.push(isEmbedded ? comunidadeRoutes.desafiosEmbedded : comunidadeRoutes.desafios);
              return;
            }
            if (item === "professores") {
              router.push(isEmbedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca);
              return;
            }
            router.push(homeWithAba(item, isEmbedded));
          }}
          onSelectDisciplina={setSelectedDisciplina}
          onClose={() => setSidebarOpen(false)}
          collapsed={communitySidebarCollapsed}
          onToggleCollapsed={toggleCommunitySidebarCollapsed}
          className={[
            "fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link href={homeHref} className="transition hover:text-cyan-600">
                Comunidade
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  <IconArrowRight className="h-3 w-3" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-cyan-600">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-600">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-xs leading-snug text-slate-500">{subtitle}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
