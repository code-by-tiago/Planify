import { NextRequest, NextResponse } from "next/server";
import { PEI_GENERATION_TYPE, type PeiGenerationRequest } from "@/lib/pei/pei-options";
import {
  generatePeiDocument,
  validatePeiPayload,
} from "@/server/pei/pei-engine";
import { assessPeiQuality } from "@/server/pei/pei-quality";
import {
  appendQualityRetryNote,
  runQualityRetry,
} from "@/server/generation/quality-retry";
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

type PeiEngineSuccess = Extract<
  Awaited<ReturnType<typeof generatePeiDocument>>,
  { ok: true }
>;

async function generatePeiWithQualityRetry(payload: PeiGenerationRequest) {
  const outcome = await runQualityRetry({
    input: payload,
    generate: async (input) => generatePeiDocument(input),
    assess: (result) =>
      assessPeiQuality({
        perfil: result.estrutura.perfil,
        suportes: result.estrutura.suportes,
        acessibilidade: result.estrutura.acessibilidade,
        curricularRows: result.estrutura.curricularRows,
        planejamento: result.estrutura.planejamento,
        parecer: result.parecer,
        usedAI: result.usedAI,
      }),
    buildRetryInput: (input, issues) => ({
      ...input,
      observacoes: appendQualityRetryNote(input.observacoes, issues),
    }),
  });

  if (!outcome.ok) return outcome;

  return {
    ok: true as const,
    result: outcome.value as PeiEngineSuccess,
    quality: outcome.quality,
    retried: outcome.retried,
  };
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const prepared = await prepareGenerationRequest<PeiGenerationRequest>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as PeiGenerationRequest) : null,
    resolveTipo: () => PEI_GENERATION_TYPE,
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
    const generated = await generatePeiWithQualityRetry(payload);

    if (!generated.ok) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: String(generated.status),
        metadata: { message: generated.message },
      });

      return NextResponse.json(
        { ok: false, message: generated.message },
        { status: generated.status },
      );
    }

    const { result, quality, retried } = generated;

    if (!quality.pass) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: "quality_gate",
        metadata: {
          qualityScore: quality.qualityScore,
          qualityIssues: quality.qualityIssues,
          retried,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          code: "quality_gate",
          message: quality.message,
          qualityScore: quality.qualityScore,
          qualityIssues: quality.qualityIssues,
        },
        { status: 422 },
      );
    }

    logGenerationSuccessEvent({
      surface: "material",
      tipo,
      pipeline: retried ? "pei-ai-quality-retry" : result.pipeline,
      qualityScore: quality.qualityScore,
      elevarQualidade: retried,
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
        pipeline: retried ? "pei-ai-quality-retry" : result.pipeline,
        qualityScore: quality.qualityScore,
        payload: payload as unknown as Record<string, unknown>,
        result: {
          title: result.title,
          html: result.html,
          parecer: result.parecer,
          pipeline: retried ? "pei-ai-quality-retry" : result.pipeline,
          qualityScore: quality.qualityScore,
          qualityIssues: quality.qualityIssues,
          estrutura: result.estrutura,
          alertas: result.alertas,
          retried,
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
      pipeline: retried ? "pei-ai-quality-retry" : result.pipeline,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.qualityIssues,
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
