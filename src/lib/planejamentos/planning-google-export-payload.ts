import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

const EDITOR_DOCUMENT_KEY = "planify_editor_document";

type PlanningEditorRawMeta = PlanningEditorMeta & {
  matrizPlanejamento?: unknown;
};

export type PlanningExportContext = {
  documentType?: string | null;
  documentId?: string | null;
  title?: string | null;
};

function normalizePlanningTipo(value: unknown): "anual" | "trimestral" | null {
  const raw = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (raw.includes("tri")) return "trimestral";
  if (raw.includes("anu")) return "anual";
  return null;
}

function inferTrimestreFromMatrix(matriz: unknown): string | undefined {
  if (!matriz || typeof matriz !== "object") return undefined;

  const conteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  if (!Array.isArray(conteudos) || conteudos.length === 0) return undefined;

  const marked = new Set(
    conteudos
      .map((item) => Number(item.trimestre))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3),
  );

  if (marked.size === 1) {
    return String(Array.from(marked)[0]);
  }

  return undefined;
}

export function inferPlanningTipoFromExportContext(
  context?: PlanningExportContext | null,
): "anual" | "trimestral" | null {
  const documentType = String(context?.documentType || "").toLowerCase();
  if (documentType.includes("trimestral") || documentType.includes("trimestre")) {
    return "trimestral";
  }
  if (documentType.includes("anual")) {
    return "anual";
  }

  const documentId = String(context?.documentId || "").toLowerCase();
  if (/_trim[123]\b/.test(documentId) || /\btrim[123]\b/.test(documentId)) {
    return "trimestral";
  }

  const title = String(context?.title || "").toLowerCase();
  if (title.includes("trimestral") || /[123][º°o]?\s*trimestre/.test(title)) {
    return "trimestral";
  }
  if (title.includes("anual")) {
    return "anual";
  }

  return null;
}

export function inferPlanningTrimestreFromExportContext(
  context?: PlanningExportContext | null,
): string | undefined {
  const documentId = String(context?.documentId || "");
  const fromId = documentId.match(/_trim([123])\b/i) || documentId.match(/\btrim([123])\b/i);
  if (fromId) return fromId[1];

  const title = String(context?.title || "");
  const fromTitle = title.match(/([123])[º°o]?\s*trimestre/i);
  if (fromTitle) return fromTitle[1];

  const documentType = String(context?.documentType || "");
  const fromType = documentType.match(/trimestral[_:-]?([123])/i);
  if (fromType) return fromType[1];

  return undefined;
}

function resolvePlanningTipoAndTrimestre(
  meta: PlanningEditorRawMeta,
  context?: PlanningExportContext | null,
): { tipoPlanejamento: "anual" | "trimestral"; trimestre?: string } {
  const generation = meta.generationPayload;
  const inferredTipo = inferPlanningTipoFromExportContext(context);
  const metaTipo = normalizePlanningTipo(meta.tipoPlanejamento);
  const generationTipo = normalizePlanningTipo(generation?.tipoPlanejamento);
  const matrixTipo = normalizePlanningTipo(
    (meta.matrizPlanejamento as { tipoPlanejamento?: string } | undefined)?.tipoPlanejamento,
  );

  const tipoPlanejamento =
    metaTipo ||
    inferredTipo ||
    matrixTipo ||
    generationTipo ||
    "anual";

  const trimestre =
    meta.trimestre ??
    inferPlanningTrimestreFromExportContext(context) ??
    inferTrimestreFromMatrix(meta.matrizPlanejamento) ??
    generation?.trimestre;

  return {
    tipoPlanejamento,
    trimestre: trimestre ? String(trimestre) : undefined,
  };
}

function hasPlanningMatrix(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const conteudos = (value as { conteudos?: unknown }).conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
}

export function readPlanningMetaFromEditorStorage(): PlanningEditorRawMeta | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(EDITOR_DOCUMENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { payload?: { raw?: unknown } };
    const meta = parsed?.payload?.raw;

    return meta && typeof meta === "object" ? (meta as PlanningEditorRawMeta) : null;
  } catch {
    return null;
  }
}

/** Payload serializável para /api/google/docs|drive/export — sem imports de server. */
export function buildOfficialPlanningPayloadFromEditorMeta(
  meta: PlanningEditorRawMeta | null | undefined,
  context?: PlanningExportContext | null,
): Record<string, unknown> | null {
  if (!meta) return null;

  const generation = meta.generationPayload;
  const matriz = meta.matrizPlanejamento;

  if (!hasPlanningMatrix(matriz)) {
    return null;
  }

  const { tipoPlanejamento, trimestre } = resolvePlanningTipoAndTrimestre(meta, context);
  const matrizConteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  const cargaHoraria =
    tipoPlanejamento === "trimestral" && Array.isArray(matrizConteudos) && matrizConteudos.length > 0
      ? trimestralCargaHorariaLabel(matrizConteudos)
      : generation?.cargaHoraria;

  return {
    tipoPlanejamento,
    escola: generation?.escola || meta.escola,
    professor: generation?.professor || meta.professor,
    etapa: generation?.etapa || meta.etapa,
    anoSerie: generation?.anoSerie || meta.anoSerie,
    turma: generation?.turma || generation?.className || meta.turma,
    className: generation?.className || generation?.turma || meta.className,
    areaConhecimento: generation?.areaConhecimento,
    componenteCurricular:
      generation?.componenteCurricular || meta.componente || "Componente",
    cargaHoraria,
    trimestre,
    matrizPlanejamento: matriz,
    ...(context?.documentId ? { documentId: context.documentId } : {}),
  };
}

export function resolvePlanningPayloadForGoogleExport(
  meta?: PlanningEditorRawMeta | null,
  context?: PlanningExportContext | null,
): Record<string, unknown> | null {
  return (
    buildOfficialPlanningPayloadFromEditorMeta(meta, context) ||
    buildOfficialPlanningPayloadFromEditorMeta(readPlanningMetaFromEditorStorage(), context)
  );
}

/** Payload oficial para export Google a partir do gerador de planejamentos. */
export function buildOfficialPlanningPayloadFromGeneration(input: {
  tipoPlanejamento: string;
  escola?: string;
  professor?: string;
  etapa?: string;
  anoSerie?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  cargaHoraria?: string;
  trimestre?: string;
  turma?: string;
  className?: string;
  matrizPlanejamento: unknown;
  trimestresExtraidos?: number[];
  matrizesTrimestrais?: Record<string, unknown>;
  planifyQuality?: {
    qualityScore?: number | null;
    qualityIssues?: string[];
  };
}): Record<string, unknown> | null {
  if (!hasPlanningMatrix(input.matrizPlanejamento)) {
    return null;
  }

  const qualityScore = input.planifyQuality?.qualityScore;
  const qualityIssues = input.planifyQuality?.qualityIssues ?? [];

  return {
    tipoPlanejamento: input.tipoPlanejamento,
    escola: input.escola,
    professor: input.professor,
    etapa: input.etapa,
    anoSerie: input.anoSerie,
    turma: input.turma || input.className,
    className: input.className || input.turma,
    areaConhecimento: input.areaConhecimento,
    componenteCurricular: input.componenteCurricular,
    cargaHoraria: input.cargaHoraria,
    trimestre: input.trimestre,
    matrizPlanejamento: input.matrizPlanejamento,
    ...(Array.isArray(input.trimestresExtraidos) && input.trimestresExtraidos.length > 0
      ? { trimestresExtraidos: input.trimestresExtraidos }
      : {}),
    ...(input.matrizesTrimestrais && Object.keys(input.matrizesTrimestrais).length > 0
      ? { matrizesTrimestrais: input.matrizesTrimestrais }
      : {}),
    ...(typeof qualityScore === "number" || qualityIssues.length > 0
      ? {
          _planifyQualityScore:
            typeof qualityScore === "number" ? qualityScore : undefined,
          _planifyQualityIssues: qualityIssues,
        }
      : {}),
  };
}
