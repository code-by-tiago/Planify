"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminQualidadePanel } from "./AdminQualidadePanel";

type Tab =
  | "visao-geral"
  | "qualidade-ia"
  | "escolas"
  | "usuarios"
  | "materiais"
  | "sistema";

type AdminSchool = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  memberCount: number;
  classCount: number;
  createdAt: string;
};

type PlatformUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  planKey: string | null;
  schoolName: string | null;
  createdAt: string;
};

type PlatformMaterial = {
  id: string;
  title: string;
  tipo: string;
  userEmail: string | null;
  schoolName: string | null;
  className: string | null;
  bnccCount: number;
  createdAt: string;
};

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
  { id: "escolas", label: "Escolas" },
  { id: "usuarios", label: "Usuários" },
  { id: "materiais", label: "Materiais IA" },
  { id: "qualidade-ia", label: "Qualidade IA" },
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
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [platformMaterials, setPlatformMaterials] = useState<PlatformMaterial[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCity, setNewSchoolCity] = useState("");
  const [newSchoolState, setNewSchoolState] = useState("");
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolMessage, setSchoolMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [error, setError] = useState("");
  const [platformError, setPlatformError] = useState("");

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

  const loadSchools = useCallback(async () => {
    setPlatformLoading(true);
    setPlatformError("");

    try {
      const response = await fetch("/api/admin/schools", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar escolas.");
      }

      setSchools((data.schools || []) as AdminSchool[]);
    } catch (err) {
      setSchools([]);
      setPlatformError(err instanceof Error ? err.message : "Erro ao carregar escolas.");
    } finally {
      setPlatformLoading(false);
    }
  }, []);

  const loadPlatformUsers = useCallback(async (query = userQuery) => {
    setPlatformLoading(true);
    setPlatformError("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("limit", "100");

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar usuários.");
      }

      setPlatformUsers((data.users || []) as PlatformUser[]);
    } catch (err) {
      setPlatformUsers([]);
      setPlatformError(err instanceof Error ? err.message : "Erro ao carregar usuários.");
    } finally {
      setPlatformLoading(false);
    }
  }, [userQuery]);

  const loadPlatformMaterials = useCallback(async (query = materialQuery) => {
    setPlatformLoading(true);
    setPlatformError("");

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("limit", "100");

      const response = await fetch(`/api/admin/materials?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar materiais.");
      }

      setPlatformMaterials((data.materials || []) as PlatformMaterial[]);
    } catch (err) {
      setPlatformMaterials([]);
      setPlatformError(
        err instanceof Error ? err.message : "Erro ao carregar materiais.",
      );
    } finally {
      setPlatformLoading(false);
    }
  }, [materialQuery]);

  async function createSchool() {
    const name = newSchoolName.trim();
    if (!name) {
      setSchoolMessage("Informe o nome da escola.");
      return;
    }

    setSchoolSaving(true);
    setSchoolMessage("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city: newSchoolCity.trim() || undefined,
          state: newSchoolState.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível criar a escola.");
      }

      setNewSchoolName("");
      setNewSchoolCity("");
      setNewSchoolState("");
      setSchoolMessage(`Escola "${data.school?.name || name}" criada.`);
      await loadSchools();
    } catch (err) {
      setSchoolMessage(err instanceof Error ? err.message : "Erro ao criar escola.");
    } finally {
      setSchoolSaving(false);
    }
  }

  async function deleteMaterial(materialId: string) {
    if (!window.confirm("Excluir este material gerado? Esta ação não pode ser desfeita.")) {
      return;
    }

    setPlatformLoading(true);
    setPlatformError("");

    try {
      const response = await fetch(`/api/admin/materials?id=${encodeURIComponent(materialId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível excluir o material.");
      }

      await loadPlatformMaterials();
    } catch (err) {
      setPlatformError(err instanceof Error ? err.message : "Erro ao excluir material.");
      setPlatformLoading(false);
    }
  }

  useEffect(() => {
    void loadData();

    if (typeof window !== "undefined" && window.location.hash === "#qualidade-ia") {
      setActiveTab("qualidade-ia");
    }
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "escolas") {
      void loadSchools();
    }
    if (activeTab === "usuarios") {
      void loadPlatformUsers();
    }
    if (activeTab === "materiais") {
      void loadPlatformMaterials();
    }
  }, [activeTab, loadPlatformMaterials, loadPlatformUsers, loadSchools]);

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
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Buscar por e-mail, nome ou escola"
            className="min-w-[16rem] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadPlatformUsers(userQuery)}
            disabled={platformLoading}
            className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            Buscar
          </button>
        </div>

        {platformUsers.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum usuário encontrado.</p>
        ) : (
          platformUsers.map((user) => (
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
                  {user.schoolName ? (
                    <p className="mt-1 text-xs text-slate-500">Escola: {user.schoolName}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                    {user.status}
                  </span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase text-violet-800">
                    {user.role}
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

  function renderSchools() {
    return (
      <div className="grid gap-6">
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-50/80 p-5">
          <p className="text-sm font-black text-slate-950">Nova escola</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={newSchoolName}
              onChange={(event) => setNewSchoolName(event.target.value)}
              placeholder="Nome da escola"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm sm:col-span-3"
            />
            <input
              type="text"
              value={newSchoolCity}
              onChange={(event) => setNewSchoolCity(event.target.value)}
              placeholder="Cidade"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
            <input
              type="text"
              value={newSchoolState}
              onChange={(event) => setNewSchoolState(event.target.value)}
              placeholder="UF"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => void createSchool()}
              disabled={schoolSaving}
              className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {schoolSaving ? "Criando…" : "Criar escola"}
            </button>
          </div>
          {schoolMessage ? (
            <p className="mt-3 text-sm font-semibold text-cyan-800">{schoolMessage}</p>
          ) : null}
        </div>

        {schools.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma escola cadastrada.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Escola</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Membros</th>
                  <th className="px-4 py-3">Turmas</th>
                  <th className="px-4 py-3">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-950">{school.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {[school.city, school.state].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3">{school.memberCount}</td>
                    <td className="px-4 py-3">{school.classCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(school.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderMaterials() {
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={materialQuery}
            onChange={(event) => setMaterialQuery(event.target.value)}
            placeholder="Buscar por título ou tipo"
            className="min-w-[16rem] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadPlatformMaterials(materialQuery)}
            disabled={platformLoading}
            className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            Buscar
          </button>
        </div>

        {platformMaterials.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum material gerado encontrado.</p>
        ) : (
          platformMaterials.map((material) => (
            <article
              key={material.id}
              className="rounded-2xl border border-cyan-400/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{material.title}</p>
                  <p className="text-sm text-slate-600">{material.tipo}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {material.userEmail || "Usuário desconhecido"}
                    {material.schoolName ? ` · ${material.schoolName}` : ""}
                    {material.className ? ` · Turma ${material.className}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-800">
                    {material.bnccCount} BNCC
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteMaterial(material.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Gerado em: {formatDate(material.createdAt)}
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

    if (activeTab === "escolas") {
      return renderSchools();
    }

    if (activeTab === "usuarios") {
      return renderUsers();
    }

    if (activeTab === "materiais") {
      return renderMaterials();
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
            {error || platformError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                {error || platformError}
              </div>
            ) : null}
          </div>

          {(loading && activeTab === "visao-geral") ||
          (platformLoading &&
            (activeTab === "escolas" ||
              activeTab === "usuarios" ||
              activeTab === "materiais")) ? (
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
