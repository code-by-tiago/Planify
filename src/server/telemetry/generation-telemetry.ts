import { getSupabaseAdminClient } from "../supabase/admin-client";

export type QualityScoreBucket = "90+" | "75+" | "<75" | "unknown";

type DbResult = { error: { message: string } | null };
type SupabaseLoose = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<DbResult>;
  };
};

function db(): SupabaseLoose {
  return getSupabaseAdminClient() as unknown as SupabaseLoose;
}

export type GenerationTelemetryEvent = {
  surface: "material" | "planning";
  tipo: string;
  pipeline: string;
  qualityScoreBucket: QualityScoreBucket;
  elevarQualidade: boolean;
  usedAI: boolean;
  dailyQuotaConsumed: boolean;
};

export function bucketQualityScore(
  score: number | undefined | null,
): QualityScoreBucket {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return "unknown";
  }
  if (score >= 90) return "90+";
  if (score >= 75) return "75+";
  return "<75";
}

export function logGenerationComplete(event: GenerationTelemetryEvent): void {
  console.info(
    "planify:generation",
    JSON.stringify({
      ...event,
      ts: new Date().toISOString(),
    }),
  );

  void persistGenerationEvent(event);
}

async function persistGenerationEvent(event: GenerationTelemetryEvent): Promise<void> {
  try {
    const { error } = await db().from("generation_events").insert({
      surface: event.surface,
      tipo: String(event.tipo || "").slice(0, 120),
      pipeline: String(event.pipeline || "").slice(0, 120),
      quality_score_bucket: event.qualityScoreBucket,
      elevar_qualidade: event.elevarQualidade,
      used_ai: event.usedAI,
      daily_quota_consumed: event.dailyQuotaConsumed,
    });

    if (error) {
      console.warn("planify:generation persist failed", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("planify:generation persist failed", message);
  }
}
