"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
} from "./AdminCommandCenterShell";

type ActivityItem = {
  id: string;
  maskedUserId: string;
  tipo: string;
  className: string | null;
  createdAt: string;
};

const REFRESH_MS = 30_000;

export function AdminActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState("");

  const loadFeed = useCallback(async () => {
    setError("");

    try {
      const response = await fetch("/api/admin/activity-feed?limit=20", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Feed indisponível.");
      }

      setItems((data.items || []) as ActivityItem[]);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Erro no feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadFeed();
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadFeed]);

  return (
    <AdminPanel
      title="Atividade recente"
      subtitle="Últimas 20 gerações · atualização automática a cada 30s"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-600">
          {lastSync ? `Atualizado ${formatAdminDate(lastSync)}` : "Aguardando…"}
        </span>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadFeed();
          }}
          className={adminButtonPrimaryClassName(loading)}
          disabled={loading}
        >
          Atualizar feed
        </button>
      </div>

      {error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">Carregando atividade…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma geração recente.</p>
      ) : (
        <div className={`${adminTableWrapClassName()} max-h-80 overflow-y-auto`}>
          <table className={adminTableClassName()}>
            <thead className="sticky top-0">
              <tr>
                <th className="px-3 py-2.5">Usuário</th>
                <th className="px-3 py-2.5">Tipo</th>
                <th className="px-3 py-2.5">Turma</th>
                <th className="px-3 py-2.5">Quando</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2.5 font-mono text-xs text-cyan-400/90">
                    {item.maskedUserId}
                  </td>
                  <td className="px-3 py-2.5">{item.tipo}</td>
                  <td className="px-3 py-2.5 text-slate-400">
                    {item.className || "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                    {formatAdminDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}
