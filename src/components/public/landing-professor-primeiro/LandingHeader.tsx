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
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showPainel = !session.loading && session.authenticated;

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white pt-[env(safe-area-inset-top)] transition-all duration-300 max-sm:backdrop-blur-none sm:backdrop-blur-md ${
        scrolled
          ? "border-slate-200/80 shadow-sm sm:bg-white/90"
          : "border-transparent sm:bg-white/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <PlanifyBrand href="/" hideTagline />

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/ferramentas"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-cyan-700 sm:inline-flex sm:px-4"
          >
            Ferramentas
          </Link>
          {showPainel ? (
            <Link
              href="/dashboard"
              className={`${ppBtnPrimarySm} whitespace-nowrap`}
            >
              Painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-cyan-700 sm:px-4 sm:py-2.5"
              >
                Entrar
              </Link>
              <Link href="/planos" className={`${ppBtnPrimarySm} whitespace-nowrap`}>
                Começar agora
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
