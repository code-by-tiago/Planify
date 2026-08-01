"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
} from "./AdminCommandCenterShell";

type PendingEntry = {
  id: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  reviewStatus: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  bnccCodigos: string[];
  createdAt: string;
  sourceSlug: string | null;
};

export function AdminPedagogicoPanel() {
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/pedagogico/fila?limit=50", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar a fila.");
      }

      setEntries((data.entries || []) as PendingEntry[]);
    } catch (err) {
      setEntries([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar reservatório.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  async function reviewEntry(id: string, action: "approve" | "reject") {
    setActing(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/admin/pedagogico/${id}/revisar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Falha na revisão.");
      }

      setMessage(
        action === "approve"
          ? "Entrada aprovada no reservatório didático."
          : "Entrada rejeitada.",
      );
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na revisão.");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="grid gap-4">
      <AdminPanel
        title="Reservatório didático — fila de revisão"
        subtitle="Conteúdo externo capturado aguardando curadoria antes de entrar no cache RAG."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadEntries()}
            disabled={loading}
            className={adminButtonPrimaryClassName(loading)}
          >
            {loading ? "Atualizando…" : "Atualizar fila"}
          </button>
          <span className="text-sm text-slate-500">
            {entries.length} pendente(s)
          </span>
        </div>
      </AdminPanel>

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
              <th className="px-3 py-2.5">Título / fonte</th>
              <th className="px-3 py-2.5">BNCC</th>
              <th className="px-3 py-2.5">Quando</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  Carregando fila…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  Nenhuma entrada pendente no reservatório.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <Fragment key={entry.id}>
                  <tr>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((current) =>
                            current === entry.id ? null : entry.id,
                          )
                        }
                        className="text-left"
                      >
                        <p className="font-medium text-slate-200">{entry.title}</p>
                        <p className="text-xs text-slate-500">
                          {entry.sourceSlug || entry.sourceTitle || "fonte desconhecida"}
                        </p>
                        {entry.sourceUrl ? (
                          <p className="mt-1 truncate text-xs text-cyan-500/80">
                            {entry.sourceUrl}
                          </p>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-emerald-400/90">
                      {entry.bnccCodigos.length > 0
                        ? entry.bnccCodigos.slice(0, 3).join(", ")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {formatAdminDate(entry.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => void reviewEntry(entry.id, "approve")}
                          className="pl-admin-btn-ghost px-2 py-1 text-xs"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => void reviewEntry(entry.id, "reject")}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === entry.id ? (
                    <tr>
                      <td colSpan={4} className="border-t border-slate-800/50 bg-slate-950/30 px-4 py-4">
                        <p className="text-xs font-medium text-slate-500">Resumo</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          {entry.summary || entry.bodyMarkdown?.slice(0, 800) || "Sem conteúdo."}
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
    </div>
  );
}
