"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PublicHeaderProps = {
  active?: "home" | "planos" | "contato" | "ferramentas" | "como" | "escolas";
};

const navLinks: {
  key: NonNullable<PublicHeaderProps["active"]>;
  href: string;
  label: string;
}[] = [
  { key: "home", href: "/", label: "Início" },
  { key: "ferramentas", href: "/#ferramentas", label: "Ferramentas" },
  { key: "como", href: "/#como-funciona", label: "Como funciona" },
  { key: "planos", href: "/planos", label: "Planos" },
  { key: "escolas", href: "/escolas", label: "Para escolas" },
  { key: "contato", href: "/contato", label: "Contato" },
];

export function PublicHeader({ active }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (!open) {
      return;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function linkClass(key: string) {
    const isActive = active === key;
    return `pl-public-header-link${isActive ? " pl-public-header-link--active" : ""}`;
  }

  const mobileMenu =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="pl-public-mobile-backdrop"
              type="button"
              className="pl-public-mobile-menu-backdrop fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm lg:hidden"
              data-pl-mobile-menu-overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="pl-public-mobile-panel"
              data-pl-mobile-menu-panel
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "tween", duration: reduce ? 0.15 : 0.28, ease: "easeOut" }}
              className="pl-public-mobile-menu fixed right-0 top-0 z-[201] flex h-[100dvh] w-[min(100%,20rem)] flex-col border-l border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between gap-3">
                <PlanifyBrand href="/" hideTagline />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                      active === item.key
                        ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100"
                        : "text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 grid shrink-0 gap-2.5 border-t border-slate-100 pt-4">
                <Link
                  href="/login?portal=professor"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Portal do Professor
                </Link>
                <Link
                  href="/login?portal=escola"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Portal da Escola
                </Link>
                <Link
                  href="/planos"
                  onClick={() => setOpen(false)}
                  className="pl-hud-btn rounded-xl py-3 text-center text-sm font-semibold"
                >
                  Ver planos
                </Link>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header
        className={`planify-ui3-header pl-public-header sticky top-0 z-50${scrolled ? " pl-public-header--scrolled" : ""}`}
      >
        <div className="pl-public-header-inner mx-auto max-w-7xl">
          <div className="pl-public-header-brand">
            <PlanifyBrand href="/" hideTagline />
          </div>

          <nav className="pl-public-header-nav hidden lg:flex" aria-label="Navegação principal">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.key ?? "")}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pl-public-header-actions hidden sm:flex">
            <Link href="/login?portal=professor" className="pl-public-header-portal">
              Portal do Professor
            </Link>
            <Link href="/login?portal=escola" className="pl-public-header-portal">
              Portal da Escola
            </Link>
            <Link href="/planos" className="pl-hud-btn pl-public-header-cta">
              Ver planos
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="pl-public-header-menu lg:hidden"
          >
            <PlanifyIcon name="menu" className="h-5 w-5" />
          </button>
        </div>
      </header>
      {mobileMenu}
    </>
  );
}

export default PublicHeader;
