"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityFriendButton } from "@/components/community/CommunityFriendButton";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityProfileSearchMatchHint } from "@/lib/community/types";
import { useCommunityProfileSearch } from "@/lib/community/use-community-profile-search";
import Link from "next/link";

const matchHintLabels: Record<CommunityProfileSearchMatchHint, string> = {
  nome: "nome",
  escola: "escola",
  bio: "bio",
};

export function CommunityFriendSearch() {
  const { query, setQuery, trimmedQuery, canSearch, results, loading, error } =
    useCommunityProfileSearch({ enabled: true });

  const emptyMessage =
    trimmedQuery.length === 1
      ? "Digite pelo menos 2 caracteres (nome ou escola)."
      : canSearch
        ? "Nenhum professor público encontrado. Tente outro nome ou escola."
        : "Busque por nome do professor ou nome da escola.";

  return (
    <div className="rounded-xl border border-cyan-400/15 bg-cyan-50/30 p-3">
      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-cyan-800">
          <PlanifyIcon name="search" className="h-3.5 w-3.5" />
          Buscar professores
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou escola…"
          className="h-10 w-full rounded-xl border border-cyan-400/20 bg-white px-3 text-sm font-medium outline-none focus:border-cyan-400"
        />
      </label>

      <div className="mt-3 max-h-56 overflow-y-auto">
        {loading ? (
          <p className="py-3 text-center text-sm font-semibold text-slate-500">Buscando…</p>
        ) : error ? (
          <p className="py-3 text-center text-sm font-semibold text-rose-700">{error}</p>
        ) : results.length === 0 ? (
          <p className="py-3 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {results.map((profile) => (
              <li
                key={profile.userId}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-white px-2 py-2 transition hover:bg-cyan-50/50"
              >
                <Link
                  href={`/marketplace/perfil/${profile.userId}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <CommunityAuthorAvatar
                    userId={profile.userId}
                    name={profile.displayName}
                    avatarUrl={profile.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-950">
                      {profile.displayName}
                    </p>
                    <p className="truncate text-[11px] font-medium text-slate-500">
                      {profile.schoolName || "Escola não informada"}
                    </p>
                    {profile.matchHint ? (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                        Encontrado por {matchHintLabels[profile.matchHint]}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <div
                  className="shrink-0"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <CommunityFriendButton targetUserId={profile.userId} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
