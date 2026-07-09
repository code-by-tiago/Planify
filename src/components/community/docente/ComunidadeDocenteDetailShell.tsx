"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ComunidadeDocenteTopBar } from "@/components/community/docente/ComunidadeDocenteTopBar";
import { IconArrowRight } from "@/components/community/docente/docente-icons";
import { comunidadeRoutes, homeWithAba, readEmbedded, buscaHref } from "@/lib/community/docente-utils";
import type { DocenteMenuItem } from "@/lib/community/docente-types";

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
  /** Material/document views need full width for readable previews. */
  wide?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function ComunidadeDocenteDetailShell({
  activeMenu = "inicio",
  breadcrumbs,
  title,
  subtitle,
  embedded = false,
  wide = false,
  children,
  actions,
}: ComunidadeDocenteDetailShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEmbedded = embedded || readEmbedded(searchParams);
  const homeHref = isEmbedded ? comunidadeRoutes.homeEmbedded : comunidadeRoutes.home;

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      router.push(buscaHref(value.trim(), isEmbedded));
    }
  };

  const navigateToMenu = (item: DocenteMenuItem) => {
    if (item === "desafios") {
      router.push(isEmbedded ? comunidadeRoutes.desafiosEmbedded : comunidadeRoutes.desafios);
      return;
    }
    if (item === "professores") {
      router.push(isEmbedded ? comunidadeRoutes.buscaEmbedded : comunidadeRoutes.busca);
      return;
    }
    router.push(homeWithAba(item, isEmbedded));
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
        onSelectMenu={navigateToMenu}
        activeMenu={activeMenu}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={[
              "mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8",
              wide ? "max-w-6xl" : "max-w-4xl",
            ].join(" ")}
          >
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
