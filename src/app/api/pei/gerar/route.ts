import { NextRequest, NextResponse } from "next/server";
import { PEI_GENERATION_TYPE, type PeiGenerationRequest } from "@/lib/pei/pei-options";
import {
  generatePeiDocument,
  validatePeiPayload,
} from "@/server/pei/pei-engine";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";
import {
  finalizeGenerationFailure,
  logGenerationSuccessEvent,
  prepareGenerationRequest,
  resolveGenerationCreditCost,
} from "@/server/generation/generation-api-shared";
import { jsonGenerationValidationError } from "@/server/generation/generation-api-contract";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília).";

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const prepared = await prepareGenerationRequest<PeiGenerationRequest>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as PeiGenerationRequest) : null,
    resolveTipo: () => PEI_GENERATION_TYPE,
    dailyLimitMessage: DAILY_LIMIT_MESSAGE,
    insufficientCreditsMessage:
      "Você não tem créditos suficientes neste ciclo. Aguarde a renovação mensal ou fale com o suporte se precisar de mais volume.",
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;
  const validationError = validatePeiPayload(payload);

  if (validationError) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "material_generation_failed",
      errorCode: "validation_error",
      metadata: { message: validationError },
    });
    return jsonGenerationValidationError(validationError);
  }

  try {
    const result = await generatePeiDocument(payload);

    if (!result.ok) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: String(result.status),
        metadata: { message: result.message },
      });

      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    logGenerationSuccessEvent({
      surface: "material",
      tipo,
      pipeline: result.pipeline,
      qualityScore: result.qualityScore,
      elevarQualidade: false,
      usedAI: result.usedAI,
      dailyQuotaConsumed: charge.chargedDeepDaily && result.usedAI,
    });

    let materialId: string | null = null;
    if (user?.id) {
      materialId = await persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "material",
        tipo,
        classId: payload.classId || null,
        className: payload.className?.trim() || payload.turma?.trim() || null,
        discipline:
          payload.discipline?.trim() ||
          payload.disciplinaContexto?.trim() ||
          payload.disciplina?.trim() ||
          null,
        title: result.title,
        contentHtml: result.html,
        contentPreview: result.parecer,
        pipeline: result.pipeline,
        qualityScore: result.qualityScore,
        payload: payload as unknown as Record<string, unknown>,
        result: {
          title: result.title,
          html: result.html,
          parecer: result.parecer,
          pipeline: result.pipeline,
          qualityScore: result.qualityScore,
          estrutura: result.estrutura,
          alertas: result.alertas,
        },
      });
    }

    const persistWarning =
      user?.id && !materialId
        ? "O PEI foi gerado, mas não foi possível registrá-lo no Progresso BNCC. Tente novamente em instantes."
        : null;

    return NextResponse.json({
      ok: true,
      html: result.html,
      parecer: result.parecer,
      title: result.title,
      pipeline: result.pipeline,
      qualityScore: result.qualityScore,
      alertas: persistWarning
        ? [...result.alertas, persistWarning]
        : result.alertas,
      creditCost: resolveGenerationCreditCost(charge, tipo),
      materialId,
      persistWarning,
    });
  } catch (error) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "material_generation_failed",
      errorCode: "exception",
      metadata: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar o PEI.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: PEI_GENERATION_TYPE },
  handlePost,
);
