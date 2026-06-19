"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { usePlanifySession } from "@/hooks/usePlanifySession";
import { ppBtnPrimarySm } from "./theme";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const session = usePlanifySession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPainel = !session.loading && session.authenticated;

  return (
    <header
      className={`pf-marketing-nav sticky top-0 z-50 pt-[env(safe-area-inset-top)] ${
        scrolled ? "is-scrolled" : ""
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-6 py-3 md:px-10 md:py-3.5">
        <PlanifyBrand href="/" hideTagline />

        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Navegação principal">
          <Link href="/#solucoes" className="pf-marketing-nav-link pf-marketing-nav-link--pill hidden md:inline-flex">
            Ecossistema
          </Link>
          <Link href="/#recursos" className="pf-marketing-nav-link hidden lg:inline-flex">
            Planify Studio
          </Link>
          <Link href="/ferramentas" className="pf-marketing-nav-link hidden md:inline-flex">
            Soluções
          </Link>
          <Link href="/escolas" className="pf-marketing-nav-link hidden xl:inline-flex">
            Para escolas
          </Link>
          <Link href="/planos" className="pf-marketing-nav-link hidden md:inline-flex">
            Planos
          </Link>
          {showPainel ? (
            <Link href="/dashboard" className={`${ppBtnPrimarySm} ml-1 whitespace-nowrap`}>
              Painel
            </Link>
          ) : (
            <>
              <Link href="/login" className="pf-marketing-btn pf-marketing-btn--ghost">
                Entrar
              </Link>
              <Link href="/cadastro" className={`${ppBtnPrimarySm} ml-0.5 whitespace-nowrap`}>
                Acesse grátis
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
