"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminQualidadePanel } from "./AdminQualidadePanel";

type Tab = "visao-geral" | "qualidade-ia" | "usuarios" | "sistema";

type Overview = {
  users: {
    total: number;
    activeSubscriptions: number;
    recent: Array<{
      id: string;
      email: string;
      fullName: string | null;
      planKey: string | null;
      status: string;
      createdAt: string;
    }>;
  };
  content: {
    libraryMaterials: number;
    marketplaceMaterials: number;
  };
  credits: {
    walletsWithBalance: number;
    totalBalance: number;
    usageLast24h: number;
  };
  generations: {
    last24h: number;
    last7d: number;
  };
  checkedAt: string;
};

type HealthCheck = {
  id: string;
  label: string;
  status: "ok" | "warn" | "missing";
  detail: string;
};

type HealthReport = {
  checks: HealthCheck[];
  featureFlags: Array<{ key: string; enabled: boolean; label: string }>;
  ownerConfigured: boolean;
  checkedAt: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "qualidade-ia", label: "Qualidade IA" },
  { id: "usuarios", label: "Usuários" },
  { id: "sistema", label: "Sistema" },
];

const quickLinks = [
  {
    href: "/admin/biblioteca",
    title: "Biblioteca Premium",
    text: "Cadastrar materiais oficiais e anexos.",
  },
  {
    href: "/admin#qualidade-ia",
    title: "Qualidade IA",
    text: "Telemetria de gerações e scores.",
  },
  {
    href: "/dashboard",
    title: "Painel Planify",
    text: "Ver o produto como professor.",
  },
  {
    href: "/planos",
    title: "Planos",
    text: "Página pública de assinaturas.",
  },
];

function statusClass(status: HealthCheck["status"]) {
  if (status === "ok") return "border-emerald-400/30 bg-emerald-50 text-emerald-800";
  if (status === "warn") return "border-amber-400/30 bg-amber-50 text-amber-800";
  return "border-rose-400/30 bg-rose-50 text-rose-800";
}

function statusLabel(status: HealthCheck["status"]) {
  if (status === "ok") return "OK";
  if (status === "warn") return "Atenção";
  return "Ausente";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminControleClient() {
  const [activeTab, setActiveTab] = useState<Tab>("visao-geral");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewRes, healthRes] = await Promise.all([
        fetch("/api/admin/overview", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/site-health", { credentials: "include", cache: "no-store" }),
      ]);

      const overviewJson = await overviewRes.json().catch(() => null);
      const healthJson = await healthRes.json().catch(() => null);

      if (!overviewRes.ok || !overviewJson?.success) {
        throw new Error(
          overviewJson?.error?.message || "Não foi possível carregar o painel.",
        );
      }

      if (!healthRes.ok || !healthJson?.success) {
        throw new Error(
          healthJson?.error?.message || "Não foi possível carregar saúde do site.",
        );
      }

      setOverview(overviewJson.overview as Overview);
      setHealth(healthJson.health as HealthReport);
    } catch (err) {
      setOverview(null);
      setHealth(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    if (typeof window !== "undefined" && window.location.hash === "#qualidade-ia") {
      setActiveTab("qualidade-ia");
    }
  }, [loadData]);

  function renderMetrics() {
    if (!overview) return null;

    const metrics = [
      { label: "Usuários", value: overview.users.total, detail: "perfis cadastrados" },
      {
        label: "Assinaturas ativas",
        value: overview.users.activeSubscriptions,
        detail: "Stripe / Supabase",
      },
      {
        label: "Gerações (24h)",
        value: overview.generations.last24h,
        detail: `${overview.generations.last7d} nos últimos 7 dias`,
      },
      {
        label: "Créditos em carteiras",
        value: overview.credits.totalBalance,
        detail: `${overview.credits.walletsWithBalance} carteiras · ${overview.credits.usageLast24h} usos/24h`,
      },
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-cyan-400/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs font-semibold text-cyan-700">{metric.detail}</p>
          </div>
        ))}
      </div>
    );
  }

  function renderContentStats() {
    if (!overview) return null;

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-50/80 p-5">
          <p className="text-sm font-black text-slate-950">Biblioteca Premium</p>
          <p className="mt-2 text-2xl font-black text-cyan-700">
            {overview.content.libraryMaterials}
          </p>
          <p className="mt-1 text-xs text-slate-600">materiais publicados ou rascunho</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-50/80 p-5">
          <p className="text-sm font-black text-slate-950">Marketplace</p>
          <p className="mt-2 text-2xl font-black text-cyan-700">
            {overview.content.marketplaceMaterials}
          </p>
          <p className="mt-1 text-xs text-slate-600">materiais da comunidade</p>
        </div>
      </div>
    );
  }

  function renderUsers() {
    if (!overview) return null;

    return (
      <div className="grid gap-3">
        {overview.users.recent.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum usuário encontrado.</p>
        ) : (
          overview.users.recent.map((user) => (
            <article
              key={user.id}
              className="rounded-2xl border border-cyan-400/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                    {user.status}
                  </span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase text-cyan-800">
                    {user.planKey || "Sem plano"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Cadastro: {formatDate(user.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    );
  }

  function renderSystem() {
    if (!health) return null;

    return (
      <div className="grid gap-6">
        <div className="grid gap-3">
          {health.checks.map((check) => (
            <article
              key={check.id}
              className="rounded-2xl border border-cyan-400/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{check.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{check.detail}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusClass(check.status)}`}
                >
                  {statusLabel(check.status)}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Flags de ambiente
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {health.featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">{flag.label}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    flag.enabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {flag.enabled ? "Ativo" : "Off"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Flags são lidas das variáveis de ambiente — altere no deploy/hosting.
          </p>
        </div>
      </div>
    );
  }

  function renderTabContent() {
    if (activeTab === "qualidade-ia") {
      return <AdminQualidadePanel />;
    }

    if (activeTab === "usuarios") {
      return renderUsers();
    }

    if (activeTab === "sistema") {
      return renderSystem();
    }

    return (
      <div className="grid gap-6">
        {renderMetrics()}
        {renderContentStats()}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Ferramentas rápidas
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-cyan-400/15 bg-white p-4 transition hover:border-cyan-400/40 hover:shadow-sm"
              >
                <p className="font-black text-slate-950">{link.title}</p>
                <p className="mt-1 text-sm text-slate-600">{link.text}</p>
              </Link>
            ))}
          </div>
        </div>
        {overview ? (
          <p className="text-[11px] text-slate-500">
            Atualizado: {formatDate(overview.checkedAt)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="grid gap-5 xl:sticky xl:top-28 xl:h-fit">
          <div className="rounded-[1.75rem] border border-cyan-400/20 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
              Proprietário
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Controle total do Planify
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Painel privado com métricas reais, saúde do site e atalhos para
              biblioteca e qualidade IA.
            </p>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="pl-hud-btn-secondary mt-5 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Atualizando…" : "Atualizar dados"}
            </button>
          </div>

          <nav className="rounded-[1.75rem] border border-cyan-400/15 bg-white/80 p-3 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition last:mb-0 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="grid gap-5">
          <div className="rounded-[1.75rem] border border-cyan-400/15 bg-white/90 p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
              Administração
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h3>
            {error ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                {error}
              </div>
            ) : null}
          </div>

          {loading && activeTab !== "qualidade-ia" ? (
            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-50/50 p-8 text-center text-sm font-semibold text-cyan-900">
              Carregando painel…
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminControleClient;
