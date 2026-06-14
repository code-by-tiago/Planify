"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { DOCENTE_DISCIPLINAS, buscaHref, comunidadeRoutes, homeWithAba } from "@/lib/community/docente-utils";

type SearchResult = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
  bio: string | null;
  topComponente: string | null;
  materialsCount: number;
};

export function ComunidadeDocenteBuscaClient({ forceEmbedded }: { forceEmbedded?: boolean } = {}) {
  const router = useRouter();
  const embedded = Boolean(forceEmbedded);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [school, setSchool] = useState("");
  const [component, setComponent] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (q: string, s: string, c: string) => {
    if (q.trim().length < 2 && !s.trim() && !c) {
      setResults([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (s.trim()) params.set("school", s.trim());
      if (c) params.set("component", c);
      const response = await fetch(`/api/community/profiles/search?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível buscar professores.");
      }
      setResults(data.profiles || []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Erro ao buscar professores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      void search(initialQuery, "", "");
    }
  }, [initialQuery, search]);

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      activeMenu="professores"
      breadcrumbs={[{ label: "Professores", href: homeWithAba("professores", embedded) }]}
      title="Buscar professores"
      subtitle="Encontre colegas por nome, escola ou componente curricular."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou palavra-chave…"
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
          />
          <input
            type="search"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Escola…"
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
          />
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:bg-white"
          >
            <option value="">Todos os componentes</option>
            {DOCENTE_DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            const q = query.trim();
            if (q) router.replace(buscaHref(q, embedded));
            void search(query, school, component);
          }}
          className="mt-4 min-h-11 rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
        >
          Buscar
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void search(query, school, component)}
              className="mt-3 min-h-11 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-500">
            Digite pelo menos 2 caracteres ou selecione um filtro para buscar professores com perfil
            público.
          </p>
        ) : (
          <ul className="space-y-3">
            {results.map((teacher) => (
              <li key={teacher.userId}>
                <Link
                  href={comunidadeRoutes.professor(teacher.userId, embedded)}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/20"
                >
                  <CommunityAuthorAvatar
                    userId={teacher.userId}
                    name={teacher.displayName}
                    avatarUrl={teacher.avatarUrl}
                    embedded={embedded}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[#0F172A]">{teacher.displayName}</p>
                    {teacher.schoolName ? (
                      <p className="text-xs text-slate-500">{teacher.schoolName}</p>
                    ) : null}
                    {teacher.topComponente ? (
                      <p className="mt-1 text-[11px] font-semibold text-cyan-600">
                        {teacher.topComponente} · {teacher.materialsCount} materiais
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ComunidadeDocenteDetailShell>
  );
}
