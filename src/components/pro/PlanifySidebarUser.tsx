"use client";

import Link from "next/link";
import { useState } from "react";
import { OwnerFooterLink } from "@/components/OwnerFooterLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifySession } from "@/hooks/usePlanifySession";

function SidebarUserAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = displayName.charAt(0).toUpperCase() || "P";

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200/80"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-black text-white shadow-sm">
      {initial}
    </span>
  );
}

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
        <SidebarUserAvatar
          avatarUrl={session.avatarUrl}
          displayName={session.displayName}
        />
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
      <div className="px-1 text-center">
        <OwnerFooterLink />
      </div>
    </div>
  );
}
