import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import type { MaterialEngineRequest } from "./material-engine-types";

/** Piso Teachy+ — todas as ferramentas passam por este gate antes da entrega. */
export const UNIFIED_MIN_QUALITY_SCORE = 88;

export type UnifiedDeliveryPipeline =
  | "bank"
  | "bank-hybrid"
  | "bank-selected"
  | "engine"
  | "engine-elevated";

export type UnifiedMaterialDelivery = {
  tipoMaterial: string;
  html: string;
  estrutura: unknown;
  pipeline: UnifiedDeliveryPipeline;
  qualityScore: number;
  qualityIssues: string[];
  alertas?: string[];
};

export const UNIFIED_PIPELINE_LABELS: Record<UnifiedDeliveryPipeline, string> = {
  bank: "Banco Planify — entrega rápida",
  "bank-hybrid": "Banco + IA — lacunas reforçadas",
  "bank-selected": "Questões escolhidas do banco",
  engine: "Motor pedagógico Planify",
  "engine-elevated": "Motor pedagógico — qualidade elevada",
};

export function resolveUnifiedPipelineLabel(pipeline: string): string {
  return (
    UNIFIED_PIPELINE_LABELS[pipeline as UnifiedDeliveryPipeline] ?? pipeline
  );
}

export function shouldAutoElevateQuality(
  qualityScore: number,
  alreadyElevated: boolean,
): boolean {
  return !alreadyElevated && qualityScore < UNIFIED_MIN_QUALITY_SCORE;
}

export function finalizeUnifiedDelivery(
  data: {
    tipoMaterial: string;
    html: string;
    estrutura: unknown;
    qualityScore?: number;
    qualityIssues?: string[];
    alertas?: string[];
    pipeline?: string;
  },
  pipeline: UnifiedDeliveryPipeline,
  request: MaterialEngineRequest,
): UnifiedMaterialDelivery {
  const qualityIssues = data.qualityIssues ?? [];
  const alertas = [...(data.alertas ?? [])];
  const qualityScore =
    typeof data.qualityScore === "number"
      ? data.qualityScore
      : computeQualityScore(qualityIssues, alertas);

  if (qualityScore >= UNIFIED_MIN_QUALITY_SCORE && !qualityIssues.length) {
    alertas.unshift(
      `Material pronto para sala (${qualityScore}/100) — ${request.tipoMaterial}.`,
    );
  } else if (qualityScore < UNIFIED_MIN_QUALITY_SCORE) {
    alertas.unshift(
      `Revise antes de aplicar (${qualityScore}/100) ou use Elevar qualidade.`,
    );
  }

  return {
    tipoMaterial: data.tipoMaterial,
    html: data.html,
    estrutura: data.estrutura,
    pipeline,
    qualityScore,
    qualityIssues,
    alertas: alertas.length ? alertas : undefined,
  };
}
