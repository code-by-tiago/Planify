import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";

type PlanningEditorRawMeta = PlanningEditorMeta & {
  matrizPlanejamento?: unknown;
};

function hasPlanningMatrix(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const conteudos = (value as { conteudos?: unknown }).conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
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

  if (!generation && !meta.componente && !meta.tipoPlanejamento) {
    return null;
  }

  return {
    tipoPlanejamento: generation?.tipoPlanejamento || meta.tipoPlanejamento || "anual",
    escola: generation?.escola || meta.escola,
    professor: generation?.professor || meta.professor,
    etapa: generation?.etapa || meta.etapa,
    anoSerie: generation?.anoSerie || meta.anoSerie,
    areaConhecimento: generation?.areaConhecimento,
    componenteCurricular: generation?.componenteCurricular || meta.componente,
    cargaHoraria: generation?.cargaHoraria,
    trimestre: generation?.trimestre,
    matrizPlanejamento: matriz,
  };
}
