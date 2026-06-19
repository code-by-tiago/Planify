"use client";

import { useEffect, useState } from "react";
import { PlanifyNavIcon } from "@/components/pro/PlanifyNavIcon";
import { listHistoryFromAPI } from "@/lib/history/history-api-client";
import type { HistoryItem } from "@/types/history";

type PlanifySidebarRecentsProps = {
  collapsed?: boolean;
  onOpenHistorico: () => void;
  onActivate?: () => void;
};

function formatWhen(iso: string): string {
  try {
    const date = new Date(iso);
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function PlanifySidebarRecents({
  collapsed = false,
  onOpenHistorico,
  onActivate,
}: PlanifySidebarRecentsProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let active = true;
    void listHistoryFromAPI().then((res) => {
      if (!active || !res.success) return;
      const sorted = [...res.data.items].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setItems(sorted.slice(0, 3));
    });
    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={`shrink-0 ${collapsed ? "px-2 pb-2" : "px-3 pb-2"}`}>
      {!collapsed ? (
        <div className="mb-1 flex items-center justify-between px-1">
          <p className="pl-sidebar-section-label text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500/90">
            Recentes
          </p>
          <button
            type="button"
            onClick={() => {
              onOpenHistorico();
              onActivate?.();
            }}
            className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900"
          >
            Ver tudo
          </button>
        </div>
      ) : null}
      <div className="space-y-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            title={collapsed ? item.title : undefined}
            onClick={() => {
              onOpenHistorico();
              onActivate?.();
            }}
            className={`pf-sidebar-recent flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-cyan-400/10 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <PlanifyNavIcon name="fileText" className="h-4 w-4 shrink-0 text-cyan-600" />
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {item.title}
                </span>
                <span className="block truncate text-[10px] font-medium text-slate-500">
                  {formatWhen(item.updatedAt)}
                </span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
