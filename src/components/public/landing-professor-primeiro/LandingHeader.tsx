"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";
import { LANDING_NAV } from "./constants";
import { ppBtnPrimarySm } from "./theme";

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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-8 sm:py-4">
        <PlanifyBrand href="/" hideTagline />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {LANDING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 sm:flex">
          {showPainel ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
              >
                Painel
              </Link>
              <Link
                href="/planos"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-cyan-700"
              >
                Planos
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-cyan-700"
              >
                Entrar
              </Link>
              <Link href="/planos" className={ppBtnPrimarySm}>
                Começar agora
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
        >
          <PlanifyIcon name={open ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <nav className="flex flex-col gap-1">
            {LANDING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-cyan-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
            {showPainel ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`${ppBtnPrimarySm} w-full py-3 text-center`}
                >
                  Entrar no painel
                </Link>
                <Link
                  href="/planos"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Planos
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Entrar
                </Link>
                <Link
                  href="/planos"
                  onClick={() => setOpen(false)}
                  className={`${ppBtnPrimarySm} w-full py-3 text-center`}
                >
                  Começar agora
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
