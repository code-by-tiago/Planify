import {
  buildPlanningEditorHtml,
  type GeneratedPlanningHtml,
  type PlanningEditorHtmlContext,
} from "@/lib/planejamentos/planning-editor-html";
import {
  buildOfficialPlanningPayloadFromGeneration,
  type PlanningExportContext,
} from "@/lib/planejamentos/planning-google-export-payload";

export type OfficialPlanningPayloadInput = Parameters<
  typeof buildOfficialPlanningPayloadFromGeneration
>[0];

export type PlanningEditorHtmlSource =
  | "official-preloaded"
  | "official-fetched"
  | "fallback";

export type PlanningHtmlTemplateMarker =
  | "official-docx"
  | "official-template"
  | "simplified-fallback"
  | "unknown";

export function isOfficialPlanningHtmlMarker(marker: PlanningHtmlTemplateMarker): boolean {
  return marker === "official-docx" || marker === "official-template";
}

export class PlanningOfficialHtmlError extends Error {
  readonly reason: "no-matrix" | "fetch-failed" | "invalid-preload";

  constructor(message: string, reason: "no-matrix" | "fetch-failed" | "invalid-preload") {
    super(message);
    this.name = "PlanningOfficialHtmlError";
    this.reason = reason;
  }
}

export function detectPlanningHtmlSource(html: string): PlanningHtmlTemplateMarker {
  if (html.includes('data-planify-html-source="official-docx"')) {
    return "official-docx";
  }
  if (html.includes('data-planify-html-source="official-template"')) {
    return "official-template";
  }
  if (html.includes('data-planify-html-source="simplified-fallback"')) {
    return "simplified-fallback";
  }
  return "unknown";
}

export function normalizeOfficialPayloadInput(input: {
  tipoPlanejamento?: string | null;
  escola?: string | null;
  professor?: string | null;
  etapa?: string | null;
  anoSerie?: string | null;
  turma?: string | null;
  areaConhecimento?: string | null;
  componenteCurricular?: string | null;
  cargaHoraria?: string | number | null;
  trimestre?: string | number | null;
  matrizPlanejamento: unknown;
  planifyQuality?: OfficialPlanningPayloadInput["planifyQuality"];
}): OfficialPlanningPayloadInput {
  return {
    tipoPlanejamento: String(input.tipoPlanejamento || "anual"),
    escola: input.escola ?? undefined,
    professor: input.professor ?? undefined,
    etapa: input.etapa ?? undefined,
    anoSerie: input.anoSerie ?? undefined,
    turma: input.turma ?? undefined,
    areaConhecimento: input.areaConhecimento ?? undefined,
    componenteCurricular: input.componenteCurricular ?? undefined,
    cargaHoraria:
      input.cargaHoraria != null ? String(input.cargaHoraria) : undefined,
    trimestre: input.trimestre != null ? String(input.trimestre) : undefined,
    matrizPlanejamento: input.matrizPlanejamento,
    planifyQuality: input.planifyQuality,
  };
}

export async function fetchOfficialPlanningEditorHtml(
  payload: Record<string, unknown>,
  exportContext?: PlanningExportContext | null,
): Promise<string> {
  const requestPayload = { ...payload };

  if (exportContext?.documentType) {
    requestPayload.documentType = exportContext.documentType;
  }
  if (exportContext?.documentId) {
    requestPayload.documentId = exportContext.documentId;
  }

  const response = await fetch("/api/planejamentos/html-oficial", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    html?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.success || typeof data.html !== "string") {
    throw new PlanningOfficialHtmlError(
      data?.error?.message || "Não foi possível renderizar o modelo oficial no editor.",
      "fetch-failed",
    );
  }

  return data.html;
}

export async function resolvePlanningEditorHtml(params: {
  officialPayloadInput: OfficialPlanningPayloadInput;
  fallbackForm: PlanningEditorHtmlContext;
  fallbackPlanning: GeneratedPlanningHtml;
  preloadedHtml?: string | null;
  exportContext?: PlanningExportContext | null;
  allowFallback?: boolean;
}): Promise<{ html: string; source: PlanningEditorHtmlSource }> {
  const {
    officialPayloadInput,
    fallbackForm,
    fallbackPlanning,
    preloadedHtml,
    exportContext,
    allowFallback = false,
  } = params;

  const officialPayload = buildOfficialPlanningPayloadFromGeneration(officialPayloadInput);

  if (typeof preloadedHtml === "string" && preloadedHtml.trim()) {
    const marker = detectPlanningHtmlSource(preloadedHtml);
    if (marker === "official-docx") {
      return { html: preloadedHtml, source: "official-preloaded" };
    }
  }

  if (!officialPayload) {
    if (allowFallback) {
      const html = buildPlanningEditorHtml(fallbackForm, fallbackPlanning);
      return { html, source: "fallback" };
    }

    throw new PlanningOfficialHtmlError(
      "Não foi possível montar o modelo oficial: matriz pedagógica ausente.",
      "no-matrix",
    );
  }

  if (exportContext?.documentId) {
    officialPayload.documentId = exportContext.documentId;
  }

  try {
    const html = await fetchOfficialPlanningEditorHtml(officialPayload, exportContext);
    const marker = detectPlanningHtmlSource(html);

    if (marker !== "official-docx") {
      throw new PlanningOfficialHtmlError(
        "A API retornou HTML sem o marcador do modelo oficial DOCX.",
        "invalid-preload",
      );
    }

    return { html, source: "official-fetched" };
  } catch (error) {
    if (!allowFallback) {
      if (error instanceof PlanningOfficialHtmlError) {
        throw error;
      }

      throw new PlanningOfficialHtmlError(
        error instanceof Error
          ? error.message
          : "Não foi possível renderizar o modelo oficial no editor.",
        "fetch-failed",
      );
    }

    const html = buildPlanningEditorHtml(fallbackForm, fallbackPlanning);
    return { html, source: "fallback" };
  }
}
