"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminPanel,
  adminButtonDangerClassName,
  adminButtonPrimaryClassName,
  adminInputClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
} from "./AdminCommandCenterShell";

type CorpusStatus = "pending" | "approved" | "rejected" | "all";

type CorpusCandidate = {
  id: string;
  tema: string;
  tipo: string;
  surface: string;
  discipline: string | null;
  bnccCodigos: string[];
  qualityScore: number | null;
  reviewStatus: string;
  contentSummary: string;
  topicSignature: string;
  sourceTable: string;
  sourceId: string;
  createdAt: string;
};

type CorpusStats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

const statusLabels: Record<CorpusStatus, string> = {
  pending: "Pendentes",
  approved: "Aprovados",
  rejected: "Rejeitados",
  all: "Todos",
};

function qualityClass(score: number | null) {
  if (score === null) return "text-slate-500";
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-amber-400";
  return "text-rose-400";
}

export function AdminCorpusPanel() {
  const [status, setStatus] = useState<CorpusStatus>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState<CorpusCandidate[]>([]);
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/corpus-candidates/stats", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setStats(data.stats as CorpusStats);
      }
    } catch {
      /* stats opcionais */
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: "25",
      });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/admin/corpus-candidates?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar candidatos.");
      }

      setCandidates((data.candidates || []) as CorpusCandidate[]);
      setTotalPages(data.pagination?.pages ?? 1);
      setTotal(data.pagination?.total ?? 0);
      setSelected(new Set());
    } catch (err) {
      setCandidates([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar garimpo.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const allSelected = useMemo(
    () => candidates.length > 0 && candidates.every((c) => selected.has(c.id)),
    [candidates, selected],
  );

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(candidates.map((c) => c.id)));
  }

  async function reviewOne(id: string, action: "approve" | "reject") {
    setActing(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/corpus-candidates/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Falha na revisão.");
      }

      setMessage(
        action === "approve" ? "Candidato aprovado para RAG." : "Candidato rejeitado.",
      );
      await Promise.all([loadCandidates(), loadStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na revisão.");
    } finally {
      setActing(false);
    }
  }

  async function reviewBulk(action: "approve" | "reject") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setActing(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/corpus-candidates/bulk", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Falha na revisão em lote.");
      }

      setMessage(
        `${data.updated} candidato(s) ${action === "approve" ? "aprovado(s)" : "rejeitado(s)"}.`,
      );
      await Promise.all([loadCandidates(), loadStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na revisão em lote.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="grid gap-4">
      <AdminPanel
        title="Garimpo interno (corpus RAG)"
        subtitle="Materiais de alta qualidade curados para enriquecer gerações via match BNCC/tema. Impacto gradual — não altera a UI imediatamente."
      >
        <p className="mb-3 text-xs text-slate-500">
          Sync diário às 05:00 UTC. Score ≥ 90 é aprovado automaticamente (preview
          sanitizado, sem PII); 75–89 ficam pendentes para revisão manual.
        </p>
        {stats ? (
          <div className="grid gap-3 sm:grid-cols-4">
            {(
              [
                ["Pendentes", stats.pending, "amber"],
                ["Aprovados", stats.approved, "emerald"],
                ["Rejeitados", stats.rejected, "rose"],
                ["Total", stats.total, "cyan"],
              ] as const
            ).map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2.5"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p
                  className={`mt-1 text-xl font-bold tabular-nums ${
                    tone === "emerald"
                      ? "text-emerald-400"
                      : tone === "amber"
                        ? "text-amber-400"
                        : tone === "rose"
                          ? "text-rose-400"
                          : "text-cyan-400"
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </AdminPanel>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(statusLabels) as CorpusStatus[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              status === option
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {statusLabels[option]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(1);
              void loadCandidates();
            }
          }}
          placeholder="Buscar tema, disciplina, superfície…"
          className={`${adminInputClassName()} min-w-[16rem] flex-1`}
        />
        <button
          type="button"
          onClick={() => {
            setPage(1);
            void loadCandidates();
          }}
          disabled={loading}
          className={adminButtonPrimaryClassName(loading)}
        >
          Buscar
        </button>
        {selected.size > 0 ? (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => void reviewBulk("approve")}
              className={adminButtonPrimaryClassName(acting)}
            >
              Aprovar ({selected.size})
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => void reviewBulk("reject")}
              className={adminButtonDangerClassName()}
            >
              Rejeitar ({selected.size})
            </button>
          </>
        ) : null}
      </div>

      {message ? <p className="text-sm text-cyan-400">{message}</p> : null}
      {error ? (
        <p className="rounded-lg border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <div className={adminTableWrapClassName()}>
        <table className={adminTableClassName()}>
          <thead>
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-3 py-2.5">Tema / BNCC</th>
              <th className="px-3 py-2.5">Superfície</th>
              <th className="px-3 py-2.5">Score</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Quando</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Carregando candidatos…
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Nenhum candidato neste filtro.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <Fragment key={candidate.id}>
                  <tr>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(candidate.id)}
                        onChange={() => toggleSelect(candidate.id)}
                        aria-label={`Selecionar ${candidate.tema}`}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((current) =>
                            current === candidate.id ? null : candidate.id,
                          )
                        }
                        className="text-left"
                      >
                        <p className="font-medium text-slate-200">{candidate.tema || "—"}</p>
                        <p className="text-xs text-slate-500">
                          {candidate.discipline || candidate.tipo || "—"}
                        </p>
                        {candidate.bnccCodigos.length > 0 ? (
                          <p className="mt-1 text-xs text-emerald-400/90">
                            {candidate.bnccCodigos.slice(0, 4).join(", ")}
                            {candidate.bnccCodigos.length > 4
                              ? ` +${candidate.bnccCodigos.length - 4}`
                              : ""}
                          </p>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 capitalize text-slate-400">
                      {candidate.surface}
                    </td>
                    <td className={`px-3 py-2.5 font-semibold tabular-nums ${qualityClass(candidate.qualityScore)}`}>
                      {candidate.qualityScore !== null
                        ? Math.round(candidate.qualityScore)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          candidate.reviewStatus === "approved"
                            ? "bg-emerald-950/50 text-emerald-300"
                            : candidate.reviewStatus === "rejected"
                              ? "bg-rose-950/50 text-rose-300"
                              : "bg-amber-950/50 text-amber-300"
                        }`}
                      >
                        {candidate.reviewStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {formatAdminDate(candidate.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {candidate.reviewStatus === "pending" ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => void reviewOne(candidate.id, "approve")}
                            className="pl-admin-btn-ghost px-2 py-1 text-xs"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => void reviewOne(candidate.id, "reject")}
                            className="text-xs text-rose-400 hover:text-rose-300"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === candidate.id ? (
                    <tr>
                      <td colSpan={7} className="border-t border-slate-800/50 bg-slate-950/30 px-4 py-4">
                        <p className="text-xs font-medium text-slate-500">Resumo sanitizado</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          {candidate.contentSummary || "Sem resumo."}
                        </p>
                        <p className="mt-3 text-xs text-slate-600">
                          Origem: {candidate.sourceTable} · {candidate.sourceId.slice(0, 8)}…
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          {total} registro(s) · página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="pl-admin-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="pl-admin-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
