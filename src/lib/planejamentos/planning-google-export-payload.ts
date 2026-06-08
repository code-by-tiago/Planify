import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import type { OfficialPlanningPayload } from "@/server/planejamentos/official-planning-docx";
import type { PlanningAiResult } from "@/server/planejamentos/planning-ai-service";

type PlanningEditorRawMeta = PlanningEditorMeta & {
  matrizPlanejamento?: PlanningAiResult["planejamento"] | null;
};

function hasPlanningMatrix(
  value: unknown,
): value is PlanningAiResult["planejamento"] {
  if (!value || typeof value !== "object") return false;

  const conteudos = (value as { conteudos?: unknown }).conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
}

export function buildOfficialPlanningPayloadFromEditorMeta(
  meta: PlanningEditorRawMeta | null | undefined,
): OfficialPlanningPayload | null {
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
