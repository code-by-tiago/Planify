import { NextRequest, NextResponse } from "next/server";
import { INCLUSAO_GENERATION_TYPE } from "@/lib/inclusao/inclusao-config";
import {
  generateInclusaoWithAI,
  type InclusaoAiPayload,
} from "@/server/inclusao/inclusao-ai-service";
import { assessInclusaoQuality } from "@/server/inclusao/inclusao-quality";
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
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type InclusaoSuccess = Extract<
  Awaited<ReturnType<typeof generateInclusaoWithAI>>,
  { ok: true }
>;

async function generateWithQualityRetry(
  payload: InclusaoAiPayload,
  userId?: string | null,
) {
  const outcome = await runQualityRetry({
    input: payload,
    generate: async (input) => generateInclusaoWithAI(input, { userId }),
    assess: (result) =>
      assessInclusaoQuality({
        modo: payload.modo,
        markdown: result.markdown,
        sourceContent: payload.conteudo,
      }),
    buildRetryInput: (input, issues) => ({
      ...input,
      observacoes: appendQualityRetryNote(input.observacoes, issues),
    }),
  });

  if (!outcome.ok) return outcome;

  return {
    ok: true as const,
    result: outcome.value as InclusaoSuccess,
    quality: outcome.quality,
    retried: outcome.retried,
  };
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const prepared = await prepareGenerationRequest<InclusaoAiPayload>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as InclusaoAiPayload) : null,
    resolveTipo: () => INCLUSAO_GENERATION_TYPE,
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;

  try {
    const generated = await generateWithQualityRetry(payload, user?.id ?? null);

    if (!generated.ok) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: String(generated.status),
        metadata: { message: generated.message, modo: payload.modo },
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
          modo: payload.modo,
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
      tipo: `${tipo}:${payload.modo}`,
      pipeline: retried
        ? "inclusao-ai-quality-retry"
        : result.usedAI
          ? "inclusao-ai"
          : "inclusao-fallback",
      qualityScore: quality.qualityScore,
      elevarQualidade: retried,
      usedAI: result.usedAI,
      dailyQuotaConsumed: charge.chargedDeepDaily && result.usedAI,
    });

    if (user?.id) {
      await persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "inclusao",
        tipo: `${tipo}:${payload.modo}`,
        classId: payload.classId || null,
        className: payload.className?.trim() || payload.turma?.trim() || null,
        discipline:
          payload.discipline?.trim() || payload.disciplina?.trim() || null,
        title: String(payload.conteudo || "Adaptação inclusiva").slice(0, 120),
        contentHtml: result.html,
        contentPreview: result.markdown,
        pipeline: retried ? "inclusao-ai-quality-retry" : "inclusao-ai",
        payload: payload as unknown as Record<string, unknown>,
        result: {
          markdown: result.markdown,
          html: result.html,
          usedAI: result.usedAI,
          qualityScore: quality.qualityScore,
          qualityIssues: quality.qualityIssues,
          retried,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      markdown: result.markdown,
      html: result.html,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.qualityIssues,
      creditCost: resolveGenerationCreditCost(charge, tipo),
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
        : "Erro inesperado ao gerar adaptação inclusiva.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "inclusao" },
  handlePost,
);
