"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityFriendButton } from "@/components/community/CommunityFriendButton";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const componenteOptions = [
  "",
  "Multicomponente",
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
];

type CommunityTeacherSearchProps = {
  onClose?: () => void;
  className?: string;
};

export function CommunityTeacherSearch({ onClose, className }: CommunityTeacherSearchProps) {
  const [query, setQuery] = useState("");
  const [component, setComponent] = useState("");
  const [results, setResults] = useState<CommunityProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2 || Boolean(component);

  const search = useCallback(async () => {
    if (!canSearch) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (trimmedQuery.length >= 2) params.set("q", trimmedQuery);
      if (component) params.set("component", component);

      const response = await fetch(`/api/community/profiles/search?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{ profiles?: CommunityProfileSearchResult[] }>(response);

      const profiles = response.ok ? data?.profiles || [] : [];

      setResults(profiles);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [canSearch, component, trimmedQuery]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void search();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, search]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  function closePanel() {
    setOpen(false);
    onClose?.();
  }

  const emptyMessage =
    trimmedQuery.length === 1
      ? "Digite pelo menos 2 caracteres (nome ou escola)."
      : canSearch
        ? "Nenhum professor público encontrado. Tente outro nome ou escola."
        : "Busque por nome do professor ou nome da escola.";

  return (
    <div className={`relative w-full sm:w-auto ${className || ""}`}>
      <button
        type="button"
        onClick={() => {
          if (open) {
            closePanel();
          } else {
            setOpen(true);
          }
        }}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/25 bg-white/90 px-3 text-xs font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-50 sm:w-auto sm:justify-start"
        aria-label="Buscar professores"
        aria-expanded={open}
      >
        <PlanifyIcon name="search" className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Buscar professores</span>
      </button>

      {open ? (
        <div className="fixed inset-x-4 top-[max(4.75rem,calc(env(safe-area-inset-top)+3.75rem))] z-[60] max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-cyan-400/20 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-[min(420px,calc(100vw-2rem))]">
          <div className="grid gap-2">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome do professor ou escola…"
              className="h-10 w-full rounded-xl border border-cyan-400/20 px-3 text-sm font-medium outline-none focus:border-cyan-400"
            />
            <select
              value={component}
              onChange={(event) => setComponent(event.target.value)}
              className="h-10 w-full rounded-xl border border-cyan-400/20 px-3 text-sm font-semibold outline-none focus:border-cyan-400"
            >
              <option value="">Todos os componentes</option>
              {componenteOptions
                .filter(Boolean)
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="py-4 text-center text-sm font-semibold text-slate-500">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="py-4 text-center text-sm font-medium text-slate-500">{emptyMessage}</p>
            ) : (
              <ul className="space-y-2">
                {results.map((profile) => (
                  <li
                    key={profile.userId}
                    className="flex items-center gap-2 rounded-xl border border-cyan-400/15 px-2 py-2 transition hover:bg-cyan-50/50"
                  >
                    <Link
                      href={`/marketplace/perfil/${profile.userId}`}
                      onClick={closePanel}
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
                          {profile.topComponente ? ` · ${profile.topComponente}` : ""}
                        </p>
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
      ) : null}
    </div>
  );
}
