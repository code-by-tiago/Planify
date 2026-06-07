"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { HUD_FIELD_CLASS } from "@/lib/pro/hud-form-styles";
import type { SchoolDashboardResponse } from "@/lib/bncc/types";
import type { SchoolTeachersResponse } from "@/lib/school/types";

type DirectorPanelClientProps = {
  embedded?: boolean;
};

type DirectorTabId = "overview" | "teachers";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
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
  const access = usePlanifyAccess();
  const [dashboard, setDashboard] = useState<SchoolDashboardResponse | null>(null);
  const [teachers, setTeachers] = useState<SchoolTeachersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [tab, setTab] = useState<DirectorTabId>("overview");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");

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
      setError(err instanceof Error ? err.message : "Erro ao carregar painel.");
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

  useEffect(() => {
    if (access.loading) return;
    void loadDashboard();
  }, [access.loading, loadDashboard]);

  useEffect(() => {
    if (access.loading || !access.canViewDirectorPanel || tab !== "teachers") return;
    void loadTeachers();
  }, [access.loading, access.canViewDirectorPanel, tab, loadTeachers]);

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
          <h1 className="mt-4 text-2xl font-black text-slate-950">Faça login</h1>
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

  const tabClass = (active: boolean) =>
    active
      ? "border-cyan-500 bg-white text-cyan-700 shadow-sm"
      : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800";

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
            description={
              dashboard?.schoolName
                ? `${dashboard.schoolName} — turmas, professores e conformidade BNCC em tempo real.`
                : "Visão geral de turmas, professores e conformidade BNCC da sua instituição."
            }
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          <nav className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition ${tabClass(tab === "overview")}`}
            >
              <PlanifyIcon name="clipboard" className="h-4 w-4" />
              Visão geral
            </button>
            <button
              type="button"
              onClick={() => setTab("teachers")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition ${tabClass(tab === "teachers")}`}
            >
              <PlanifyIcon name="user" className="h-4 w-4" />
              Gerenciar Professores
            </button>
          </nav>

          {tab === "overview" ? (
            loading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
                {error}
              </div>
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
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Membros ativos em school_memberships
                    </p>
                  </article>

                  <article className="pl-hud-glass rounded-2xl border border-violet-400/20 p-5">
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
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Produção docente da escola neste mês
                    </p>
                  </article>

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

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                    <h2 className="text-base font-black text-slate-950">Turmas e progresso BNCC</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Clique numa turma para ver disciplina, professor(a) e detalhes de cobertura.
                    </p>
                  </div>

                  {(dashboard?.classes || []).length === 0 ? (
                    <p className="p-6 text-sm font-semibold text-slate-500">
                      Nenhuma turma cadastrada ainda.
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
                            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                              Pendente
                            </span>
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
                        {teachers?.activeTeachers.map((member) => (
                          <li
                            key={member.id}
                            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">
                                {member.fullName || member.email || "Professor"}
                              </p>
                              {member.email ? (
                                <p className="truncate text-xs font-semibold text-slate-400">
                                  {member.email}
                                </p>
                              ) : null}
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                              Ativo
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
