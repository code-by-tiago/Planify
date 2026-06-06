export type QualityScoreBucket = "90+" | "75+" | "<75" | "unknown";

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
}
