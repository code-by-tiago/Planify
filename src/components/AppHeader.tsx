"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { headerLinks } from "../lib/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isRouteActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-sm font-black text-white shadow-2xl shadow-blue-500/30">
            <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition group-hover:opacity-100" />
            <span className="relative">P</span>
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">Planify</p>
            <p className="text-xs font-semibold text-slate-400">SaaS educacional premium</p>
          </div>
        </Link>

        <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.04] p-1 xl:flex">
          {headerLinks.map((item) => {
            const active = isRouteActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-black text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-cyan-100"
          >
            Acessar painel
          </Link>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-black text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10 xl:hidden"
        >
          {isOpen ? "×" : "☰"}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 px-5 py-5 shadow-2xl backdrop-blur-2xl xl:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {headerLinks.map((item) => {
              const active = isRouteActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-white text-slate-950"
                      : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white"
              >
                Entrar
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                Acessar painel
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}