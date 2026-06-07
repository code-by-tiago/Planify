"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPanel,
  adminButtonPrimaryClassName,
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
      void loadFeed();
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadFeed]);

  return (
    <AdminPanel
      title="Atividade ao vivo · Brasil"
      subtitle="Últimas 20 gerações · auto-refresh 30s · PII mascarada"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] text-slate-600">
          {lastSync ? `Sync: ${formatAdminDate(lastSync)}` : "Aguardando sync…"}
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
        <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800/80">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0d121c] text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Turma</th>
                <th className="px-3 py-2">Quando</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-800/60 text-slate-300 hover:bg-slate-800/30"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-cyan-400/90">
                    {item.maskedUserId}
                  </td>
                  <td className="px-3 py-2">{item.tipo}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {item.className || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
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
