"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
  adminButtonDangerClassName,
  adminInputClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
} from "./components/AdminCommandCenterShell";

type ReportItem = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; email: string | null; name: string | null };
};

export function AdminCommunityModerationPanel() {
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved" | "dismissed" | "all">(
    "open",
  );
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/community/reports?status=${statusFilter}`,
        { credentials: "include", cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar denúncias.");
      }
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolveReport(reportId: string, status: "resolved" | "dismissed") {
    setBusyId(reportId);
    setMessage("");
    try {
      const response = await fetch("/api/admin/community/reports", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status,
          adminNote: notes[reportId] || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar.");
      }
      setMessage("Denúncia atualizada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Moderação · Comunidade Docente"
        subtitle="Fila de denúncias de posts, comentários, materiais, chat de grupos e perfis."
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["open", "resolved", "dismissed", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                statusFilter === value
                  ? "bg-cyan-600 text-white"
                  : "border border-slate-700 text-slate-300"
              }`}
            >
              {value === "open"
                ? "Abertas"
                : value === "resolved"
                  ? "Resolvidas"
                  : value === "dismissed"
                    ? "Dispensadas"
                    : "Todas"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className={adminButtonPrimaryClassName()}
          >
            Atualizar
          </button>
        </div>

        {error ? <p className="mb-3 text-sm font-semibold text-rose-400">{error}</p> : null}
        {message ? <p className="mb-3 text-sm font-semibold text-emerald-400">{message}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-400">Carregando denúncias…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma denúncia neste filtro.</p>
        ) : (
          <div className={adminTableWrapClassName()}>
            <table className={adminTableClassName()}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Denunciante</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="whitespace-nowrap text-xs">{formatAdminDate(report.createdAt)}</td>
                    <td className="text-xs">
                      <span className="font-mono">{report.targetType}</span>
                      <br />
                      <span className="text-slate-500">{report.targetId.slice(0, 8)}…</span>
                    </td>
                    <td className="max-w-xs text-xs">{report.reason}</td>
                    <td className="text-xs">
                      {report.reporter.name || report.reporter.email || report.reporter.id.slice(0, 8)}
                    </td>
                    <td className="text-xs capitalize">{report.status}</td>
                    <td>
                      {report.status === "open" ? (
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <input
                            value={notes[report.id] || ""}
                            onChange={(event) =>
                              setNotes((prev) => ({
                                ...prev,
                                [report.id]: event.target.value,
                              }))
                            }
                            placeholder="Nota interna (opcional)"
                            className={adminInputClassName()}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === report.id}
                              onClick={() => void resolveReport(report.id, "resolved")}
                              className={adminButtonPrimaryClassName(busyId === report.id)}
                            >
                              Resolver
                            </button>
                            <button
                              type="button"
                              disabled={busyId === report.id}
                              onClick={() => void resolveReport(report.id, "dismissed")}
                              className={adminButtonDangerClassName()}
                            >
                              Dispensar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {report.adminNote || "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
