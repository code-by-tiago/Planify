"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";

type PlanifySidebarUserProps = {
  lumiHint?: string;
};

export function PlanifySidebarUser({
  lumiHint = "Pressione / para buscar ferramentas.",
}: PlanifySidebarUserProps) {
  const session = usePlanifySession();

  if (session.loading) {
    return (
      <div className="shrink-0 border-t border-slate-200/80 px-4 py-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="h-10 animate-pulse rounded-xl bg-blue-100/80" />
        </div>
      </div>
    );
  }

  if (!session.authenticated) {
    return (
      <div className="shrink-0 border-t border-slate-200/80 px-4 py-3">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white">
            <PlanifyIcon name="user" className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <p className="text-xs font-black text-slate-950">Entrar no Planify</p>
            <p className="text-[10px] font-semibold text-slate-500">
              {lumiHint}
            </p>
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="shrink-0 space-y-2 border-t border-slate-200/80 px-4 py-3">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-black text-white shadow-sm">
          {session.displayName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-950">
            {session.displayName}
          </p>
          <p className="truncate text-[10px] font-semibold text-slate-500">
            {session.email}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
              session.premium
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {session.premium ? session.planLabel : "Sem plano ativo"}
          </span>
        </div>
      </div>
      <p className="px-1 text-[10px] font-semibold text-slate-400">
        {lumiHint}
      </p>
    </div>
  );
}
