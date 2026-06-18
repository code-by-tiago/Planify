import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";
import {
  matrixItemsFromTrimestralPlano,
  runTrimestralPipeline,
  runTrimestralPipelineAsync,
  type TrimestralPipelineOptions,
} from "@/lib/planejamentos/planning-trimestral-pipeline";
import {
  type AnnualPlanningLike,
  type TrimestralPlanningLike,
  trimestralCargaHorariaLabel,
} from "@/lib/planejamentos/planning-trimestral-annual-split";

export type { AnnualPlanningLike, TrimestralPlanningLike };
export {
  extractAnnualItemsForTrimester,
  renumberTrimestralMatrixItems,
  trimestralCargaHorariaLabel,
} from "@/lib/planejamentos/planning-trimestral-annual-split";

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
