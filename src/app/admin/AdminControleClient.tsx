"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminQualidadePanel } from "./AdminQualidadePanel";
import { AdminActivityFeed } from "./components/AdminActivityFeed";
import type { InstitutionalPlanKey } from "@/lib/school/institutional-plan";
import { INSTITUTIONAL_PLAN_LABELS } from "@/lib/school/institutional-plan";
import {
  AdminCommandCenterShell,
  AdminPanel,
  AdminStatCard,
  adminButtonDangerClassName,
  adminButtonPrimaryClassName,
  adminInputClassName,
  adminTableClassName,
  adminTableWrapClassName,
  formatAdminDate,
  type AdminTabId,
} from "./components/AdminCommandCenterShell";
import { AdminCommunityModerationPanel } from "./AdminCommunityModerationPanel";
import { AdminCriticalSettings } from "./components/AdminCriticalSettings";
import { AdminFinancialCards } from "./components/AdminFinancialCards";
import { AdminMetricsCharts } from "./components/AdminMetricsCharts";

type AdminSchool = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  memberCount: number;
  classCount: number;
  institutionalPlan: InstitutionalPlanKey | null;
  planLabel: string | null;
  directorUserId: string | null;
  directorEmail: string | null;
  directorName: string | null;
  createdAt: string;
};

type AssignableUserRole = "teacher" | "school_manager" | "admin";

const USER_ROLE_OPTIONS: Array<{ value: AssignableUserRole; label: string }> = [
  { value: "teacher", label: "Professor" },
  { value: "school_manager", label: "Gestor escolar" },
  { value: "admin", label: "Admin" },
];

const USER_STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "pending", label: "Pendente" },
  { value: "blocked", label: "Bloqueado" },
] as const;

const INSTITUTIONAL_PLAN_OPTIONS: Array<{
  value: InstitutionalPlanKey | "";
  label: string;
}> = [
  { value: "", label: "Sem plano" },
  { value: "pequena", label: INSTITUTIONAL_PLAN_LABELS.pequena },
  { value: "media", label: INSTITUTIONAL_PLAN_LABELS.media },
  { value: "grande", label: INSTITUTIONAL_PLAN_LABELS.grande },
];

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

type DashboardMetrics = {
  geminiConsumption: Array<{ date: string; count: number }>;
  geminiSource: string;
  userGrowth: Array<{ date: string; count: number }>;
  schoolsByState: Array<{ state: string; count: number }>;
  financial: {
    mrrEstimatedBrl: number;
    mrrFormula: string;
    mrrBreakdown: {
      subscriptionMrrBrl: number;
      schoolLicenseMrrBrl: number;
      activeSubscriptions: number;
      activeSchoolLicenses: number;
    };
    costPerRequestBrl: number;
    costFormula: string;
    generationsThisMonth: number;
    estimatedMonthlyGeminiCostBrl: number;
    avgTokensPerGeneration: number;
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
  checkedAt: string;
};

const quickLinks = [
  { href: "/admin/biblioteca", title: "Biblioteca Premium" },
  { href: "/dashboard", title: "Painel professor" },
  { href: "/planos", title: "Página de planos" },
];

const supabaseOnlyTasks = [
  "Reset de senha e revogação de sessões em massa",
  "Assinaturas Stripe manuais e reembolsos",
  "Moderação marketplace (aprovar/publicar materiais de terceiros)",
  "Migrations, RLS, backups e logs de infraestrutura",
];

function statusClass(status: HealthCheck["status"]) {
  if (status === "ok") return "border-emerald-500/30 bg-emerald-950/30 text-emerald-300";
  if (status === "warn") return "border-amber-500/30 bg-amber-950/30 text-amber-300";
  return "border-rose-500/30 bg-rose-950/30 text-rose-300";
}

export function AdminControleClient() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("visao-geral");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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
  const [licenseSavingId, setLicenseSavingId] = useState("");
  const [schoolMessage, setSchoolMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(false);
  const [error, setError] = useState("");
  const [platformError, setPlatformError] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userSaving, setUserSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editUserRole, setEditUserRole] = useState<AssignableUserRole>("teacher");
  const [editUserStatus, setEditUserStatus] = useState<string>("active");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AssignableUserRole>("teacher");
  const [newUserMode, setNewUserMode] = useState<"password" | "invite">("password");
  const [newUserSchoolId, setNewUserSchoolId] = useState("");
  const [directorSavingId, setDirectorSavingId] = useState("");
  const [directorDrafts, setDirectorDrafts] = useState<Record<string, string>>({});
  const [proposalDownloading, setProposalDownloading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewRes, healthRes, metricsRes] = await Promise.all([
        fetch("/api/admin/overview", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/site-health", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/metrics", { credentials: "include", cache: "no-store" }),
      ]);

      const overviewJson = await overviewRes.json().catch(() => null);
      const healthJson = await healthRes.json().catch(() => null);
      const metricsJson = await metricsRes.json().catch(() => null);

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
      setMetrics(
        metricsRes.ok && metricsJson?.success
          ? (metricsJson.metrics as DashboardMetrics)
          : null,
      );
    } catch (err) {
      setOverview(null);
      setHealth(null);
      setMetrics(null);
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

  async function updateSchoolLicense(
    schoolId: string,
    institutionalPlan: InstitutionalPlanKey | null,
  ) {
    setLicenseSavingId(schoolId);
    setPlatformError("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: schoolId, institutionalPlan }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível atualizar o plano.");
      }

      await loadSchools();
    } catch (err) {
      setPlatformError(
        err instanceof Error ? err.message : "Erro ao atualizar licença da escola.",
      );
    } finally {
      setLicenseSavingId("");
    }
  }

  async function createUser() {
    const email = newUserEmail.trim();
    if (!email) {
      setUserMessage("Informe o e-mail.");
      return;
    }

    if (newUserMode === "password" && newUserPassword.length < 8) {
      setUserMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setUserSaving(true);
    setUserMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: newUserMode === "password" ? newUserPassword : undefined,
          fullName: newUserName.trim() || undefined,
          role: newUserRole,
          schoolId: newUserSchoolId.trim() || undefined,
          mode: newUserMode,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível criar o usuário.");
      }

      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("teacher");
      setNewUserSchoolId("");
      setUserMessage(
        newUserMode === "invite"
          ? `Convite enviado para ${email}.`
          : `Usuário ${email} criado.`,
      );
      await loadPlatformUsers();
    } catch (err) {
      setUserMessage(err instanceof Error ? err.message : "Erro ao criar usuário.");
    } finally {
      setUserSaving(false);
    }
  }

  function openEditUser(user: PlatformUser) {
    setEditingUser(user);
    setEditUserRole(
      USER_ROLE_OPTIONS.some((option) => option.value === user.role)
        ? (user.role as AssignableUserRole)
        : "teacher",
    );
    setEditUserStatus(user.status);
    setUserMessage("");
  }

  async function saveEditedUser() {
    if (!editingUser) return;

    setUserSaving(true);
    setUserMessage("");

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editUserRole,
          status: editUserStatus,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível atualizar o usuário.");
      }

      setEditingUser(null);
      setUserMessage("Usuário atualizado.");
      await loadPlatformUsers();
    } catch (err) {
      setUserMessage(
        err instanceof Error ? err.message : "Erro ao atualizar usuário.",
      );
    } finally {
      setUserSaving(false);
    }
  }

  async function updateSchoolDirector(schoolId: string, directorEmail: string) {
    setDirectorSavingId(schoolId);
    setPlatformError("");

    try {
      const response = await fetch("/api/admin/schools", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schoolId,
          directorEmail: directorEmail.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível vincular o diretor.");
      }

      setDirectorDrafts((current) => {
        const next = { ...current };
        delete next[schoolId];
        return next;
      });
      await loadSchools();
    } catch (err) {
      setPlatformError(
        err instanceof Error ? err.message : "Erro ao vincular diretor.",
      );
    } finally {
      setDirectorSavingId("");
    }
  }

  async function downloadCommercialProposal() {
    setProposalDownloading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/commercial-proposal-pdf", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error?.message || "Não foi possível gerar a proposta comercial.",
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "proposta-comercial-b2b-planify.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao baixar PDF da proposta.",
      );
    } finally {
      setProposalDownloading(false);
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
    if (activeTab === "escolas") void loadSchools();
    if (activeTab === "usuarios") {
      void loadSchools();
      void loadPlatformUsers();
    }
    if (activeTab === "materiais") void loadPlatformMaterials();
  }, [activeTab, loadPlatformMaterials, loadPlatformUsers, loadSchools]);

  function renderCommandCenter() {
    if (!overview) return null;

    return (
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Usuários" value={overview.users.total} detail="perfis" />
          <AdminStatCard
            label="Assinaturas"
            value={overview.users.activeSubscriptions}
            detail="Stripe ativas"
            accent="emerald"
          />
          <AdminStatCard
            label="Gerações 24h"
            value={overview.generations.last24h}
            detail={`${overview.generations.last7d} em 7d`}
            accent="violet"
          />
          <AdminStatCard
            label="Créditos"
            value={overview.credits.totalBalance}
            detail={`${overview.credits.walletsWithBalance} carteiras`}
            accent="amber"
          />
        </div>

        {metrics ? (
          <>
            <AdminFinancialCards financial={metrics.financial} />
            <AdminMetricsCharts
              geminiConsumption={metrics.geminiConsumption}
              geminiSource={metrics.geminiSource}
              userGrowth={metrics.userGrowth}
              schoolsByState={metrics.schoolsByState}
            />
          </>
        ) : null}

        <AdminActivityFeed />

        <AdminPanel
          title="Proposta Comercial B2B"
          subtitle="Ferramenta interna de marketing · PDF corporativo de 4 páginas"
        >
          <p className="text-sm text-slate-400">
            Gera o documento institucional para diretores, mantenedores e
            coordenadores pedagógicos, com capa, diagnóstico, ecossistema Planify
            e programa escola piloto.
          </p>
          <button
            type="button"
            onClick={() => void downloadCommercialProposal()}
            disabled={proposalDownloading}
            className={`${adminButtonPrimaryClassName(proposalDownloading)} mt-4`}
          >
            {proposalDownloading
              ? "Gerando PDF…"
              : "Baixar PDF da Proposta Comercial"}
          </button>
        </AdminPanel>

        <AdminPanel title="Atalhos">
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="pl-admin-btn-ghost px-4 py-2"
              >
                {link.title}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Dados de {formatAdminDate(overview.checkedAt)}
            {metrics ? ` · métricas ${formatAdminDate(metrics.checkedAt)}` : ""}
          </p>
        </AdminPanel>
      </div>
    );
  }

  function renderUsers() {
    return (
      <div className="grid gap-4">
        <AdminPanel
          title="Novo usuário"
          subtitle="Senha direta ou convite por e-mail · proprietário não pode ser criado aqui"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
              placeholder="E-mail"
              className={adminInputClassName()}
            />
            <input
              type="text"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              placeholder="Nome completo"
              className={adminInputClassName()}
            />
            <select
              value={newUserRole}
              onChange={(event) =>
                setNewUserRole(event.target.value as AssignableUserRole)
              }
              className={adminInputClassName()}
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={newUserMode}
              onChange={(event) =>
                setNewUserMode(event.target.value as "password" | "invite")
              }
              className={adminInputClassName()}
            >
              <option value="password">Criar com senha</option>
              <option value="invite">Enviar convite</option>
            </select>
            {newUserMode === "password" ? (
              <input
                type="password"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                placeholder="Senha (mín. 8 caracteres)"
                className={adminInputClassName()}
              />
            ) : null}
            <select
              value={newUserSchoolId}
              onChange={(event) => setNewUserSchoolId(event.target.value)}
              className={adminInputClassName()}
            >
              <option value="">Sem escola vinculada</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void createUser()}
              disabled={userSaving}
              className={`${adminButtonPrimaryClassName(userSaving)} sm:col-span-2`}
            >
              {userSaving ? "Salvando…" : "Criar usuário"}
            </button>
          </div>
          {userMessage ? (
            <p className="mt-2 text-sm text-cyan-400">{userMessage}</p>
          ) : null}
        </AdminPanel>

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="E-mail, nome ou escola"
            className={`${adminInputClassName()} min-w-[16rem] flex-1`}
          />
          <button
            type="button"
            onClick={() => void loadPlatformUsers(userQuery)}
            disabled={platformLoading}
            className={adminButtonPrimaryClassName(platformLoading)}
          >
            Buscar
          </button>
        </div>

        <div className={adminTableWrapClassName()}>
          <table className={adminTableClassName()}>
            <thead>
              <tr>
                <th className="px-3 py-2.5">Usuário</th>
                <th className="px-3 py-2.5">Papel</th>
                <th className="px-3 py-2.5">Plano</th>
                <th className="px-3 py-2.5">Cadastro</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {platformUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                platformUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-200">
                        {user.fullName || user.email}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      {user.schoolName ? (
                        <p className="text-xs text-slate-600">{user.schoolName}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-violet-300">
                        {user.role}
                      </span>
                      <span className="ml-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-cyan-400/90">
                      {user.planKey || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {formatAdminDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      {user.role === "owner" ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditUser(user)}
                          className="pl-admin-btn-ghost px-3 py-1.5 text-xs"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editingUser ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="pl-admin-panel w-full max-w-md p-5">
              <p className="text-sm font-semibold text-slate-200">Editar usuário</p>
              <p className="mt-1 text-xs text-slate-500">{editingUser.email}</p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-xs text-slate-500">
                  Papel
                  <select
                    value={editUserRole}
                    onChange={(event) =>
                      setEditUserRole(event.target.value as AssignableUserRole)
                    }
                    className={adminInputClassName()}
                  >
                    {USER_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-slate-500">
                  Status
                  <select
                    value={editUserStatus}
                    onChange={(event) => setEditUserStatus(event.target.value)}
                    className={adminInputClassName()}
                  >
                    {USER_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="pl-admin-btn-ghost px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveEditedUser()}
                  disabled={userSaving}
                  className={adminButtonPrimaryClassName(userSaving)}
                >
                  {userSaving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderSchools() {
    return (
      <div className="grid gap-4">
        <AdminPanel title="Nova escola" subtitle="Cadastro B2B · licença definida na tabela abaixo">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="text"
              value={newSchoolName}
              onChange={(event) => setNewSchoolName(event.target.value)}
              placeholder="Nome da escola"
              className={`${adminInputClassName()} sm:col-span-3`}
            />
            <input
              type="text"
              value={newSchoolCity}
              onChange={(event) => setNewSchoolCity(event.target.value)}
              placeholder="Cidade"
              className={adminInputClassName()}
            />
            <input
              type="text"
              value={newSchoolState}
              onChange={(event) => setNewSchoolState(event.target.value)}
              placeholder="UF"
              className={adminInputClassName()}
            />
            <button
              type="button"
              onClick={() => void createSchool()}
              disabled={schoolSaving}
              className={adminButtonPrimaryClassName(schoolSaving)}
            >
              {schoolSaving ? "Criando…" : "Criar escola"}
            </button>
          </div>
          {schoolMessage ? (
            <p className="mt-2 text-sm text-cyan-400">{schoolMessage}</p>
          ) : null}
        </AdminPanel>

        <div className={adminTableWrapClassName()}>
          <table className={adminTableClassName()}>
            <thead>
              <tr>
                <th className="px-3 py-2.5">Escola</th>
                <th className="px-3 py-2.5">Local</th>
                <th className="px-3 py-2.5">Licença</th>
                <th className="px-3 py-2.5">Diretor</th>
                <th className="px-3 py-2.5">Membros</th>
                <th className="px-3 py-2.5">Turmas</th>
                <th className="px-3 py-2.5">Criada</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    Nenhuma escola cadastrada.
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td className="px-3 py-2.5 font-medium text-slate-200">{school.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {[school.city, school.state].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={school.institutionalPlan || ""}
                        disabled={licenseSavingId === school.id}
                        onChange={(event) => {
                          const value = event.target.value;
                          void updateSchoolLicense(
                            school.id,
                            value ? (value as InstitutionalPlanKey) : null,
                          );
                        }}
                        className={`${adminInputClassName()} max-w-[11rem] text-xs`}
                      >
                        {INSTITUTIONAL_PLAN_OPTIONS.map((option) => (
                          <option key={option.value || "none"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-[12rem] flex-col gap-1">
                        {school.directorEmail ? (
                          <p className="text-xs text-slate-400">
                            {school.directorName || school.directorEmail}
                          </p>
                        ) : null}
                        <div className="flex gap-1">
                          <input
                            type="email"
                            value={
                              directorDrafts[school.id] ??
                              school.directorEmail ??
                              ""
                            }
                            onChange={(event) =>
                              setDirectorDrafts((current) => ({
                                ...current,
                                [school.id]: event.target.value,
                              }))
                            }
                            placeholder="E-mail do diretor"
                            className={`${adminInputClassName()} text-xs`}
                          />
                          <button
                            type="button"
                            disabled={directorSavingId === school.id}
                            onClick={() =>
                              void updateSchoolDirector(
                                school.id,
                                directorDrafts[school.id] ??
                                  school.directorEmail ??
                                  "",
                              )
                            }
                            className={adminButtonPrimaryClassName(
                              directorSavingId === school.id,
                            )}
                          >
                            {directorSavingId === school.id ? "…" : "OK"}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{school.memberCount}</td>
                    <td className="px-3 py-2.5">{school.classCount}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {formatAdminDate(school.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600">
          Vincule o diretor pelo e-mail (conta deve existir). Convites e turmas seguem em /gestor.
        </p>
      </div>
    );
  }

  function renderMaterials() {
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={materialQuery}
            onChange={(event) => setMaterialQuery(event.target.value)}
            placeholder="Título ou tipo"
            className={`${adminInputClassName()} min-w-[16rem] flex-1`}
          />
          <button
            type="button"
            onClick={() => void loadPlatformMaterials(materialQuery)}
            disabled={platformLoading}
            className={adminButtonPrimaryClassName(platformLoading)}
          >
            Buscar
          </button>
        </div>

        <div className={adminTableWrapClassName()}>
          <table className={adminTableClassName()}>
            <thead>
              <tr>
                <th className="px-3 py-2.5">Material</th>
                <th className="px-3 py-2.5">Autor</th>
                <th className="px-3 py-2.5">BNCC</th>
                <th className="px-3 py-2.5">Quando</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {platformMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Nenhum material encontrado.
                  </td>
                </tr>
              ) : (
                platformMaterials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-200">{material.title}</p>
                      <p className="text-xs text-slate-500">{material.tipo}</p>
                      {material.className ? (
                        <p className="text-xs text-slate-600">Turma {material.className}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {material.userEmail || "—"}
                      {material.schoolName ? ` · ${material.schoolName}` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-emerald-400">{material.bnccCount}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {formatAdminDate(material.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => void deleteMaterial(material.id)}
                        className={adminButtonDangerClassName()}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSystem() {
    if (!health) return null;

    return (
      <div className="grid gap-4">
        {health.checks.map((check) => (
          <div
            key={check.id}
            className={`rounded-lg border p-4 ${statusClass(check.status)}`}
          >
            <p className="font-bold">{check.label}</p>
            <p className="mt-1 text-sm opacity-90">{check.detail}</p>
          </div>
        ))}

        <AdminPanel title="Flags de ambiente">
          <div className="grid gap-2 sm:grid-cols-2">
            {health.featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2.5"
              >
                <span className="text-xs text-slate-400">{flag.label}</span>
                <span
                  className={`text-xs font-semibold ${
                    flag.enabled ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {flag.enabled ? "Ativo" : "Inativo"}
                </span>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminCriticalSettings />

        <AdminPanel
          title="Ainda requer Supabase ou painéis externos"
          subtitle="Operações não expostas neste admin"
        >
          <ul className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
            {supabaseOnlyTasks.map((task) => (
              <li key={task} className="flex gap-2">
                <span className="text-slate-600">·</span>
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    );
  }

  function renderTabContent() {
    if (activeTab === "qualidade-ia") {
      return (
        <div className="pl-admin-panel p-4 [&_.text-slate-950]:text-slate-100 [&_.text-slate-600]:text-slate-400 [&_.bg-white]:bg-[#0d121c] [&_.border-slate-200]:border-slate-800">
          <AdminQualidadePanel />
        </div>
      );
    }

    if (activeTab === "escolas") return renderSchools();
    if (activeTab === "usuarios") return renderUsers();
    if (activeTab === "materiais") return renderMaterials();
    if (activeTab === "comunidade") return <AdminCommunityModerationPanel />;
    if (activeTab === "sistema") return renderSystem();
    return renderCommandCenter();
  }

  const isLoading =
    (loading && activeTab === "visao-geral") ||
    (platformLoading &&
      (activeTab === "escolas" ||
        activeTab === "usuarios" ||
        activeTab === "materiais"));

  return (
    <AdminCommandCenterShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={() => void loadData()}
      refreshing={loading}
      error={error || platformError || undefined}
    >
      {isLoading ? (
        <div className="pl-admin-panel p-10 text-center text-sm text-slate-500">
          Carregando…
        </div>
      ) : (
        renderTabContent()
      )}
    </AdminCommandCenterShell>
  );
}

export default AdminControleClient;
