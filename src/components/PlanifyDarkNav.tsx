"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { appNavigation } from "@/lib/pro/planifyTools";

/**
 * Navegação lateral com tema escuro — usada pelo PageShell.
 * Componente client para detecção automática de rota ativa.
 */
export function PlanifyDarkNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navContent = (
    <nav className="mt-6 space-y-1">
      {appNavigation.map((item) => {
        const selected = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition ${
              selected
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <PlanifyIcon name={item.icon} className="h-5 w-5 shrink-0" />
            {item.label}
            {selected && (
              <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Botão hamburger — mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
      >
        <PlanifyIcon name="menu" className="h-5 w-5" />
      </button>

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 px-4 py-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-black tracking-tight text-white">
            Planify
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <PlanifyIcon name="close" className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Sidebar desktop — estática, renderizada pelo PageShell */}
    </>
  );
}
