"use client";

import type { ReactNode } from "react";
import { AdminSidebarLinks } from "./AdminSidebarLinks";

export type AdminTabId =
  | "visao-geral"
  | "corpus"
  | "reservatorio"
  | "qualidade-ia"
  | "escolas"
  | "usuarios"
  | "materiais"
  | "comunidade"
  | "sistema";

type TabDef = { id: AdminTabId; label: string };

export const adminTabs: TabDef[] = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "corpus", label: "Garimpo RAG" },
  { id: "reservatorio", label: "Reservatório" },
  { id: "escolas", label: "Escolas" },
  { id: "usuarios", label: "Usuários" },
  { id: "materiais", label: "Materiais IA" },
  { id: "comunidade", label: "Comunidade" },
  { id: "qualidade-ia", label: "Qualidade IA" },
  { id: "sistema", label: "Sistema" },
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
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <div className="pl-admin-shell overflow-hidden rounded-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-medium text-cyan-400/90">Planify · Proprietário</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Administração
            </h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="pl-admin-btn-primary px-4 py-2 transition disabled:opacity-50"
          >
            {refreshing ? "Atualizando…" : "Atualizar"}
          </button>
        </header>

        <div className="grid lg:grid-cols-[200px_1fr]">
          <nav className="pl-admin-nav border-b lg:border-b-0 lg:border-r">
            <div className="hidden border-b border-slate-800/60 p-3 lg:block">
              <AdminSidebarLinks orientation="vertical" />
            </div>
            <div className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`pl-admin-nav-btn shrink-0 px-3 py-2.5 text-left lg:w-full ${
                    activeTab === tab.id ? "pl-admin-nav-btn--active" : ""
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="min-w-0 p-5 sm:p-6">
            <h3 className="mb-5 text-base font-semibold text-slate-200">
              {active?.label}
            </h3>

            {error ? (
              <div className="mb-5 rounded-xl border border-rose-500/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
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
    <div className={`pl-admin-panel p-4 sm:p-5 ${className}`}>
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
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
    <div className="pl-admin-stat p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accentMap[accent]}`}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs leading-snug text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function adminInputClassName() {
  return "pl-admin-input w-full px-3 py-2 text-sm placeholder:text-slate-600";
}

export function adminButtonPrimaryClassName(disabled = false) {
  return `pl-admin-btn-primary px-4 py-2 transition ${disabled ? "opacity-50" : ""}`;
}

export function adminButtonDangerClassName() {
  return "rounded-lg border border-rose-500/25 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/35";
}

export function adminTableClassName() {
  return "pl-admin-table min-w-full text-left text-sm";
}

export function adminTableWrapClassName() {
  return "pl-admin-table-wrap";
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
