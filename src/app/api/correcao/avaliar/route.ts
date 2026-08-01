import { NextRequest, NextResponse } from "next/server";
import { CORRECAO_GENERATION_TYPE } from "@/types/correction";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  logGenerationComplete,
  bucketQualityScore,
} from "@/server/telemetry/generation-telemetry";
import {
  evaluateCorrectionWithAI,
  type CorrectionAiPayload,
} from "@/server/correcao/correction-ai-service";
import {
  appendQualityRetryNote,
  runQualityRetry,
} from "@/server/generation/quality-retry";
import { assessCorrectionQuality } from "@/server/correcao/correction-quality";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type CorrectionSuccess = Extract<
  Awaited<ReturnType<typeof evaluateCorrectionWithAI>>,
  { ok: true }
>;

async function evaluateWithQualityRetry(payload: CorrectionAiPayload) {
  const outcome = await runQualityRetry({
    input: payload,
    generate: async (input) => evaluateCorrectionWithAI(input),
    assess: (value) => assessCorrectionQuality(value.result),
    buildRetryInput: (input, issues) => ({
      ...input,
      rubrica: appendQualityRetryNote(input.rubrica, issues),
    }),
  });

  if (!outcome.ok) return outcome;

  return {
    ok: true as const,
    result: outcome.value.result,
    quality: outcome.quality,
    retried: outcome.retried,
  };
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const payload = (await request.json().catch(() => null)) as CorrectionAiPayload | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  try {
    const evaluated = await evaluateWithQualityRetry(payload);

    if (!evaluated.ok) {
      return NextResponse.json(
        { ok: false, message: evaluated.message },
        { status: evaluated.status },
      );
    }

    const { result, quality, retried } = evaluated;
    if (!quality.pass) {
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

    logGenerationComplete({
      surface: "material",
      tipo: CORRECAO_GENERATION_TYPE,
      pipeline: retried ? "correcao-ai-quality-retry" : "correcao-ai",
      qualityScoreBucket: bucketQualityScore(quality.qualityScore),
      elevarQualidade: retried,
      usedAI: true,
      dailyQuotaConsumed: false,
    });

    return NextResponse.json({
      ok: true,
      result,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.qualityIssues,
      creditCost: 0,
    });
  } catch (error) {
    console.error("[correcao/avaliar] unexpected failure:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro inesperado ao corrigir. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "correcao-ia" },
  handlePost,
);
