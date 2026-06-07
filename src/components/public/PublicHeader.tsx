"use client";

import { useEffect, useState } from "react";
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
  const reduce = useReducedMotion();

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

  function linkClass(key: string) {
    const isActive = active === key;
    return `pl-public-header-link${isActive ? " pl-public-header-link--active" : ""}`;
  }

  return (
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
          className="pl-public-header-menu lg:hidden"
        >
          <PlanifyIcon name="menu" className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <PlanifyBrand href="/" />
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 grid gap-2">
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-xl px-4 py-3.5 text-base font-semibold ${active === item.key ? "bg-cyan-50 text-cyan-700" : "text-slate-700"}`}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto grid gap-3 pt-6">
                <Link
                  href="/login?portal=professor"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Portal do Professor
                </Link>
                <Link
                  href="/login?portal=escola"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Portal da Escola
                </Link>
                <Link href="/planos" onClick={() => setOpen(false)} className="pl-hud-btn rounded-xl py-3 text-center text-sm font-semibold">
                  Ver planos
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default PublicHeader;
