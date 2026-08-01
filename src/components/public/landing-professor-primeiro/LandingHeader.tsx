"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";
import { ppBtnPrimarySm } from "./theme";

const navLinkClass =
  "rounded-lg px-3 py-2 text-sm font-semibold text-[#0A192F]/80 transition hover:bg-[#F0F9FA] hover:text-[#0A192F]";

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const session = usePlanifySession();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
        <div className="shrink-0">
          <PlanifyBrand href="/" hideTagline />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showPainel ? (
            <>
              <Link href="/contato" className={`${navLinkClass} inline-flex`}>
                Contato
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#26C6DA] px-4 py-2.5 text-sm font-bold text-[#0A192F] shadow-sm transition hover:brightness-105"
              >
                Painel
              </Link>
            </>
          ) : (
            <>
              <Link href="/escolas" className={`${navLinkClass} hidden md:inline-flex`}>
                Para escolas
              </Link>
              <Link href="/contato" className={`${navLinkClass} hidden md:inline-flex`}>
                Contato
              </Link>
              <Link href="/login" className={`${navLinkClass} hidden sm:inline-flex`}>
                Entrar
              </Link>
              <Link href="/planos" className={ppBtnPrimarySm}>
                Começar agora
              </Link>
            </>
          )}

          {!showPainel ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            >
              <PlanifyIcon name={open ? "close" : "menu"} className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {open && !showPainel ? (
        <div className="border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/escolas"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-cyan-50"
            >
              Para escolas
            </Link>
            <Link
              href="/contato"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-cyan-50"
            >
              Contato e suporte
            </Link>
            <Link
              href="/testar-planejamento"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-cyan-50"
            >
              Testar planejamento grátis
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-cyan-50 sm:hidden"
            >
              Entrar
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
