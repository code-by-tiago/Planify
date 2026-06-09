import {
  createEditorDocument,
  saveEditorDocument,
} from "@/lib/editor/editor-storage";
import type { PlanningAiPayload } from "@/server/planejamentos/planning-ai-service";

export const AUTO_PLANNING_EDITOR_PREF_KEY = "planify:planejamentos:auto-editor";

export type PlanningEditorMeta = {
  etapa: string;
  anoSerie: string;
  componente: string;
  tipoPlanejamento: string;
  trimestre?: string;
  escola?: string;
  professor?: string;
  generationPayload?: PlanningAiPayload | null;
  qualityScore?: number | null;
  qualityIssues?: string[];
  serverMaterialId?: string | null;
};

export function readAutoOpenPlanningEditorPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTO_PLANNING_EDITOR_PREF_KEY) !== "false";
}

export function writeAutoOpenPlanningEditorPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_PLANNING_EDITOR_PREF_KEY, String(enabled));
}

function resolvePlanningDocumentId(meta: PlanningEditorMeta): string | undefined {
  const key = String(
    meta.generationPayload?.idempotencyKey ||
      meta.generationPayload?.idempotency_key ||
      "",
  ).trim();
  if (!key) return undefined;
  return `plan_${key.slice(0, 120)}`;
}

export function persistPlanningInEditor(
  html: string,
  title: string,
  meta: PlanningEditorMeta,
  raw?: unknown,
): ReturnType<typeof createEditorDocument> {
  const document = createEditorDocument({
    id: resolvePlanningDocumentId(meta),
    source: "planejamento",
    title,
    subtitle: `${meta.componente} · ${meta.anoSerie}`,
    type: `planejamento:${meta.tipoPlanejamento}`,
    content: html,
    raw: { ...meta, matrizPlanejamento: raw },
  });

  saveEditorDocument(document);
  return document;
}

export function openPlanningInEditor(
  html: string,
  title: string,
  meta: PlanningEditorMeta,
  planning?: unknown,
): void {
  if (typeof window === "undefined") return;

  persistPlanningInEditor(html, title, meta, planning);
  window.location.href = "/editor?from=planejamentos";
}
