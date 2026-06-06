"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import type { SchoolDashboardResponse } from "@/lib/bncc/types";

type DirectorPanelClientProps = {
  embedded?: boolean;
};

export function DirectorPanelClient({ embedded = false }: DirectorPanelClientProps) {
  const access = usePlanifyAccess();
  const [dashboard, setDashboard] = useState<SchoolDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!access.canViewDirectorPanel || !access.schoolId) {
      setLoading(false);
      if (access.canViewDirectorPanel && !access.schoolId) {
        setError("Escola não vinculada ao seu perfil. Peça ao suporte para associar sua conta.");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/schools/${access.schoolId}/dashboard`, {
        cache: "no-store",
        credentials: "include",
      });
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
  }, [access.canViewDirectorPanel, access.schoolId]);

  useEffect(() => {
    if (access.loading) return;
    void loadDashboard();
  }, [access.loading, loadDashboard]);

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
        <div>
          <h1 className="text-2xl font-black text-slate-950">Faça login</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Entre na sua conta para acessar o painel do gestor.
          </p>
          <Link href="/login?redirect=/diretor" className="pl-hud-btn mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold">
            Entrar
          </Link>
        </div>
      </section>
    );
  }

  if (!access.canViewDirectorPanel) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-black text-slate-950">Acesso restrito</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            O Painel do Gestor é exclusivo para diretores de escola e gestores
            com perfil <strong>school_manager</strong>.
          </p>
          <Link href="/dashboard" className="pl-hud-btn mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold">
            Voltar ao painel
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${
        embedded ? "" : "planify-hud planify-ui3 planify-hud-app bg-[var(--planify-canvas)]"
      }`}
    >
      <header className="shrink-0 border-b border-cyan-400/15 bg-white/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
          Gestão escolar
        </p>
        <h1 className="text-2xl font-black text-slate-950">Painel do Gestor</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {dashboard?.schoolName || "Sua escola"} — visão geral de BNCC e produção docente.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Professores ativos</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.activeTeachers || 0}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Conformidade BNCC média</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.avgBnccCompliance || 0}%</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Materiais no mês</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{dashboard?.materialsThisMonth || 0}</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-black text-slate-950">Turmas e progresso BNCC</h2>
              </div>

              {(dashboard?.classes || []).length === 0 ? (
                <p className="p-5 text-sm font-semibold text-slate-500">
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
                          className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
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
                          <div className="text-right">
                            <p className="text-lg font-black text-cyan-700">{row.coveragePercent}%</p>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">BNCC</p>
                          </div>
                        </button>

                        {expanded ? (
                          <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
                            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Professor(a)</dt>
                                <dd className="font-semibold text-slate-800">{row.teacherName || "Não identificado"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Habilidades cobertas</dt>
                                <dd className="font-semibold text-slate-800">
                                  {row.coveredCount} / {row.totalSkills}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Materiais no mês</dt>
                                <dd className="font-semibold text-slate-800">{row.materialsThisMonth}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Disciplina</dt>
                                <dd className="font-semibold text-slate-800">{row.discipline || "—"}</dd>
                              </div>
                            </dl>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
