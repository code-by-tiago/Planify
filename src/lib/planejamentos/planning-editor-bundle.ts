import {
  createEditorDocument,
  saveEditorDocument,
} from "@/lib/editor/editor-storage";
import { saveEditorDocumentToHistory } from "@/lib/history/history-storage";
import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";

export const PLANNING_EDITOR_BUNDLE_KEY = "planify:planejamentos:editor-bundle";

export type PacoteTrimestralAnual = "nenhum" | "1" | "2" | "3" | "todos";

export type PlanningBundleTab = {
  id: string;
  label: string;
  title: string;
  type: string;
  content: string;
  raw?: unknown;
};

export type PlanningEditorBundle = {
  activeIndex: number;
  tabs: PlanningBundleTab[];
};

export type PlanningBundleDocumentInput = {
  id: string;
  label: string;
  title: string;
  html: string;
  type: string;
  meta: PlanningEditorMeta;
  planning: unknown;
};

export function pacoteTrimestralAnualToTrimestres(
  pacote: PacoteTrimestralAnual,
): number[] {
  switch (pacote) {
    case "1":
      return [1];
    case "2":
      return [2];
    case "3":
      return [3];
    case "todos":
      return [1, 2, 3];
    default:
      return [];
  }
}

export function buildPlanningBundleDocumentId(
  idempotencyKey: string,
  suffix: "anual" | "trim1" | "trim2" | "trim3",
): string {
  const key = idempotencyKey.trim().slice(0, 100);
  return `plan_${key}_${suffix}`;
}

export function savePlanningEditorBundle(bundle: PlanningEditorBundle): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PLANNING_EDITOR_BUNDLE_KEY, JSON.stringify(bundle));
}

export function loadPlanningEditorBundle(): PlanningEditorBundle | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PLANNING_EDITOR_BUNDLE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PlanningEditorBundle;
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) {
      return null;
    }

    return {
      activeIndex:
        Number.isFinite(parsed.activeIndex) && parsed.activeIndex >= 0
          ? parsed.activeIndex
          : 0,
      tabs: parsed.tabs,
    };
  } catch {
    return null;
  }
}

export function clearPlanningEditorBundle(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PLANNING_EDITOR_BUNDLE_KEY);
}

function toBundleTab(
  doc: PlanningBundleDocumentInput,
  content: string,
): PlanningBundleTab {
  const tipoFromType = doc.type.includes("trimestral") ? "trimestral" : "anual";
  const trimestreFromId = doc.id.match(/_trim([123])\b/i)?.[1];

  return {
    id: doc.id,
    label: doc.label,
    title: doc.title,
    type: doc.type,
    content,
    raw: {
      ...doc.meta,
      tipoPlanejamento: doc.meta.tipoPlanejamento || tipoFromType,
      trimestre: doc.meta.trimestre || trimestreFromId,
      matrizPlanejamento: doc.planning,
    },
  };
}

function persistBundleDocument(doc: PlanningBundleDocumentInput, content: string) {
  const editorDoc = createEditorDocument({
    id: doc.id,
    source: "planejamento",
    title: doc.title,
    subtitle: `${doc.meta.componente} · ${doc.meta.anoSerie}`,
    type: doc.type,
    content,
    raw: { ...doc.meta, matrizPlanejamento: doc.planning },
  });

  saveEditorDocumentToHistory(editorDoc);
  return editorDoc;
}

export function persistPlanningBundleDocuments(
  documents: PlanningBundleDocumentInput[],
): PlanningEditorBundle {
  const tabs = documents.map((doc) => {
    persistBundleDocument(doc, doc.html);
    return toBundleTab(doc, doc.html);
  });

  return { activeIndex: 0, tabs };
}

export function openPlanningBundleInEditor(
  documents: PlanningBundleDocumentInput[],
  activeIndex = 0,
): void {
  if (typeof window === "undefined" || documents.length === 0) {
    return;
  }

  const tabs = documents.map((doc) => {
    persistBundleDocument(doc, doc.html);
    return toBundleTab(doc, doc.html);
  });

  const safeIndex = Math.min(Math.max(activeIndex, 0), tabs.length - 1);
  const active = tabs[safeIndex];
  const activeInput = documents[safeIndex];

  saveEditorDocument(
    createEditorDocument({
      id: active.id,
      source: "planejamento",
      title: active.title,
      subtitle: `${activeInput.meta.componente} · ${activeInput.meta.anoSerie}`,
      type: active.type,
      content: active.content,
      raw: active.raw,
    }),
  );

  savePlanningEditorBundle({ activeIndex: safeIndex, tabs });
  window.location.href = "/editor?from=planejamentos&bundle=1";
}
