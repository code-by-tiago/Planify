"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { BnccPaywall } from "@/components/bncc/BnccPaywall";
import { usePlanifyAccess } from "@/hooks/usePlanifyAccess";
import type { BnccProgressResponse } from "@/lib/bncc/types";
import { dashboardToolHref } from "@/lib/pro/toolRoutes";

type BnccProgressClientProps = {
  embedded?: boolean;
};

type TabId = "covered" | "pending";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildGenerateHref(skillCode: string, discipline: string | null): string {
  const params = new URLSearchParams({ bncc: skillCode });
  if (discipline) params.set("disciplina", discipline);
  return `/dashboard?secao=planejamentos&${params.toString()}`;
}

export function BnccProgressClient({ embedded = false }: BnccProgressClientProps) {
  const access = usePlanifyAccess();
  const [progress, setProgress] = useState<BnccProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("covered");
  const [classId, setClassId] = useState("");
  const [discipline, setDiscipline] = useState("");

  const loadProgress = useCallback(async () => {
    if (!access.canViewBnccProgress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (classId) params.set("classFilter", classId);
    if (discipline) params.set("discipline", discipline);

    try {
      const response = await fetch(
        `/api/bncc/progress${params.toString() ? `?${params.toString()}` : ""}`,
        { cache: "no-store", credentials: "include" },
      );
      const data = (await response.json()) as {
        success?: boolean;
        progress?: BnccProgressResponse;
        error?: { message?: string; code?: string };
      };

      if (!response.ok || !data.success) {
        if (data.error?.code === "paywall") {
          setProgress(null);
          return;
        }
        throw new Error(data.error?.message || "Não foi possível carregar o progresso.");
      }

      setProgress(data.progress || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar progresso.");
    } finally {
      setLoading(false);
    }
  }, [access.canViewBnccProgress, classId, discipline]);

  useEffect(() => {
    if (access.loading) return;
    void loadProgress();
  }, [access.loading, loadProgress]);

  const coverageLabel = useMemo(() => {
    if (!progress) return "0%";
    if (progress.coveredCount > 0 && progress.coveragePercent === 0) {
      return "<1%";
    }
    return `${progress.coveragePercent}%`;
  }, [progress]);

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
            Entre na sua conta para ver o progresso BNCC.
          </p>
          <Link href="/login?redirect=/progresso-bncc" className="pl-hud-btn mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold">
            Entrar
          </Link>
        </div>
      </section>
    );
  }

  if (access.isManagerView) {
    return (
      <section className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-black text-slate-950">Painel do Gestor</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Como gestor ou diretor, use o painel administrativo para acompanhar
            turmas e professores da escola.
          </p>
          <Link href="/diretor" className="pl-hud-btn mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold">
            Abrir Painel do Gestor
          </Link>
        </div>
      </section>
    );
  }

  if (!access.canViewBnccProgress) {
    return <BnccPaywall />;
  }

  const filterControls = (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        Turma
        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          <option value="">Todas</option>
          {(progress?.classes || []).map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        Disciplina
        <select
          value={discipline}
          onChange={(event) => setDiscipline(event.target.value)}
          className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
        >
          <option value="">Todas</option>
          {(progress?.disciplines || []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${
        embedded ? "" : "planify-hud planify-ui3 planify-hud-app bg-[var(--planify-canvas)]"
      }`}
    >
      {!embedded ? (
        <header className="shrink-0 border-b border-cyan-400/15 bg-white/85 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                BNCC
              </p>
              <h1 className="text-2xl font-black text-slate-950">Progresso BNCC</h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Cobertura de habilidades com base nos materiais gerados no ano letivo.
                Selecione habilidades BNCC ao criar materiais para registrar com
                precisão.
              </p>
            </div>
            {filterControls}
          </div>
        </header>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-50/60 px-4 py-3 text-sm leading-6 text-slate-700">
          O progresso aumenta quando você gera materiais com{" "}
          <strong className="font-bold text-slate-900">habilidades BNCC selecionadas</strong>{" "}
          no painel da ferramenta. Sem seleção, o sistema estima pelo tema — com menor
          precisão.{" "}
          <Link
            href={dashboardToolHref("resumo")}
            className="font-bold text-cyan-800 underline decoration-cyan-400/50 underline-offset-2"
          >
            Criar material com BNCC
          </Link>
        </div>

        {embedded ? (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            {filterControls}
          </div>
        ) : null}
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
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-400/20 bg-white p-6 shadow-sm">
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#06b6d4 ${progress?.coveredCount ? Math.max(progress.coveragePercent, 1) : 0}%, #e2e8f0 0)`,
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
                    <span className="text-3xl font-black text-slate-950">{coverageLabel}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      cobertura
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs font-semibold text-slate-600">
                  {progress?.coveredCount || 0} de {progress?.totalSkills || 0} habilidades
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Cobertas</p>
                  <p className="mt-1 text-2xl font-black text-emerald-900">{progress?.coveredCount || 0}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Pendentes</p>
                  <p className="mt-1 text-2xl font-black text-amber-900">{progress?.pendingCount || 0}</p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Ano letivo</p>
                  <p className="mt-1 text-2xl font-black text-cyan-900">{progress?.filters.year || new Date().getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setTab("covered")}
                className={`rounded-t-xl px-4 py-2 text-sm font-black transition ${
                  tab === "covered"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Habilidades Cobertas
              </button>
              <button
                type="button"
                onClick={() => setTab("pending")}
                className={`rounded-t-xl px-4 py-2 text-sm font-black transition ${
                  tab === "pending"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Habilidades Pendentes
              </button>
            </div>

            <div className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white">
              {tab === "covered" ? (
                <ul className="divide-y divide-slate-100">
                  {(progress?.covered || []).length === 0 ? (
                    <li className="p-6 text-sm font-semibold text-slate-500">
                      Nenhuma habilidade coberta ainda. Gere materiais com códigos BNCC para começar.
                    </li>
                  ) : (
                    progress?.covered.map((skill) => (
                      <li key={skill.code} className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <PlanifyIcon name="checkCircle" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-950">{skill.code}</p>
                          <p className="mt-1 text-sm font-medium text-slate-600">{skill.description}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            Material: {skill.materialTitle} · {formatDate(skill.coveredAt)}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(progress?.pending || []).length === 0 ? (
                    <li className="p-6 text-sm font-semibold text-slate-500">
                      Parabéns! Todas as habilidades do recorte selecionado já foram cobertas.
                    </li>
                  ) : (
                    progress?.pending.map((skill) => (
                      <li key={skill.code} className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-950">{skill.code}</p>
                          <p className="mt-1 text-sm font-medium text-slate-600">{skill.description}</p>
                        </div>
                        <Link
                          href={buildGenerateHref(skill.code, progress?.filters.discipline || null)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm"
                        >
                          <PlanifyIcon name="spark" className="h-4 w-4" />
                          Gerar Aula com IA
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-slate-400">
              Também pode gerar materiais em{" "}
              <Link href={dashboardToolHref("plano-aula")} className="text-cyan-700 underline">
                Plano de Aula
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
