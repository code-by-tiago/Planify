import {
  createEditorDocument,
  saveEditorDocument,
} from "@/lib/editor/editor-storage";
import {
  loadHistoryItems,
  saveHistoryItems,
  upsertHistoryItem,
} from "@/lib/history/history-storage";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import { planifyTools } from "@/lib/pro/planifyTools";
import type { HistoryItem } from "@/types/history";
import { editorDocumentToHistoryItem } from "@/types/history";

export const AUTO_EDITOR_PREF_KEY = "planify:materiais:auto-editor";

const LEGACY_HISTORY_KEYS = [
  "planify-historico-materiais",
  "planify_historico_materiais",
  "planifyHistoricoMateriais",
] as const;

export type MaterialEditorMeta = {
  toolId: PlanifyToolId;
  tema: string;
  componente: string;
  anoSerie: string;
  etapa?: string;
  areaConhecimento?: string;
  pipeline?: string | null;
  slideTheme?: string | null;
  designSlides?: string | null;
  qualityScore?: number | null;
  qualityIssues?: string[];
  generationPayload?: MaterialEngineInput | null;
};

export type MaterialHistoryPreview = {
  id: string;
  titulo: string;
  tipo: PlanifyToolId;
  tema: string;
  componente: string;
  anoSerie: string;
  html: string;
  createdAt: string;
};

type LegacyMaterialHistoryItem = {
  id?: string;
  titulo?: string;
  tipo?: string;
  tema?: string;
  componente?: string;
  anoSerie?: string;
  html?: string;
  createdAt?: string;
};

function isPlanifyToolId(value: string): value is PlanifyToolId {
  return planifyTools.some((tool) => tool.id === value);
}

function resolveToolId(value: unknown): PlanifyToolId {
  const raw = String(value || "").trim();
  if (isPlanifyToolId(raw)) return raw;
  if (raw.startsWith("material:")) {
    const id = raw.replace("material:", "");
    if (isPlanifyToolId(id)) return id;
  }
  return "slides";
}

export function readAutoOpenEditorPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTO_EDITOR_PREF_KEY) !== "false";
}

export function writeAutoOpenEditorPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_EDITOR_PREF_KEY, String(enabled));
}

export function persistGeneratedMaterial(
  html: string,
  title: string,
  meta: MaterialEditorMeta,
): HistoryItem {
  const document = createEditorDocument({
    source: "material",
    title,
    subtitle: `${meta.componente} · ${meta.anoSerie}`,
    type: `material:${meta.toolId}`,
    content: html,
    raw: meta,
  });

  saveEditorDocument(document);
  return editorDocumentToHistoryItem(document);
}

export function openMaterialInEditor(
  html: string,
  title: string,
  meta: MaterialEditorMeta,
  options?: { from?: string; redirect?: boolean },
): void {
  if (typeof window === "undefined") return;

  persistGeneratedMaterial(html, title, meta);

  const params = new URLSearchParams();
  if (options?.from) params.set("from", options.from);
  const query = params.toString();
  const href = query ? `/editor?${query}` : "/editor";

  if (options?.redirect !== false) {
    window.location.href = href;
  }
}

export function historyItemToMaterialPreview(
  item: HistoryItem,
): MaterialHistoryPreview {
  const raw = item.raw as MaterialEditorMeta | undefined;
  const toolId = resolveToolId(raw?.toolId || item.type);

  return {
    id: item.id,
    titulo: item.title,
    tipo: toolId,
    tema: raw?.tema || item.title,
    componente: raw?.componente || item.subtitle?.split("·")[0]?.trim() || "",
    anoSerie: raw?.anoSerie || "",
    html: item.content,
    createdAt: item.createdAt,
  };
}

export function loadMaterialHistoryPreview(limit = 12): MaterialHistoryPreview[] {
  if (typeof window === "undefined") return [];

  migrateLegacyMaterialHistoryOnce();

  return loadHistoryItems()
    .filter((item) => item.source === "material")
    .slice(0, limit)
    .map(historyItemToMaterialPreview);
}

export function clearMaterialHistory(): void {
  if (typeof window === "undefined") return;

  const next = loadHistoryItems().filter((item) => item.source !== "material");
  saveHistoryItems(next);
}

let legacyMigrated = false;

export function migrateLegacyMaterialHistoryOnce(): void {
  if (typeof window === "undefined" || legacyMigrated) return;
  legacyMigrated = true;

  const existingIds = new Set(loadHistoryItems().map((item) => item.id));

  for (const key of LEGACY_HISTORY_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) continue;

      for (const entry of parsed as LegacyMaterialHistoryItem[]) {
        const html = String(entry.html || "").trim();
        if (!html) continue;

        const id = String(entry.id || `legacy-${Date.now()}-${Math.random()}`);
        if (existingIds.has(id)) continue;

        const toolId = resolveToolId(entry.tipo);
        const meta: MaterialEditorMeta = {
          toolId,
          tema: String(entry.tema || entry.titulo || "Material"),
          componente: String(entry.componente || ""),
          anoSerie: String(entry.anoSerie || ""),
        };

        const document = createEditorDocument({
          source: "material",
          title: String(entry.titulo || entry.tema || "Material Planify"),
          subtitle: meta.componente
            ? `${meta.componente} · ${meta.anoSerie}`
            : meta.anoSerie,
          type: `material:${toolId}`,
          content: html,
          raw: { ...meta, migratedFrom: key },
        });

        if (entry.createdAt) {
          document.createdAt = entry.createdAt;
          document.updatedAt = entry.createdAt;
        }

        upsertHistoryItem(editorDocumentToHistoryItem(document));
        existingIds.add(id);
      }

      window.localStorage.removeItem(key);
    } catch {
      // Ignora entradas legadas corrompidas.
    }
  }
}
