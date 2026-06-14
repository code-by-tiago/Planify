"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { IconSearch, IconX } from "@/components/community/docente/docente-icons";
import { useCommunityProfileSearch } from "@/lib/community/use-community-profile-search";
import type { CommunityProfileSearchResult } from "@/lib/community/types";

type ComunidadeDocenteUserPickerProps = {
  label: string;
  hint?: string;
  selected: CommunityProfileSearchResult[];
  onChange: (users: CommunityProfileSearchResult[]) => void;
  maxUsers?: number;
};

export function ComunidadeDocenteUserPicker({
  label,
  hint,
  selected,
  onChange,
  maxUsers = 10,
}: ComunidadeDocenteUserPickerProps) {
  const { query, setQuery, trimmedQuery, canSearch, results, loading, error } =
    useCommunityProfileSearch({ enabled: true });

  const selectedIds = new Set(selected.map((user) => user.userId));
  const canAddMore = selected.length < maxUsers;

  function addUser(user: CommunityProfileSearchResult) {
    if (!canAddMore || selectedIds.has(user.userId)) return;
    onChange([...selected, user]);
    setQuery("");
  }

  function removeUser(userId: string) {
    onChange(selected.filter((user) => user.userId !== userId));
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {hint ? <p className="mb-2 text-xs font-medium text-slate-500">{hint}</p> : null}

      {selected.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-2">
          {selected.map((user) => (
            <li
              key={user.userId}
              className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-1.5"
            >
              <CommunityAuthorAvatar
                userId={user.userId}
                name={user.displayName}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <span className="max-w-[140px] truncate text-xs font-bold text-[#0F172A]">
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={() => removeUser(user.userId)}
                className="text-slate-400 hover:text-red-500"
                aria-label={`Remover ${user.displayName}`}
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {canAddMore ? (
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar professor por nome ou escola…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm font-medium text-[#0F172A] outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      ) : (
        <p className="text-xs font-semibold text-slate-500">
          Limite de {maxUsers} participantes atingido.
        </p>
      )}

      {canAddMore && (loading || error || (canSearch && results.length > 0) || trimmedQuery.length > 0) ? (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <p className="px-3 py-3 text-center text-xs font-semibold text-slate-500">Buscando…</p>
          ) : error ? (
            <p className="px-3 py-3 text-center text-xs font-semibold text-red-600">{error}</p>
          ) : canSearch && results.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs font-medium text-slate-500">
              Nenhum professor público encontrado.
            </p>
          ) : (
            <ul>
              {results
                .filter((user) => !selectedIds.has(user.userId))
                .map((user) => (
                  <li key={user.userId}>
                    <button
                      type="button"
                      onClick={() => addUser(user)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cyan-50"
                    >
                      <CommunityAuthorAvatar
                        userId={user.userId}
                        name={user.displayName}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#0F172A]">{user.displayName}</p>
                        <p className="truncate text-[11px] font-medium text-slate-500">
                          {user.schoolName || "Escola não informada"}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
