import type { PacoteTrimestralAnual } from "@/lib/planejamentos/planning-editor-bundle";
import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import type { GeneratedPlanningHtml } from "@/lib/planejamentos/planning-editor-html";
import type { TrimestralPlanningLike } from "@/lib/planejamentos/planning-trimestral-from-annual";

export const PLANNING_TRIAL_STORAGE_KEY = "planify:planning-trial:document";

export type PlanningTrialBundleTab = {
  id: string;
  label: string;
  title: string;
  html: string;
};

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

export type PlanningTrialStoredDocument = {
  tabs: PlanningTrialBundleTab[];
  activeTabId: string;
  form: PlanningTrialFormSnapshot;
  planning: GeneratedPlanningHtml;
  trimestralPlans?: Partial<Record<number, TrimestralPlanningLike>>;
  meta?: PlanningEditorMeta;
  qualityScore?: number | null;
  qualityIssues?: string[];
  savedAt: string;
};

type LegacyPlanningTrialStoredDocument = {
  html?: string;
  title?: string;
  form?: Partial<PlanningTrialFormSnapshot>;
  planning?: GeneratedPlanningHtml;
  qualityScore?: number | null;
  qualityIssues?: string[];
  savedAt?: string;
};

function normalizePlanningTrialDocument(
  raw: unknown,
): PlanningTrialStoredDocument | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as PlanningTrialStoredDocument & LegacyPlanningTrialStoredDocument;

  if (Array.isArray(value.tabs) && value.tabs.length > 0) {
    const activeTabId =
      typeof value.activeTabId === "string" && value.activeTabId.trim()
        ? value.activeTabId
        : value.tabs[0]?.id || "anual";

    if (!value.form || !value.planning) return null;

    return {
      tabs: value.tabs,
      activeTabId,
      form: value.form,
      planning: value.planning,
      trimestralPlans: value.trimestralPlans,
      meta: value.meta,
      qualityScore: value.qualityScore,
      qualityIssues: value.qualityIssues,
      savedAt: value.savedAt || new Date().toISOString(),
    };
  }

  if (typeof value.html === "string" && value.html.trim() && value.planning) {
    const form: PlanningTrialFormSnapshot = {
      escola: value.form?.escola || "",
      professor: value.form?.professor || "",
      etapa: value.form?.etapa || "",
      anoSerie: value.form?.anoSerie || "",
      areaConhecimento: value.form?.areaConhecimento || "",
      componenteCurricular: value.form?.componenteCurricular || "",
      cargaHoraria: value.form?.cargaHoraria || "",
      tipoPlanejamento: "anual",
      pacoteTrimestralAnual: value.form?.pacoteTrimestralAnual || "nenhum",
    };

    return {
      tabs: [
        {
          id: "anual",
          label: "Anual",
          title: value.title || value.planning.titulo || "Planejamento",
          html: value.html,
        },
      ],
      activeTabId: "anual",
      form,
      planning: value.planning,
      qualityScore: value.qualityScore,
      qualityIssues: value.qualityIssues,
      savedAt: value.savedAt || new Date().toISOString(),
    };
  }

  return null;
}

export function savePlanningTrialDocument(doc: PlanningTrialStoredDocument): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLANNING_TRIAL_STORAGE_KEY, JSON.stringify(doc));
}

export function readPlanningTrialDocument(): PlanningTrialStoredDocument | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(PLANNING_TRIAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizePlanningTrialDocument(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPlanningTrialDocument(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PLANNING_TRIAL_STORAGE_KEY);
}

export function getActivePlanningTrialTab(
  doc: PlanningTrialStoredDocument,
): PlanningTrialBundleTab {
  return (
    doc.tabs.find((tab) => tab.id === doc.activeTabId) ||
    doc.tabs[0] || {
      id: "anual",
      label: "Anual",
      title: "Planejamento",
      html: "",
    }
  );
}
