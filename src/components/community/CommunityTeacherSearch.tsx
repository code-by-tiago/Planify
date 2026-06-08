"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
};

export function CommunityTeacherSearch({ onClose }: CommunityTeacherSearchProps) {
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("");
  const [component, setComponent] = useState("");
  const [results, setResults] = useState<CommunityProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim() && !school.trim() && !component) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (school.trim()) params.set("school", school.trim());
      if (component) params.set("component", component);

      const response = await fetch(`/api/community/profiles/search?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{ profiles?: CommunityProfileSearchResult[] }>(response);

      if (response.ok) {
        setResults(data?.profiles || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [component, query, school]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void search();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (open) onClose?.();
        }}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-cyan-400/25 bg-white/90 px-3 text-xs font-bold text-cyan-800 shadow-sm transition hover:bg-cyan-50"
      >
        <PlanifyIcon name="search" className="h-3.5 w-3.5" />
        Buscar professores
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-2xl border border-cyan-400/20 bg-white p-4 shadow-2xl sm:left-auto sm:right-0 sm:w-[min(420px,calc(100vw-2rem))]">
          <div className="grid gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome ou bio…"
              className="h-10 w-full rounded-xl border border-cyan-400/20 px-3 text-sm font-medium outline-none focus:border-cyan-400"
            />
            <input
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              placeholder="Escola"
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
              <p className="py-4 text-center text-sm font-medium text-slate-500">
                Digite para encontrar professores públicos.
              </p>
            ) : (
              <ul className="space-y-2">
                {results.map((profile) => (
                  <li key={profile.userId}>
                    <Link
                      href={`/marketplace/perfil/${profile.userId}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-cyan-400/15 px-3 py-2 transition hover:bg-cyan-50/50"
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
