"use client";

import type { ReactNode } from "react";

export type AdminTabId =
  | "visao-geral"
  | "qualidade-ia"
  | "escolas"
  | "usuarios"
  | "materiais"
  | "sistema";

type TabDef = { id: AdminTabId; label: string; hint?: string };

export const adminTabs: TabDef[] = [
  { id: "visao-geral", label: "Command Center", hint: "Métricas e feed ao vivo" },
  { id: "escolas", label: "Escolas", hint: "Licenças B2B" },
  { id: "usuarios", label: "Usuários", hint: "Contas e planos" },
  { id: "materiais", label: "Materiais IA", hint: "Gerações globais" },
  { id: "qualidade-ia", label: "Qualidade IA", hint: "Telemetria" },
  { id: "sistema", label: "Sistema", hint: "Saúde e flags" },
];

type AdminCommandCenterShellProps = {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  onRefresh: () => void;
  refreshing: boolean;
  error?: string;
  children: ReactNode;
};

export function AdminCommandCenterShell({
  activeTab,
  onTabChange,
  onRefresh,
  refreshing,
  error,
  children,
}: AdminCommandCenterShellProps) {
  const active = adminTabs.find((tab) => tab.id === activeTab);

  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-24 pt-2 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b0f17] shadow-2xl shadow-black/40">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 bg-gradient-to-r from-slate-950 via-[#0f1624] to-slate-950 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400/90">
              Planify Enterprise · Owner
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-100 sm:text-2xl">
              Command Center
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {active?.hint || "Administração global da plataforma"}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {refreshing ? "Sincronizando…" : "Atualizar"}
          </button>
        </header>

        <div className="grid lg:grid-cols-[220px_1fr]">
          <nav className="border-b border-slate-800/80 bg-[#080c14] lg:border-b-0 lg:border-r">
            <div className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`shrink-0 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition lg:w-full lg:text-sm ${
                    activeTab === tab.id
                      ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-800/60 pb-4">
              <h3 className="text-lg font-black text-slate-100">{active?.label}</h3>
              <span className="rounded-md bg-slate-800/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Alta densidade · Desktop first
              </span>
            </div>

            {error ? (
              <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm font-semibold text-rose-300">
                {error}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 text-[11px] text-slate-600">{subtitle}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  detail?: string;
  accent?: "cyan" | "emerald" | "amber" | "violet";
}) {
  const accentMap = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0d121c] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black tabular-nums ${accentMap[accent]}`}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function adminInputClassName() {
  return "w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30";
}

export function adminButtonPrimaryClassName(disabled = false) {
  return `rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-500/25 ${disabled ? "opacity-50" : ""}`;
}

export function adminButtonDangerClassName() {
  return "rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-900/40";
}

export function formatAdminDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
