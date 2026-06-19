import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { GenerationStatsWindow } from "./generation-stats-service";

export type OperationalFailureRate = {
  toolTipo: string;
  failures: number;
  total: number;
  failureRate: number;
};

export type OperationalStats = {
  window: GenerationStatsWindow;
  failureRateByTipo: OperationalFailureRate[];
  totalEvents: number;
  totalFailures: number;
  overallFailureRate: number;
  rate429: number;
};

type OperationalEventRow = {
  event_type: string;
  tool_tipo: string;
  ok: boolean;
  error_code: string | null;
};

function windowStartIso(window: GenerationStatsWindow): string {
  const hours = window === "7d" ? 7 * 24 : 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function fetchOperationalStats(
  window: GenerationStatsWindow,
): Promise<OperationalStats> {
  const empty: OperationalStats = {
    window,
    failureRateByTipo: [],
    totalEvents: 0,
    totalFailures: 0,
    overallFailureRate: 0,
    rate429: 0,
  };

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("operational_events")
      .select("event_type, tool_tipo, ok, error_code")
      .gte("created_at", windowStartIso(window))
      .order("created_at", { ascending: false })
      .limit(10_000);

    if (error || !Array.isArray(data)) {
      return empty;
    }

    const rows = data as OperationalEventRow[];
    const byTipo = new Map<string, { failures: number; total: number }>();
    let totalFailures = 0;
    let rate429Count = 0;

    for (const row of rows) {
      const tipo = String(row.tool_tipo || row.event_type || "desconhecido");
      const entry = byTipo.get(tipo) ?? { failures: 0, total: 0 };
      entry.total += 1;
      if (!row.ok) entry.failures += 1;
      byTipo.set(tipo, entry);

      if (!row.ok) totalFailures += 1;
      if (String(row.error_code || "") === "daily_limit_reached") {
        rate429Count += 1;
      }
    }

    const totalEvents = rows.length;

    const failureRateByTipo = [...byTipo.entries()]
      .map(([toolTipo, counts]) => ({
        toolTipo,
        failures: counts.failures,
        total: counts.total,
        failureRate:
          counts.total > 0
            ? Math.round((counts.failures / counts.total) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.failureRate - a.failureRate);

    return {
      window,
      failureRateByTipo,
      totalEvents,
      totalFailures,
      overallFailureRate:
        totalEvents > 0
          ? Math.round((totalFailures / totalEvents) * 1000) / 10
          : 0,
      rate429:
        totalEvents > 0 ? Math.round((rate429Count / totalEvents) * 1000) / 10 : 0,
    };
  } catch {
    return empty;
  }
}
