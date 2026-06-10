"use client";

import { useCallback, useEffect, useState } from "react";

type StatsWindow = "24h" | "7d";

type GenerationStats = {
  window: StatsWindow;
  total: number;
  byTipo: Array<{ tipo: string; count: number }>;
  bySurface: Array<{ surface: string; count: number }>;
  buckets: Record<string, number>;
  elevationRate: number;
  usedAiRate: number;
  dailyQuotaRate: number;
};

type OperationalStats = {
  window: StatsWindow;
  failureRateByTipo: Array<{
    toolTipo: string;
    failures: number;
    total: number;
    failureRate: number;
  }>;
};

type PedagogicalStats = {
  cacheHits: number;
  tokensSaved: number;
  aiTokensSpent: number;
};

const bucketLabels: Record<string, string> = {
  "90+": "Excelente (90+)",
  "75+": "Bom (75–89)",
  "<75": "Atenção (<75)",
  unknown: "Sem score",
};

const bucketColors: Record<string, string> = {
  "90+": "bg-emerald-500",
  "75+": "bg-amber-500",
  "<75": "bg-rose-500",
  unknown: "bg-slate-400",
};

export function AdminQualidadePanel() {
  const [window, setWindow] = useState<StatsWindow>("24h");
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [operational, setOperational] = useState<OperationalStats | null>(null);
  const [pedagogical, setPedagogical] = useState<PedagogicalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async (selected: StatsWindow) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/generation-stats?window=${selected}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar estatísticas.");
      }

      setStats(data.stats as GenerationStats);
      setOperational((data.operational as OperationalStats) ?? null);
      setPedagogical((data.pedagogical as PedagogicalStats) ?? null);
    } catch (err) {
      setStats(null);
      setOperational(null);
      setPedagogical(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(window);
  }, [loadStats, window]);

  const bucketTotal = stats
    ? Object.values(stats.buckets).reduce((sum, value) => sum + value, 0)
    : 0;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["24h", "7d"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setWindow(option)}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              window === option
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
            }`}
          >
            {option === "24h" ? "Últimas 24h" : "Últimos 7 dias"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void loadStats(window)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:border-indigo-300"
        >
          Atualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm font-semibold text-slate-500">Carregando telemetria...</p>
      ) : stats ? (
        <>
          {pedagogical ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Cache didático — hits",
                  value: String(pedagogical.cacheHits),
                  detail: "snippet + injeção",
                },
                {
                  label: "Tokens economizados",
                  value: pedagogical.tokensSaved.toLocaleString("pt-BR"),
                  detail: "estimativa reservatório",
                },
                {
                  label: "IA formatação",
                  value: pedagogical.aiTokensSpent.toLocaleString("pt-BR"),
                  detail: "tokens gastos (format-only)",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/50 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{metric.value}</p>
                  <p className="mt-2 text-xs font-bold text-emerald-800">{metric.detail}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Gerações", value: String(stats.total), detail: window },
              {
                label: "Taxa elevação",
                value: `${stats.elevationRate}%`,
                detail: "com elevarQualidade",
              },
              {
                label: "IA real",
                value: `${stats.usedAiRate}%`,
                detail: "usedAI / pipeline",
              },
              {
                label: "Cota diária",
                value: `${stats.dailyQuotaRate}%`,
                detail: "consumiram slot Pro",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-black text-slate-950">{metric.value}</p>
                <p className="mt-2 text-xs font-bold text-indigo-700">{metric.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
                Score buckets
              </p>
              <div className="mt-6 grid gap-3">
                {Object.entries(stats.buckets).map(([bucket, count]) => {
                  const pct =
                    bucketTotal > 0 ? Math.round((count / bucketTotal) * 100) : 0;
                  return (
                    <div key={bucket}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>{bucketLabels[bucket] || bucket}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${bucketColors[bucket] || "bg-slate-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
                Por superfície
              </p>
              <div className="mt-6 grid gap-2">
                {stats.bySurface.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum evento no período.</p>
                ) : (
                  stats.bySurface.map((item) => (
                    <div
                      key={item.surface}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-black capitalize text-slate-950">
                        {item.surface}
                      </span>
                      <span className="font-bold text-indigo-700">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-rose-600">
              Taxa sucesso/falha por tool_tipo (generation + operational)
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Gerações bem-sucedidas (generation_events) vs falhas operacionais (operational_events).
              Alertas: configure Sentry → email/Slack manualmente.
            </p>
            <div className="mt-6 grid gap-2">
              {!operational?.failureRateByTipo.length ? (
                <p className="text-sm text-slate-500">
                  Sem eventos operacionais no período (após migration 20260622).
                </p>
              ) : (
                operational.failureRateByTipo.slice(0, 8).map((item) => (
                  <div
                    key={item.toolTipo}
                    className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-sm"
                  >
                    <span className="font-black text-slate-950">{item.toolTipo}</span>
                    <span className="font-bold text-rose-700">
                      {item.failureRate}% ({item.failures}/{item.total})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-600">
              Por tipo
            </p>
            <div className="mt-6 grid gap-2">
              {stats.byTipo.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Sem gerações registradas. Eventos aparecem após materiais/planejamentos gerados
                  em produção.
                </p>
              ) : (
                stats.byTipo.slice(0, 12).map((item) => (
                  <div
                    key={item.tipo}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-black text-slate-950">{item.tipo}</span>
                    <span className="font-bold text-indigo-700">{item.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
