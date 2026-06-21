export type UnifiedDeliveryPipeline =
  | "bank"
  | "bank-hybrid"
  | "bank-selected"
  | "engine"
  | "engine-elevated"
  | "ai"
  | "engine-fallback";

export const UNIFIED_PIPELINE_LABELS: Record<string, string> = {
  bank: "Banco Planify — entrega rápida",
  "bank-hybrid": "Banco + IA — lacunas reforçadas",
  "bank-selected": "Questões escolhidas do banco",
  engine: "Rascunho rápido — motor pedagógico",
  "engine-elevated": "Gerado por IA — qualidade elevada",
  ai: "Gerado por IA — motor pedagógico",
  "engine-fallback": "Motor auxiliar (fallback)",
};

export function resolveUnifiedPipelineLabel(pipeline: string | null | undefined): string {
  if (!pipeline) return "";
  return UNIFIED_PIPELINE_LABELS[pipeline] ?? pipeline;
}

/** Pipelines padrão (fast path) — score abaixo de 88 exibe banner de elevação. */
export function isFastDeliveryPipeline(pipeline: string | null | undefined): boolean {
  if (!pipeline) return true;
  return pipeline === "engine" || pipeline === "ai" || pipeline.startsWith("bank");
}
