import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { QualityScoreBucket } from "./generation-telemetry";

export type GenerationStatsWindow = "24h" | "7d";

export type GenerationStats = {
  window: GenerationStatsWindow;
  total: number;
  byTipo: Array<{ tipo: string; count: number }>;
  bySurface: Array<{ surface: string; count: number }>;
  buckets: Record<QualityScoreBucket, number>;
  elevationRate: number;
  usedAiRate: number;
  dailyQuotaRate: number;
};

type GenerationEventRow = {
  surface: string;
  tipo: string;
  quality_score_bucket: QualityScoreBucket;
  elevar_qualidade: boolean;
  used_ai: boolean;
  daily_quota_consumed: boolean;
};

type DbSelectResult = {
  data: GenerationEventRow[] | null;
  error: { message: string } | null;
};

type SupabaseLoose = {
  from: (table: string) => {
    select: (columns: string) => {
      gte: (
        column: string,
        value: string,
      ) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => {
          limit: (count: number) => Promise<DbSelectResult>;
        };
      };
    };
  };
};

function db(): SupabaseLoose {
  return getSupabaseAdminClient() as unknown as SupabaseLoose;
}

function windowStartIso(window: GenerationStatsWindow): string {
  const hours = window === "7d" ? 7 * 24 : 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function emptyBuckets(): Record<QualityScoreBucket, number> {
  return { "90+": 0, "75+": 0, "<75": 0, unknown: 0 };
}

export async function fetchGenerationStats(
  window: GenerationStatsWindow,
): Promise<GenerationStats> {
  const empty: GenerationStats = {
    window,
    total: 0,
    byTipo: [],
    bySurface: [],
    buckets: emptyBuckets(),
    elevationRate: 0,
    usedAiRate: 0,
    dailyQuotaRate: 0,
  };

  try {
    const { data, error } = await db()
      .from("generation_events")
      .select(
        "surface, tipo, quality_score_bucket, elevar_qualidade, used_ai, daily_quota_consumed",
      )
      .gte("created_at", windowStartIso(window))
      .order("created_at", { ascending: false })
      .limit(10_000);

    if (error || !Array.isArray(data)) {
      return empty;
    }

    const rows = data as GenerationEventRow[];
    const tipoMap = new Map<string, number>();
    const surfaceMap = new Map<string, number>();
    const buckets = emptyBuckets();

    let elevated = 0;
    let usedAi = 0;
    let quota = 0;

    for (const row of rows) {
      const tipo = String(row.tipo || "desconhecido");
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);

      const surface = String(row.surface || "material");
      surfaceMap.set(surface, (surfaceMap.get(surface) || 0) + 1);

      const bucket = row.quality_score_bucket;
      if (bucket in buckets) {
        buckets[bucket as QualityScoreBucket] += 1;
      } else {
        buckets.unknown += 1;
      }

      if (row.elevar_qualidade) elevated += 1;
      if (row.used_ai) usedAi += 1;
      if (row.daily_quota_consumed) quota += 1;
    }

    const total = rows.length;
    const pct = (value: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

    return {
      window,
      total,
      byTipo: [...tipoMap.entries()]
        .map(([tipo, count]) => ({ tipo, count }))
        .sort((a, b) => b.count - a.count),
      bySurface: [...surfaceMap.entries()]
        .map(([surface, count]) => ({ surface, count }))
        .sort((a, b) => b.count - a.count),
      buckets,
      elevationRate: pct(elevated),
      usedAiRate: pct(usedAi),
      dailyQuotaRate: pct(quota),
    };
  } catch {
    return empty;
  }
}
