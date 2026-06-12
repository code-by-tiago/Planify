import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import { UNIFIED_MIN_QUALITY_SCORE } from "@/lib/materiais/unified-quality-gate";
import type { MaterialEngineRequest } from "./material-engine-types";

export { UNIFIED_MIN_QUALITY_SCORE };

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

export {
  UNIFIED_PIPELINE_LABELS,
  resolveUnifiedPipelineLabel,
} from "@/lib/materiais/unified-pipeline-labels";

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
