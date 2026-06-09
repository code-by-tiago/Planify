import type { PlanningEditorMeta } from "@/lib/planejamentos/planning-editor-flow";
import { trimestralCargaHorariaLabel } from "@/lib/planejamentos/planning-trimestral-from-annual";
import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

const EDITOR_DOCUMENT_KEY = "planify_editor_document";

type PlanningEditorRawMeta = PlanningEditorMeta & {
  matrizPlanejamento?: unknown;
};

function hasPlanningMatrix(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const conteudos = (value as { conteudos?: unknown }).conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
}

export function inferPlanningTipoFromDocumentType(
  documentType?: string | null,
): "anual" | "trimestral" | null {
  const value = String(documentType || "").toLowerCase();

  if (value.includes("trimestral") || value.includes("trimestre")) {
    return "trimestral";
  }

  if (value.includes("anual")) {
    return "anual";
  }

  return null;
}

function inferTipoFromMatrix(matriz: unknown): "anual" | "trimestral" | null {
  if (!matriz || typeof matriz !== "object") return null;

  const tipo = String(
    (matriz as { tipoPlanejamento?: string }).tipoPlanejamento || "",
  ).toLowerCase();

  if (tipo.includes("tri")) return "trimestral";
  if (tipo.includes("anu")) return "anual";

  return null;
}

function inferTrimestreFromMatrix(matriz: unknown): string | undefined {
  if (!matriz || typeof matriz !== "object") return undefined;

  const direct = (matriz as { trimestre?: unknown }).trimestre;
  if (direct != null && String(direct).trim()) {
    return String(direct);
  }

  const conteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  if (!Array.isArray(conteudos)) return undefined;

  const marked = new Set(
    conteudos
      .map((item) => Number(item.trimestre))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3),
  );

  if (marked.size === 1) {
    return String([...marked][0]);
  }

  return undefined;
}

/** Garante tipo/trimestre corretos para o motor oficial (documentType + matriz vencem geração anual). */
export function enrichOfficialPlanningPayload(
  payload: Record<string, unknown> | null | undefined,
  documentType?: string | null,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const matriz = payload.matrizPlanejamento;
  if (!hasPlanningMatrix(matriz)) return null;

  const fromDocumentType = inferPlanningTipoFromDocumentType(documentType);
  const fromMatrix = inferTipoFromMatrix(matriz);
  const fromPayload = String(payload.tipoPlanejamento || "").toLowerCase();

  let tipoPlanejamento = String(payload.tipoPlanejamento || "").trim();

  if (fromDocumentType === "trimestral") {
    tipoPlanejamento = "trimestral";
  } else if (fromDocumentType === "anual") {
    tipoPlanejamento = "anual";
  } else if (fromMatrix === "trimestral") {
    tipoPlanejamento = "trimestral";
  } else if (
    fromPayload.includes("anu") &&
    payload.trimestre != null &&
    inferTrimestreFromMatrix(matriz)
  ) {
    tipoPlanejamento = "trimestral";
  } else if (!tipoPlanejamento) {
    tipoPlanejamento = fromMatrix || "anual";
  }

  const trimestre =
    payload.trimestre != null && String(payload.trimestre).trim()
      ? String(payload.trimestre)
      : inferTrimestreFromMatrix(matriz);

  const matrizConteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  const cargaHoraria =
    tipoPlanejamento === "trimestral" &&
    Array.isArray(matrizConteudos) &&
    matrizConteudos.length > 0
      ? trimestralCargaHorariaLabel(matrizConteudos)
      : payload.cargaHoraria;

  return {
    ...payload,
    tipoPlanejamento,
    trimestre,
    cargaHoraria,
  };
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
): Record<string, unknown> | null {
  if (!meta) return null;

  const generation = meta.generationPayload;
  const matriz = meta.matrizPlanejamento;

  if (!hasPlanningMatrix(matriz)) {
    return null;
  }

  const tipoFromMeta = meta.tipoPlanejamento;
  const tipoFromMatrix = inferTipoFromMatrix(matriz);
  const tipoPlanejamento =
    tipoFromMeta === "trimestral" || tipoFromMatrix === "trimestral"
      ? "trimestral"
      : tipoFromMeta || tipoFromMatrix || generation?.tipoPlanejamento || "anual";
  const trimestre =
    meta.trimestre ?? generation?.trimestre ?? inferTrimestreFromMatrix(matriz);
  const matrizConteudos = (matriz as { conteudos?: PlanningMatrixItem[] }).conteudos;
  const cargaHoraria =
    tipoPlanejamento === "trimestral" && Array.isArray(matrizConteudos) && matrizConteudos.length > 0
      ? trimestralCargaHorariaLabel(matrizConteudos)
      : generation?.cargaHoraria;

  return enrichOfficialPlanningPayload(
    {
      tipoPlanejamento,
      escola: generation?.escola || meta.escola,
      professor: generation?.professor || meta.professor,
      etapa: generation?.etapa || meta.etapa,
      anoSerie: generation?.anoSerie || meta.anoSerie,
      areaConhecimento: generation?.areaConhecimento,
      componenteCurricular:
        generation?.componenteCurricular || meta.componente || "Componente",
      cargaHoraria,
      trimestre,
      matrizPlanejamento: matriz,
    },
    tipoPlanejamento === "trimestral"
      ? "planejamento:trimestral"
      : tipoPlanejamento === "anual"
        ? "planejamento:anual"
        : null,
  );
}

export function resolvePlanningPayloadForGoogleExport(
  meta?: PlanningEditorRawMeta | null,
  documentType?: string | null,
): Record<string, unknown> | null {
  const fromMeta = buildOfficialPlanningPayloadFromEditorMeta(meta);
  if (fromMeta) {
    return enrichOfficialPlanningPayload(fromMeta, documentType);
  }

  if (meta) {
    return null;
  }

  const fromStorage = buildOfficialPlanningPayloadFromEditorMeta(
    readPlanningMetaFromEditorStorage(),
  );

  return enrichOfficialPlanningPayload(fromStorage, documentType);
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
  matrizPlanejamento: unknown;
}): Record<string, unknown> | null {
  if (!hasPlanningMatrix(input.matrizPlanejamento)) {
    return null;
  }

  return enrichOfficialPlanningPayload(
    {
      tipoPlanejamento: input.tipoPlanejamento,
      escola: input.escola,
      professor: input.professor,
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento,
      componenteCurricular: input.componenteCurricular,
      cargaHoraria: input.cargaHoraria,
      trimestre: input.trimestre,
      matrizPlanejamento: input.matrizPlanejamento,
    },
    input.tipoPlanejamento === "trimestral"
      ? "planejamento:trimestral"
      : input.tipoPlanejamento === "anual"
        ? "planejamento:anual"
        : null,
  );
}
