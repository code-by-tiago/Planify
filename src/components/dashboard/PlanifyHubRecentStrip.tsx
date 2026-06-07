"use client";

import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { listHistoryFromAPI } from "@/lib/history/history-api-client";
import type { HistoryItem } from "@/types/history";

type PlanifyHubRecentStripProps = {
  onOpenHistorico: () => void;
};

function formatWhen(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Agora há pouco";
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function PlanifyHubRecentStrip({ onOpenHistorico }: PlanifyHubRecentStripProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void listHistoryFromAPI().then((res) => {
      if (!active) return;
      if (res.success) {
        const sorted = [...res.data.items].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setItems(sorted.slice(0, 4));
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded) {
    return (
      <section className="pl-hud-glass rounded-2xl p-4 sm:p-5">
        <p className="text-xs font-semibold text-slate-400">Carregando atividade…</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="pl-hud-glass rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-950">
              Continuar de onde parou
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Seus materiais recentes aparecerão aqui após a primeira geração.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenHistorico}
            className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Ver histórico
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="pl-hud-glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-slate-950">
          Continuar de onde parou
        </h2>
        <button
          type="button"
          onClick={onOpenHistorico}
          className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
        >
          Ver tudo →
        </button>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={onOpenHistorico}
              className="flex w-full items-start gap-3 rounded-xl border border-cyan-400/15 bg-white/70 p-3 text-left transition hover:border-cyan-400/35 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <PlanifyIcon name="fileText" className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                  {item.type} · {formatWhen(item.updatedAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
