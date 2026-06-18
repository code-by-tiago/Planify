import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";
import {
  matrixItemsFromTrimestralPlano,
  runTrimestralPipeline,
  runTrimestralPipelineAsync,
  type TrimestralPipelineOptions,
} from "@/lib/planejamentos/planning-trimestral-pipeline";

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

export type BuildTrimestralOptions = TrimestralPipelineOptions;

function trimestralFromPlano(
  annual: AnnualPlanningLike,
  trimestre: number,
  conteudos: PlanningMatrixItem[],
): TrimestralPlanningLike {
  const cargaLabel = trimestralCargaHorariaLabel(conteudos);

  return {
    tipoPlanejamento: "trimestral",
    titulo: `Planejamento trimestral — ${trimestre}º trimestre`,
    resumo: annual.resumo
      ? `${annual.resumo} Extraído do planejamento anual (${trimestre}º trimestre · ${cargaLabel}).`
      : `Matriz do ${trimestre}º trimestre extraída do planejamento anual (${cargaLabel}).`,
    conteudos,
  };
}

export async function buildTrimestralPlanningFromAnnualAsync(
  annual: AnnualPlanningLike,
  trimestre: number,
  options?: BuildTrimestralOptions,
): Promise<TrimestralPlanningLike> {
  const plano = await runTrimestralPipelineAsync(annual, trimestre, options);
  const conteudos = matrixItemsFromTrimestralPlano(plano, trimestre);
  return trimestralFromPlano(annual, trimestre, conteudos);
}

export async function buildTrimestralPlansFromAnnualAsync(
  annual: AnnualPlanningLike,
  trimestres: number[],
  options?: BuildTrimestralOptions,
): Promise<Partial<Record<number, TrimestralPlanningLike>>> {
  const unique = Array.from(
    new Set(trimestres.filter((value) => value >= 1 && value <= 3)),
  ).sort((a, b) => a - b);

  const result: Partial<Record<number, TrimestralPlanningLike>> = {};

  for (const trimestre of unique) {
    result[trimestre] = await buildTrimestralPlanningFromAnnualAsync(annual, trimestre, options);
  }

  return result;
}

export function buildTrimestralPlanningFromAnnual(
  annual: AnnualPlanningLike,
  trimestre: number,
  options?: BuildTrimestralOptions,
): TrimestralPlanningLike {
  const plano = runTrimestralPipeline(annual, trimestre, options);
  const conteudos = matrixItemsFromTrimestralPlano(plano, trimestre);
  return trimestralFromPlano(annual, trimestre, conteudos);
}

export function buildTrimestralPlansFromAnnual(
  annual: AnnualPlanningLike,
  trimestres: number[],
  options?: BuildTrimestralOptions,
): Partial<Record<number, TrimestralPlanningLike>> {
  const unique = Array.from(
    new Set(trimestres.filter((value) => value >= 1 && value <= 3)),
  ).sort((a, b) => a - b);

  const result: Partial<Record<number, TrimestralPlanningLike>> = {};

  for (const trimestre of unique) {
    result[trimestre] = buildTrimestralPlanningFromAnnual(annual, trimestre, options);
  }

  return result;
}
