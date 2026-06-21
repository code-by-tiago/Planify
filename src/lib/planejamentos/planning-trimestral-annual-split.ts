import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

export type AnnualPlanningLike = {
  tipoPlanejamento?: string;
  titulo: string;
  resumo: string;
  conteudos: PlanningMatrixItem[];
};

export type TrimestralPlanningLike = AnnualPlanningLike & {
  tipoPlanejamento: "trimestral";
};

/**
 * Mesma regra do DOCX oficial: usa trimestre explícito da matriz anual
 * ou divide em 3 blocos quando a IA não marcou trimestres distintos.
 */
export function extractAnnualItemsForTrimester(
  matrix: PlanningMatrixItem[],
  trimestre: number,
): PlanningMatrixItem[] {
  const hasExplicitTrimestre = matrix.some((item) => {
    const value = Number(item.trimestre);
    return Number.isFinite(value) && value >= 1 && value <= 3;
  });

  if (hasExplicitTrimestre) {
    const explicit = matrix.filter((item) => Number(item.trimestre) === trimestre);

    if (explicit.length > 0) {
      return explicit;
    }
  }

  const chunkSize = Math.max(1, Math.ceil(matrix.length / 3));
  const start = (trimestre - 1) * chunkSize;

  return matrix.slice(start, start + chunkSize);
}

function resolvePeriodos(item: PlanningMatrixItem): number {
  const parsed = Number(item.periodos);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const range = Math.max(0, Number(item.aulaFim) - Number(item.aulaInicio) + 1);
  return range > 0 ? range : 1;
}

export function renumberTrimestralMatrixItems(
  items: PlanningMatrixItem[],
  trimestre: number,
): PlanningMatrixItem[] {
  let cumulative = 0;

  return items.map((item, index) => {
    const periodos = resolvePeriodos(item);
    const aulaInicio = cumulative + 1;
    const aulaFim = cumulative + periodos;
    cumulative = aulaFim;

    return {
      ...item,
      trimestre,
      numeroAula: index + 1,
      periodos,
      aulaInicio,
      aulaFim,
    };
  });
}

export function trimestralCargaHorariaLabel(items: PlanningMatrixItem[]): string {
  const total = items.reduce((sum, item) => sum + resolvePeriodos(item), 0);
  return total === 1 ? "1 período" : `${total} períodos`;
}
