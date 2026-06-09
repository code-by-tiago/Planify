import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

const EDITOR_DOCUMENT_KEY = "planify_editor_document";

type PlanningEditorRawMeta = PlanningEditorMeta & {
  matrizPlanejamento?: unknown;
};

function hasPlanningMatrix(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const conteudos = (value as { conteudos?: unknown }).conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
}

export function readPlanningMetaFromEditorStorage(): PlanningEditorRawMeta | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(EDITOR_DOCUMENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { payload?: { raw?: unknown } };
    const meta = parsed?.payload?.raw;

    return meta && typeof meta === "object" ? (meta as PlanningEditorRawMeta) : null;
  } catch {
    return null;
  }
}

/** Payload serializável para /api/google/docs|drive/export — sem imports de server. */
export function buildOfficialPlanningPayloadFromEditorMeta(
  meta: PlanningEditorRawMeta | null | undefined,
): Record<string, unknown> | null {
  if (!meta) return null;

  const generation = meta.generationPayload;
  const matriz = meta.matrizPlanejamento;

  if (!hasPlanningMatrix(matriz)) {
    return null;
  }

  const tipoPlanejamento = meta.tipoPlanejamento || generation?.tipoPlanejamento || "anual";
  const trimestre = meta.trimestre ?? generation?.trimestre;
  const matrizConteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  const cargaHoraria =
    tipoPlanejamento === "trimestral" && Array.isArray(matrizConteudos) && matrizConteudos.length > 0
      ? trimestralCargaHorariaLabel(matrizConteudos)
      : generation?.cargaHoraria;

  return {
    tipoPlanejamento,
    escola: generation?.escola || meta.escola,
    professor: generation?.professor || meta.professor,
    etapa: generation?.etapa || meta.etapa,
    anoSerie: generation?.anoSerie || meta.anoSerie,
    areaConhecimento: generation?.areaConhecimento,
    componenteCurricular:
      generation?.componenteCurricular || meta.componente || "Componente",
    cargaHoraria,
    trimestre,
    matrizPlanejamento: matriz,
  };
}

export function resolvePlanningPayloadForGoogleExport(
  meta?: PlanningEditorRawMeta | null,
): Record<string, unknown> | null {
  return (
    buildOfficialPlanningPayloadFromEditorMeta(meta) ||
    buildOfficialPlanningPayloadFromEditorMeta(readPlanningMetaFromEditorStorage())
  );
}

/** Payload oficial para export Google a partir do gerador de planejamentos. */
export function buildOfficialPlanningPayloadFromGeneration(input: {
  tipoPlanejamento: string;
  escola?: string;
  professor?: string;
  etapa?: string;
  anoSerie?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  cargaHoraria?: string;
  trimestre?: string;
  matrizPlanejamento: unknown;
}): Record<string, unknown> | null {
  if (!hasPlanningMatrix(input.matrizPlanejamento)) {
    return null;
  }

  return {
    tipoPlanejamento: input.tipoPlanejamento,
    escola: input.escola,
    professor: input.professor,
    etapa: input.etapa,
    anoSerie: input.anoSerie,
    areaConhecimento: input.areaConhecimento,
    componenteCurricular: input.componenteCurricular,
    cargaHoraria: input.cargaHoraria,
    trimestre: input.trimestre,
    matrizPlanejamento: input.matrizPlanejamento,
  };
}
