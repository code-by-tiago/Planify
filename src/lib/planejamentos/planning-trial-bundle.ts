import type { PacoteTrimestralAnual } from "@/lib/planejamentos/planning-editor-bundle";
import { buildPlanningEditorHtml, type GeneratedPlanningHtml } from "@/lib/planejamentos/planning-editor-html";
import type {
  PlanningTrialBundleTab,
  PlanningTrialStoredDocument,
} from "@/lib/planejamentos/planning-trial-storage";
import {
  trimestralCargaHorariaLabel,
  type TrimestralPlanningLike,
} from "@/lib/planejamentos/planning-trimestral-from-annual";

export type PlanningTrialFormSnapshot = {
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  cargaHoraria: string;
  tipoPlanejamento: "anual";
  pacoteTrimestralAnual: PacoteTrimestralAnual;
};

export function previewMatrizKeyToTabId(key: "anual" | 1 | 2 | 3): string {
  if (key === "anual") return "anual";
  return `trim${key}`;
}

export function buildPlanningTrialStoredDocument(params: {
  form: PlanningTrialFormSnapshot;
  planning: GeneratedPlanningHtml;
  trimestres: number[];
  trimestralPlans: Partial<Record<number, TrimestralPlanningLike>> | null;
  activeTabId?: string;
  qualityScore?: number | null;
  qualityIssues?: string[];
}): PlanningTrialStoredDocument {
  const {
    form,
    planning,
    trimestres,
    trimestralPlans,
    activeTabId = "anual",
    qualityScore,
    qualityIssues,
  } = params;

  const tabs: PlanningTrialBundleTab[] = [
    {
      id: "anual",
      label: "Anual",
      title: planning.titulo || "Planejamento anual",
      html: buildPlanningEditorHtml(
        { ...form, tipoPlanejamento: "anual" },
        planning,
      ),
    },
  ];

  for (const trimestre of trimestres) {
    const trimPlan = trimestralPlans?.[trimestre];
    if (!trimPlan?.conteudos?.length) continue;

    const trimForm = {
      ...form,
      tipoPlanejamento: "trimestral" as const,
      trimestre: String(trimestre),
      cargaHoraria: trimestralCargaHorariaLabel(trimPlan.conteudos),
    };

    tabs.push({
      id: `trim${trimestre}`,
      label: `${trimestre}º trimestre`,
      title: trimPlan.titulo || `${trimestre}º trimestre`,
      html: buildPlanningEditorHtml(trimForm, trimPlan),
    });
  }

  const resolvedActiveTabId = tabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : "anual";

  return {
    tabs,
    activeTabId: resolvedActiveTabId,
    form,
    planning,
    trimestralPlans: trimestralPlans ?? undefined,
    qualityScore,
    qualityIssues,
    savedAt: new Date().toISOString(),
  };
}
