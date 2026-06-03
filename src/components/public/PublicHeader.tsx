"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PublicHeaderProps = {
  active?: "home" | "planos" | "contato";
};

const navLinks: { key: NonNullable<PublicHeaderProps["active"]>; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Início" },
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

  return (
    <header className="planify-ui3-header sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <PlanifyBrand href="/" />

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active === item.key
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Entrar
          </Link>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
          >
            Acessar painel
            <PlanifyIcon
              name="arrowRight"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-950 hover:text-slate-950 sm:hidden"
        >
          <PlanifyIcon name="menu" className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <PlanifyBrand href="/" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  <PlanifyIcon name="close" className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-8 grid gap-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-base font-black transition ${
                      active === item.key
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-950"
                    }`}
                  >
                    {item.label}
                    <PlanifyIcon name="chevronRight" className="h-4 w-4" />
                  </Link>
                ))}
              </nav>

              <div className="mt-auto grid gap-3 border-t border-slate-200 pt-6">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                >
                  Entrar
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-200"
                >
                  Acessar painel
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default PublicHeader;
