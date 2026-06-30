"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { HUD_FIELD_CLASS } from "@/lib/pro/hud-form-styles";
import {
  formatGenerationError,
  GenerationErrorBanner,
} from "@/lib/pro/generation-error-ui";
import type { SchoolDashboardResponse } from "@/lib/bncc/types";
import type {
  SchoolClassItem,
  SchoolClassesResponse,
  SchoolMaterialAuditRow,
  SchoolMaterialsResponse,
  SchoolTeacherMember,
  SchoolTeachersResponse,
} from "@/lib/school/types";
import {
  gestorPathForSection,
  gestorSectionFromLegacyTab,
  gestorSectionFromPath,
  type GestorSectionId,
} from "@/lib/school/gestor-routes";

type DirectorPanelClientProps = {
  embedded?: boolean;
};

function resolveGestorSection(
  pathname: string,
  legacyTab: string | null,
): GestorSectionId {
  const fromPath = gestorSectionFromPath(pathname);
  if (fromPath !== "overview") return fromPath;

  const fromLegacy = gestorSectionFromLegacyTab(legacyTab);
  if (fromLegacy) return fromLegacy;

  return "overview";
}

type MaterialFilters = {
  professorId: string;
  period: "all" | "month" | "quarter" | "year";
  discipline: string;
};

type TurmaFormState = {
  name: string;
  gradeLevel: string;
  discipline: string;
  teacherUserId: string;
};

const EMPTY_TURMA_FORM: TurmaFormState = {
  name: "",
  gradeLevel: "",
  discipline: "",
  teacherUserId: "",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function memberDisplayName(member: Pick<SchoolTeacherMember, "fullName" | "email">): string {
  const fullName = member.fullName?.trim();
  const email = member.email?.trim();
  return fullName || email || "Professor";
}

function exportMaterialsCsv(rows: SchoolMaterialAuditRow[], schoolName: string) {
  const headers = [
    "Professor",
    "E-mail",
    "Título",
    "Tipo",
    "Turma",
    "Disciplina",
    "Habilidades BNCC",
    "Data",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.professorName || "",
        row.professorEmail || "",
        row.title,
        row.tipo,
        row.className || "",
        row.discipline || "",
        row.bnccSkillCodes.join("; "),
        formatDate(row.createdAt),
      ]
        .map((value) => escape(String(value)))
        .join(","),
    ),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `materiais-${schoolName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "escola"}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function BnccProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function RestrictedAccessPanel() {
  return (
    <section className="flex flex-1 items-center justify-center p-6 sm:p-10">
      <div className="max-w-lg rounded-[1.75rem] border border-amber-200/80 bg-gradient-to-b from-amber-50/80 to-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <PlanifyIcon name="lock" className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-amber-700">
          Acesso restrito
        </p>
        <h1 className="mt-3 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
          Painel exclusivo para gestores escolares
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-slate-600">
          Esta área é exclusiva para quem administra uma escola no Planify
          (diretor ou gestor institucional). Professores acompanham o próprio
          progresso BNCC em Progresso BNCC.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="pl-hud-btn inline-flex justify-center rounded-xl px-6 py-3 text-sm font-bold"
          >
            Voltar ao painel
          </Link>
          <Link
            href="/progresso-bncc"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300"
          >
            Meu progresso BNCC
          </Link>
        </div>
      </div>
    </section>
  );
}

export function DirectorPanelClient({ embedded = false }: DirectorPanelClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = usePlanifyAccess();
  const [dashboard, setDashboard] = useState<SchoolDashboardResponse | null>(null);
  const [teachers, setTeachers] = useState<SchoolTeachersResponse | null>(null);
  const [classes, setClasses] = useState<SchoolClassesResponse | null>(null);
  const [materials, setMaterials] = useState<SchoolMaterialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorRetryable, setErrorRetryable] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [materialsError, setMaterialsError] = useState("");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const tab = useMemo(
    () => resolveGestorSection(pathname, searchParams.get("tab")),
    [pathname, searchParams],
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [turmaForm, setTurmaForm] = useState<TurmaFormState>(EMPTY_TURMA_FORM);
  const [turmaSaving, setTurmaSaving] = useState(false);
  const [turmaMessage, setTurmaMessage] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TurmaFormState>(EMPTY_TURMA_FORM);
  const [materialFilters, setMaterialFilters] = useState<MaterialFilters>({
    professorId: "",
    period: "all",
    discipline: "",
  });
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);

  const GESTOR_POLL_MS = 60_000;

  const loadDashboard = useCallback(async () => {
    if (!access.canViewDirectorPanel) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await planifyAuthenticatedFetch("/api/school/dashboard");
      const data = (await response.json()) as {
        success?: boolean;
        dashboard?: SchoolDashboardResponse;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível carregar o painel.");
      }

      setDashboard(data.dashboard || null);
    } catch (err) {
      const formatted = formatGenerationError(err);
      setError(formatted.message);
      setErrorRetryable(formatted.retryable);
    } finally {
      setLoading(false);
    }
  }, [access.canViewDirectorPanel]);

  const loadTeachers = useCallback(async () => {
    if (!access.canViewDirectorPanel) return;

    setTeachersLoading(true);

    try {
      const response = await planifyAuthenticatedFetch("/api/school/teachers");
      const data = (await response.json()) as {
        success?: boolean;
        teachers?: SchoolTeachersResponse;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível carregar professores.");
      }

      setTeachers(data.teachers || null);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erro ao carregar professores.");
    } finally {
      setTeachersLoading(false);
    }
  }, [access.canViewDirectorPanel]);

  const loadClasses = useCallback(async () => {
    if (!access.canViewDirectorPanel) return;

    setClassesLoading(true);
    setClassesError("");

    try {
      const response = await planifyAuthenticatedFetch("/api/school/classes");
      const data = (await response.json()) as {
        success?: boolean;
        classes?: SchoolClassesResponse;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível carregar turmas.");
      }

      setClasses(data.classes || null);
    } catch (err) {
      setClassesError(err instanceof Error ? err.message : "Erro ao carregar turmas.");
    } finally {
      setClassesLoading(false);
    }
  }, [access.canViewDirectorPanel]);

  const loadMaterials = useCallback(async () => {
    if (!access.canViewDirectorPanel) return;

    setMaterialsLoading(true);
    setMaterialsError("");

    const params = new URLSearchParams();
    if (materialFilters.professorId) params.set("professorId", materialFilters.professorId);
    if (materialFilters.period !== "all") params.set("period", materialFilters.period);
    if (materialFilters.discipline) params.set("discipline", materialFilters.discipline);
    params.set("limit", "500");

    try {
      const response = await planifyAuthenticatedFetch(
        `/api/school/materials?${params.toString()}`,
      );
      const data = (await response.json()) as {
        success?: boolean;
        materials?: SchoolMaterialsResponse;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível carregar materiais.");
      }

      setMaterials(data.materials || null);
    } catch (err) {
      setMaterialsError(err instanceof Error ? err.message : "Erro ao carregar materiais.");
    } finally {
      setMaterialsLoading(false);
    }
  }, [access.canViewDirectorPanel, materialFilters]);

  useEffect(() => {
    if (access.loading) return;
    void loadDashboard();
  }, [access.loading, loadDashboard]);

  useEffect(() => {
    if (access.loading || !access.canViewDirectorPanel || tab !== "overview") return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void loadDashboard();
    }, GESTOR_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [access.loading, access.canViewDirectorPanel, tab, loadDashboard]);

  useEffect(() => {
    if (pathname !== "/gestor" && pathname !== "/diretor") return;
    const legacyTab = searchParams.get("tab");
    const section = gestorSectionFromLegacyTab(legacyTab);
    if (!section || section === "overview") return;
    router.replace(gestorPathForSection(section));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (access.loading || !access.canViewDirectorPanel) return;
    if (tab === "teachers" || tab === "turmas") {
      void loadTeachers();
    }
  }, [access.loading, access.canViewDirectorPanel, tab, loadTeachers]);

  useEffect(() => {
    if (access.loading || !access.canViewDirectorPanel || tab !== "turmas") return;
    void loadClasses();
  }, [access.loading, access.canViewDirectorPanel, tab, loadClasses]);

  useEffect(() => {
    if (access.loading || !access.canViewDirectorPanel || tab !== "materiais") return;
    void loadMaterials();
  }, [access.loading, access.canViewDirectorPanel, tab, loadMaterials]);

  const teacherOptions = useMemo(
    () => teachers?.activeTeachers || [],
    [teachers?.activeTeachers],
  );

  async function revokeTeacher(teacherUserId: string) {
    setRevokeLoadingId(teacherUserId);
    setInviteError("");
    setInviteMessage("");

    try {
      const response = await planifyAuthenticatedFetch(
        `/api/school/teachers/${teacherUserId}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível revogar a licença.");
      }

      setInviteMessage(data.message || "Licença revogada com sucesso.");
      void loadDashboard();
      void loadTeachers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erro ao revogar licença.");
    } finally {
      setRevokeLoadingId(null);
    }
  }

  async function cancelInvite(inviteId: string) {
    setRevokeLoadingId(inviteId);
    setInviteError("");
    setInviteMessage("");

    try {
      const response = await planifyAuthenticatedFetch(`/api/school/invite/${inviteId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível cancelar o convite.");
      }

      setInviteMessage(data.message || "Convite cancelado com sucesso.");
      void loadDashboard();
      void loadTeachers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erro ao cancelar convite.");
    } finally {
      setRevokeLoadingId(null);
    }
  }

  async function inviteTeacher() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setInviteError("Informe um e-mail válido.");
      return;
    }

    setInviteLoading(true);
    setInviteError("");
    setInviteMessage("");

    try {
      const response = await planifyAuthenticatedFetch("/api/school/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_professor: email }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        result?: { status?: string; message?: string };
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível enviar o convite.");
      }

      setInviteMessage(
        data.result?.message ||
          (data.result?.status === "accepted"
            ? "Professor vinculado à escola com sucesso."
            : "Convite registrado. O professor será vinculado ao criar conta com este e-mail."),
      );
      setInviteEmail("");
      void loadDashboard();
      void loadTeachers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erro ao convidar professor.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function createTurma() {
    const name = turmaForm.name.trim();
    if (!name) {
      setClassesError("Informe o nome da turma.");
      return;
    }

    setTurmaSaving(true);
    setClassesError("");
    setTurmaMessage("");

    try {
      const response = await planifyAuthenticatedFetch("/api/school/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gradeLevel: turmaForm.gradeLevel.trim() || null,
          discipline: turmaForm.discipline.trim() || null,
          teacherUserId: turmaForm.teacherUserId || null,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível criar a turma.");
      }

      setTurmaMessage("Turma criada com sucesso.");
      setTurmaForm(EMPTY_TURMA_FORM);
      void loadClasses();
      void loadDashboard();
    } catch (err) {
      setClassesError(err instanceof Error ? err.message : "Erro ao criar turma.");
    } finally {
      setTurmaSaving(false);
    }
  }

  function startEditTurma(row: SchoolClassItem) {
    setEditingClassId(row.id);
    setEditForm({
      name: row.name,
      gradeLevel: row.gradeLevel || "",
      discipline: row.discipline || "",
      teacherUserId: row.teacherUserId || "",
    });
    setTurmaMessage("");
    setClassesError("");
  }

  async function saveEditTurma() {
    if (!editingClassId) return;

    const name = editForm.name.trim();
    if (!name) {
      setClassesError("Informe o nome da turma.");
      return;
    }

    setTurmaSaving(true);
    setClassesError("");
    setTurmaMessage("");

    try {
      const response = await planifyAuthenticatedFetch(
        `/api/school/classes/${editingClassId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            gradeLevel: editForm.gradeLevel.trim() || null,
            discipline: editForm.discipline.trim() || null,
            teacherUserId: editForm.teacherUserId || null,
          }),
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível atualizar a turma.");
      }

      setTurmaMessage("Turma atualizada com sucesso.");
      setEditingClassId(null);
      void loadClasses();
      void loadDashboard();
    } catch (err) {
      setClassesError(err instanceof Error ? err.message : "Erro ao atualizar turma.");
    } finally {
      setTurmaSaving(false);
    }
  }

  if (access.loading) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
      </div>
    );
  }

  if (!access.authenticated) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
            <PlanifyIcon name="user" className="h-6 w-6" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Faça login</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Entre na sua conta para acessar o painel do gestor.
          </p>
          <Link
            href="/login?redirect=/gestor"
            className="pl-hud-btn mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Entrar
          </Link>
        </div>
      </section>
    );
  }

  if (!access.canViewDirectorPanel) {
    return <RestrictedAccessPanel />;
  }

  const schoolLabel = dashboard?.schoolName || materials?.schoolName || "sua escola";

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${
        embedded ? "" : "planify-hud planify-ui3 bg-[var(--planify-canvas)]"
      }`}
    >
      {!embedded ? (
        <div className="shrink-0 overflow-hidden rounded-none border-b border-cyan-400/15 bg-white/90">
          <PlanifyPageHero
            badge="Gestão escolar"
            icon="clipboard"
            title="Painel do Gestor"
            description={`${schoolLabel} — turmas, professores, materiais e conformidade BNCC em tempo real.`}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          {tab === "overview" ? (
            loading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
              </div>
            ) : error ? (
              <GenerationErrorBanner
                message={error}
                retryable={errorRetryable}
                onRetry={() => void loadDashboard()}
                retrying={loading}
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <article className="pl-hud-glass rounded-2xl border border-cyan-400/20 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
                          Professores vinculados
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {dashboard?.activeTeachers ?? 0}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                        <PlanifyIcon name="user" className="h-5 w-5" />
                      </span>
                    </div>
                    <Link
                      href={gestorPathForSection("teachers")}
                      className="mt-3 text-xs font-bold text-cyan-700 underline-offset-2 hover:underline"
                    >
                      Gerenciar professores →
                    </Link>
                  </article>

                  <Link
                    href={gestorPathForSection("materiais")}
                    className="pl-hud-glass rounded-2xl border border-violet-400/20 p-5 text-left transition hover:border-violet-400/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
                          Materiais no mês
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {dashboard?.materialsThisMonth ?? 0}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <PlanifyIcon name="spark" className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold text-violet-700 underline-offset-2 hover:underline">
                      Ver auditoria de materiais →
                    </p>
                  </Link>

                  <article className="pl-hud-glass rounded-2xl border border-emerald-400/20 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                          Cobertura BNCC média
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {dashboard?.avgBnccCompliance ?? 0}%
                        </p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <PlanifyIcon name="listChecks" className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-3">
                      <BnccProgressBar percent={dashboard?.avgBnccCompliance ?? 0} />
                    </div>
                  </article>
                </div>

                {(dashboard?.atRiskClasses || []).length > 0 ? (
                  <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-sm">
                    <div className="border-b border-amber-100 px-4 py-4 sm:px-6">
                      <h2 className="text-base font-black text-amber-900">
                        Lacunas e atrasos pedagógicos
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-amber-800/80">
                        Turmas com cobertura BNCC abaixo de 50% ou mais habilidades pendentes
                        do que cobertas — antecipe ajustes antes do calendário letivo.
                      </p>
                    </div>
                    <ul className="divide-y divide-amber-100">
                      {dashboard?.atRiskClasses.map((row) => (
                        <li
                          key={row.classId}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-950">{row.className}</p>
                            <p className="text-xs font-semibold text-slate-500">
                              {row.pendingCount} habilidade(s) pendente(s)
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                            {row.coveragePercent}% BNCC
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {(dashboard?.teacherProductivity || []).length > 0 ? (
                  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                      <h2 className="text-base font-black text-slate-950">
                        Produtividade docente
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Materiais e planejamentos gerados por professor neste mês.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 sm:px-6">Professor</th>
                            <th className="px-4 py-3">Materiais (mês)</th>
                            <th className="px-4 py-3">Planejamentos (mês)</th>
                            <th className="px-4 py-3 sm:px-6">Última atividade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dashboard?.teacherProductivity.map((row) => (
                            <tr key={row.userId} className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-black text-slate-950 sm:px-6">
                                {row.name}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700">
                                {row.materialsThisMonth}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700">
                                {row.planningsThisMonth}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600 sm:px-6">
                                {row.lastActivityAt ? formatDate(row.lastActivityAt) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                    <div>
                      <h2 className="text-base font-black text-slate-950">Turmas e progresso BNCC</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Clique numa turma para ver disciplina, professor(a) e detalhes de cobertura.
                      </p>
                    </div>
                    <Link
                      href={gestorPathForSection("turmas")}
                      className="text-xs font-bold text-cyan-700 underline-offset-2 hover:underline"
                    >
                      Gerenciar turmas →
                    </Link>
                  </div>

                  {(dashboard?.classes || []).length === 0 ? (
                    <p className="p-6 text-sm font-semibold text-slate-500">
                      Nenhuma turma cadastrada ainda.{" "}
                      <Link
                        href={gestorPathForSection("turmas")}
                        className="font-bold text-cyan-700 underline-offset-2 hover:underline"
                      >
                        Cadastrar turmas
                      </Link>
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {dashboard?.classes.map((row) => {
                        const expanded = expandedClassId === row.classId;
                        return (
                          <li key={row.classId}>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedClassId(expanded ? null : row.classId)
                              }
                              className="flex w-full flex-wrap items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-6"
                            >
                              <PlanifyIcon
                                name={expanded ? "chevronDown" : "chevronRight"}
                                className="h-4 w-4 shrink-0 text-slate-400"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-950">{row.className}</p>
                                <p className="text-xs font-semibold text-slate-500">
                                  {row.discipline || "Disciplina não informada"}
                                  {row.gradeLevel ? ` · ${row.gradeLevel}` : ""}
                                </p>
                              </div>
                              <div className="w-full min-w-[120px] sm:w-36">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-lg font-black text-cyan-700">
                                    {row.coveragePercent}%
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                    BNCC
                                  </span>
                                </div>
                                <BnccProgressBar percent={row.coveragePercent} />
                              </div>
                            </button>

                            {expanded ? (
                              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-5 sm:px-6">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="rounded-xl border border-white bg-white/80 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                      Disciplina
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                      {row.discipline || "—"}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-white bg-white/80 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                      Professor(a)
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                      {row.teacherName || "Não identificado"}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-white bg-white/80 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                      Habilidades cobertas
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                      {row.coveredCount} / {row.totalSkills}
                                    </p>
                                  </div>
                                  <div className="rounded-xl border border-white bg-white/80 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                      Materiais no mês
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                      {row.materialsThisMonth}
                                    </p>
                                  </div>
                                </div>
                                {row.pendingCount > 0 ? (
                                  <div className="mt-4 rounded-xl border border-amber-100 bg-white/90 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                      Habilidades BNCC pendentes ({row.pendingCount})
                                    </p>
                                    <ul className="mt-2 space-y-1.5">
                                      {row.pendingSkills.map((skill) => (
                                        <li
                                          key={skill.code}
                                          className="text-xs font-semibold text-slate-700"
                                        >
                                          <span className="font-black text-cyan-700">
                                            {skill.code}
                                          </span>
                                          {skill.description
                                            ? ` — ${skill.description.slice(0, 120)}${skill.description.length > 120 ? "…" : ""}`
                                            : null}
                                        </li>
                                      ))}
                                      {row.pendingCount > row.pendingSkills.length ? (
                                        <li className="text-xs font-bold text-slate-400">
                                          +{row.pendingCount - row.pendingSkills.length} habilidade(s)
                                          adicionais
                                        </li>
                                      ) : null}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )
          ) : null}

          {tab === "teachers" ? (
            <div className="space-y-5">
              <section className="pl-hud-glass rounded-2xl border border-cyan-400/15 p-5 sm:p-6">
                <h2 className="text-base font-black text-slate-950">Convidar professor</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Informe o e-mail do docente. Se já tiver conta Planify, o vínculo é imediato;
                  caso contrário, o convite fica pendente até o cadastro.
                </p>
                {teachers?.license ? (
                  <p className="mt-3 text-xs font-bold text-cyan-800">
                    Licenças: {teachers.license.seatsUsed}
                    {teachers.license.teacherLimit !== null
                      ? ` / ${teachers.license.teacherLimit}`
                      : " (ilimitado)"}
                    {teachers.license.planLabel
                      ? ` · Plano ${teachers.license.planLabel}`
                      : ""}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="professor@escola.edu.br"
                    className={`${HUD_FIELD_CLASS} min-w-0 flex-1`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void inviteTeacher();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void inviteTeacher()}
                    disabled={inviteLoading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                  >
                    <PlanifyIcon name="user" className="h-4 w-4" />
                    {inviteLoading ? "Enviando…" : "Convidar"}
                  </button>
                </div>
                {inviteError ? (
                  <p className="mt-3 text-sm font-semibold text-rose-600">{inviteError}</p>
                ) : null}
                {inviteMessage ? (
                  <p className="mt-3 text-sm font-semibold text-emerald-700">{inviteMessage}</p>
                ) : null}
              </section>

              {teachersLoading ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="overflow-hidden rounded-2xl border border-amber-200/60 bg-white shadow-sm">
                    <div className="border-b border-amber-100 bg-amber-50/50 px-4 py-3 sm:px-5">
                      <h3 className="text-sm font-black text-slate-950">Convites pendentes</h3>
                      <p className="text-xs font-semibold text-slate-500">
                        Aguardando cadastro ou aceite do professor
                      </p>
                    </div>
                    {(teachers?.pendingInvites || []).length === 0 ? (
                      <p className="p-5 text-sm font-semibold text-slate-500">
                        Nenhum convite pendente.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {teachers?.pendingInvites.map((invite) => (
                          <li
                            key={invite.id}
                            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">
                                {invite.email}
                              </p>
                              <p className="text-xs font-semibold text-slate-400">
                                Enviado em {formatDate(invite.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                                Pendente
                              </span>
                              <button
                                type="button"
                                onClick={() => void cancelInvite(invite.id)}
                                disabled={revokeLoadingId === invite.id}
                                className="rounded-lg border border-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800 transition hover:border-amber-300 disabled:opacity-60"
                              >
                                {revokeLoadingId === invite.id ? "…" : "Cancelar"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow-sm">
                    <div className="border-b border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:px-5">
                      <h3 className="text-sm font-black text-slate-950">Professores ativos</h3>
                      <p className="text-xs font-semibold text-slate-500">
                        Docentes vinculados à escola
                      </p>
                    </div>
                    {(teachers?.activeTeachers || []).length === 0 ? (
                      <p className="p-5 text-sm font-semibold text-slate-500">
                        Nenhum professor ativo ainda.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {teachers?.activeTeachers.map((member) => {
                          const displayName = memberDisplayName(member);
                          const showEmailBelow =
                            Boolean(member.fullName?.trim()) && Boolean(member.email?.trim());

                          return (
                            <li
                              key={member.id}
                              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">
                                  {displayName}
                                </p>
                                {showEmailBelow ? (
                                  <p className="truncate text-xs font-semibold text-slate-400">
                                    {member.email}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                                  Ativo
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void revokeTeacher(member.userId)}
                                  disabled={revokeLoadingId === member.userId}
                                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                                >
                                  {revokeLoadingId === member.userId ? "…" : "Revogar"}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          ) : null}

          {tab === "turmas" ? (
            <div className="space-y-5">
              <section className="pl-hud-glass rounded-2xl border border-cyan-400/15 p-5 sm:p-6">
                <h2 className="text-base font-black text-slate-950">Nova turma</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Cadastre turmas da escola para organizar professores, materiais e cobertura BNCC.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="text"
                    value={turmaForm.name}
                    onChange={(event) =>
                      setTurmaForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Nome da turma (ex.: 6º A)"
                    className={HUD_FIELD_CLASS}
                  />
                  <input
                    type="text"
                    value={turmaForm.gradeLevel}
                    onChange={(event) =>
                      setTurmaForm((prev) => ({ ...prev, gradeLevel: event.target.value }))
                    }
                    placeholder="Ano/série (ex.: 6º ano)"
                    className={HUD_FIELD_CLASS}
                  />
                  <input
                    type="text"
                    value={turmaForm.discipline}
                    onChange={(event) =>
                      setTurmaForm((prev) => ({ ...prev, discipline: event.target.value }))
                    }
                    placeholder="Disciplina (ex.: Matemática)"
                    className={HUD_FIELD_CLASS}
                  />
                  <select
                    value={turmaForm.teacherUserId}
                    onChange={(event) =>
                      setTurmaForm((prev) => ({ ...prev, teacherUserId: event.target.value }))
                    }
                    className={HUD_FIELD_CLASS}
                  >
                    <option value="">Professor (opcional)</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.userId} value={teacher.userId}>
                        {memberDisplayName(teacher)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void createTurma()}
                    disabled={turmaSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                  >
                    {turmaSaving ? "Salvando…" : "Criar turma"}
                  </button>
                  {turmaMessage ? (
                    <p className="text-sm font-semibold text-emerald-700">{turmaMessage}</p>
                  ) : null}
                  {classesError ? (
                    <p className="text-sm font-semibold text-rose-600">{classesError}</p>
                  ) : null}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <h2 className="text-base font-black text-slate-950">Turmas cadastradas</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {classes?.classes.length || 0} turma(s) em {schoolLabel}
                  </p>
                </div>

                {classesLoading ? (
                  <div className="flex min-h-[160px] items-center justify-center">
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
                  </div>
                ) : (classes?.classes || []).length === 0 ? (
                  <p className="p-6 text-sm font-semibold text-slate-500">
                    Nenhuma turma cadastrada ainda.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 sm:px-6">Turma</th>
                          <th className="px-4 py-3">Ano/série</th>
                          <th className="px-4 py-3">Disciplina</th>
                          <th className="px-4 py-3">Professor</th>
                          <th className="px-4 py-3 sm:px-6">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classes?.classes.map((row) =>
                          editingClassId === row.id ? (
                            <tr key={row.id} className="bg-cyan-50/40">
                              <td className="px-4 py-3 sm:px-6">
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                                  }
                                  className={`${HUD_FIELD_CLASS} min-w-[120px]`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editForm.gradeLevel}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      gradeLevel: event.target.value,
                                    }))
                                  }
                                  className={`${HUD_FIELD_CLASS} min-w-[100px]`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editForm.discipline}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      discipline: event.target.value,
                                    }))
                                  }
                                  className={`${HUD_FIELD_CLASS} min-w-[120px]`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={editForm.teacherUserId}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      teacherUserId: event.target.value,
                                    }))
                                  }
                                  className={`${HUD_FIELD_CLASS} min-w-[140px]`}
                                >
                                  <option value="">Sem professor</option>
                                  {teacherOptions.map((teacher) => (
                                    <option key={teacher.userId} value={teacher.userId}>
                                      {memberDisplayName(teacher)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 sm:px-6">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void saveEditTurma()}
                                    disabled={turmaSaving}
                                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-black text-white disabled:opacity-60"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingClassId(null)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-black text-slate-950 sm:px-6">
                                {row.name}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {row.gradeLevel || "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {row.discipline || "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {row.teacherName || "—"}
                              </td>
                              <td className="px-4 py-3 sm:px-6">
                                <button
                                  type="button"
                                  onClick={() => startEditTurma(row)}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-cyan-700 transition hover:border-cyan-300"
                                >
                                  Editar
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {tab === "materiais" ? (
            <div className="space-y-5">
              <section className="pl-hud-glass rounded-2xl border border-violet-400/15 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-950">Auditoria de materiais</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Produção docente registrada em {schoolLabel}. Filtre por professor, período e
                      disciplina.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      exportMaterialsCsv(
                        materials?.materials || [],
                        materials?.schoolName || schoolLabel,
                      )
                    }
                    disabled={!materials?.materials.length}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700 transition hover:border-violet-300 disabled:opacity-50"
                  >
                    <PlanifyIcon name="download" className="h-4 w-4" />
                    Exportar CSV
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <select
                    value={materialFilters.professorId}
                    onChange={(event) =>
                      setMaterialFilters((prev) => ({
                        ...prev,
                        professorId: event.target.value,
                      }))
                    }
                    className={HUD_FIELD_CLASS}
                  >
                    <option value="">Todos os professores</option>
                    {(materials?.professors || []).map((professor) => (
                      <option key={professor.userId} value={professor.userId}>
                        {professor.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={materialFilters.period}
                    onChange={(event) =>
                      setMaterialFilters((prev) => ({
                        ...prev,
                        period: event.target.value as MaterialFilters["period"],
                      }))
                    }
                    className={HUD_FIELD_CLASS}
                  >
                    <option value="all">Todo o período</option>
                    <option value="month">Este mês</option>
                    <option value="quarter">Este trimestre</option>
                    <option value="year">Este ano</option>
                  </select>
                  <select
                    value={materialFilters.discipline}
                    onChange={(event) =>
                      setMaterialFilters((prev) => ({
                        ...prev,
                        discipline: event.target.value,
                      }))
                    }
                    className={HUD_FIELD_CLASS}
                  >
                    <option value="">Todas as disciplinas</option>
                    {(materials?.disciplines || []).map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {discipline}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {materials?.total ?? 0} material(is) encontrado(s)
                  {materialsLoading ? " · carregando…" : ""}
                </p>
              </section>

              {materialsError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
                  {materialsError}
                </div>
              ) : null}

              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                {materialsLoading ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
                  </div>
                ) : (materials?.materials || []).length === 0 ? (
                  <p className="p-6 text-sm font-semibold text-slate-500">
                    Nenhum material encontrado para os filtros selecionados.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 sm:px-6">Professor</th>
                          <th className="px-4 py-3">Título</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Turma</th>
                          <th className="px-4 py-3">Disciplina</th>
                          <th className="px-4 py-3">BNCC</th>
                          <th className="px-4 py-3 sm:px-6">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {materials?.materials.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 sm:px-6">
                              <p className="font-black text-slate-950">
                                {row.professorName || "—"}
                              </p>
                              {row.professorEmail ? (
                                <p className="text-xs font-semibold text-slate-400">
                                  {row.professorEmail}
                                </p>
                              ) : null}
                            </td>
                            <td className="max-w-[220px] px-4 py-3 font-semibold text-slate-800">
                              <span className="line-clamp-2">{row.title}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{row.tipo}</td>
                            <td className="px-4 py-3 font-semibold text-slate-600">
                              {row.className || "—"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-600">
                              {row.discipline || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.bnccSkillCodes.length > 0 ? (
                                <div className="flex max-w-[180px] flex-wrap gap-1">
                                  {row.bnccSkillCodes.slice(0, 3).map((code) => (
                                    <span
                                      key={code}
                                      className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-black text-cyan-700"
                                    >
                                      {code}
                                    </span>
                                  ))}
                                  {row.bnccSkillCodes.length > 3 ? (
                                    <span className="text-[10px] font-bold text-slate-400">
                                      +{row.bnccSkillCodes.length - 3}
                                    </span>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-600 sm:px-6">
                              {formatDate(row.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
