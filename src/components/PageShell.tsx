import Link from "next/link";
import type { ReactNode } from "react";
import { PlanifyDarkNav } from "./PlanifyDarkNav";
import { PremiumRouteGuard } from "./PremiumRouteGuard";
import { PlanifyIcon } from "./pro/PlanifyIcons";
import { appNavigation } from "@/lib/pro/planifyTools";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PremiumRouteGuard />

      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        {/* Sidebar — desktop */}
        <aside className="hidden flex-col border-r border-white/10 bg-slate-950 px-4 py-5 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950">
              <PlanifyIcon name="spark" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black leading-none tracking-tight text-white">
                Planify
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Studio
              </p>
            </div>
          </Link>

          <nav className="mt-7 space-y-1">
            {appNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <PlanifyIcon name={item.icon} className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <Link
              href="/planos"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              <PlanifyIcon name="plans" className="h-4 w-4 shrink-0" />
              Ver planos
            </Link>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex min-w-0 flex-col">
          {/* Topbar mobile */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
            <PlanifyDarkNav />
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-950">
                <PlanifyIcon name="spark" className="h-4 w-4" />
              </div>
              <span className="text-sm font-black tracking-tight text-white">
                Planify
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/planos"
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Planos
              </Link>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}

export default PageShell;
