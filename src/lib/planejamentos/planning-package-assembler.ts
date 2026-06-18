import type { PacoteTrimestralAnual } from "@/lib/planejamentos/planning-editor-bundle";
import { pacoteTrimestralAnualToTrimestres } from "@/lib/planejamentos/planning-editor-bundle";
import {
  buildTrimestralPlansFromAnnual,
  type AnnualPlanningLike,
  type TrimestralPlanningLike,
} from "@/lib/planejamentos/planning-trimestral-from-annual";

export type PlanningPackageSnapshot = {
  annual: AnnualPlanningLike;
  trimestrais: Partial<Record<number, TrimestralPlanningLike>> | null;
  trimestres: number[];
  bundleDocumentCount: number;
  bundleLabels: string[];
  trimestralPlanCounts: Record<string, number>;
};

/**
 * Ponto único no cliente para extrair trimestres do anual e validar o pacote.
 * Espelha assembleTrimestralPackage do motor servidor.
 */
export function assembleClientPlanningPackage(
  annual: AnnualPlanningLike,
  pacoteTrimestralAnual: PacoteTrimestralAnual,
): PlanningPackageSnapshot {
  const trimestres = pacoteTrimestralAnualToTrimestres(pacoteTrimestralAnual);

  if (!trimestres.length) {
    return {
      annual,
      trimestrais: null,
      trimestres: [],
      bundleDocumentCount: 1,
      bundleLabels: ["Anual"],
      trimestralPlanCounts: {},
    };
  }

  const trimestrais = buildTrimestralPlansFromAnnual(annual, trimestres);
  const trimestralPlanCounts = Object.fromEntries(
    Object.entries(trimestrais).map(([key, plan]) => [key, plan?.conteudos?.length ?? 0]),
  );

  const bundleLabels = ["Anual"];
  for (const trimestre of trimestres) {
    if (trimestrais[trimestre]?.conteudos?.length) {
      bundleLabels.push(`${trimestre}º trimestre`);
    }
  }

  return {
    annual,
    trimestrais,
    trimestres,
    bundleDocumentCount: bundleLabels.length,
    bundleLabels,
    trimestralPlanCounts,
  };
}

export function resolveBundleActiveIndex(
  trimestres: number[],
  previewKey: "anual" | number,
): number {
  if (previewKey === "anual") {
    return 0;
  }

  const index = trimestres.indexOf(previewKey);
  return index >= 0 ? index + 1 : 0;
}
