"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PublicHeaderProps = {
  active?: "home" | "planos" | "contato" | "ferramentas" | "como";
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
  { key: "contato", href: "/contato", label: "Contato" },
];

export function PublicHeader({ active }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function linkClass(key: string) {
    const isActive = active === key;
    return `rounded-full px-3.5 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-violet-800/90 hover:bg-violet-50 hover:text-violet-950"
    }`;
  }

  return (
    <header className="planify-ui3-header sticky top-0 z-50 border-b border-indigo-100/80 bg-white max-lg:backdrop-blur-none lg:bg-white/90 lg:backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <PlanifyBrand href="/" hideTagline />

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.key ?? "")}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          >
            Entrar
          </Link>
          <Link
            href="/planos"
            className="pl-teachy-cta rounded-full px-5 py-2.5 text-sm font-bold text-slate-900"
          >
            Ver planos
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 text-violet-800 lg:hidden"
        >
          <PlanifyIcon name="menu" className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="absolute inset-0 bg-violet-950/40 max-lg:backdrop-blur-none lg:bg-violet-950/30 lg:backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <PlanifyBrand href="/" />
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100">
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 grid gap-2">
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-2xl px-4 py-3.5 text-base font-bold ${active === item.key ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto grid gap-3 pt-6">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-200 py-3 text-center text-sm font-bold text-slate-800"
                >
                  Entrar
                </Link>
                <Link
                  href="/planos"
                  onClick={() => setOpen(false)}
                  className="pl-teachy-cta rounded-full py-3 text-center text-sm font-bold text-slate-900"
                >
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
