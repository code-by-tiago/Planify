import { NextRequest, NextResponse } from "next/server";
import { UnifiedQualityGateError } from "@/lib/materiais/unified-quality-gate";
import { generatePlanningWithAI } from "@/server/planejamentos/planning-ai-service";
import { validatePlanningPayload } from "@/server/planejamentos/planning-validation";
import type { PlanningAiPayload } from "@/server/planejamentos/planning-ai-service";
import {
  applyPlanningTrialUsageCookies,
  checkPlanningTrialRateLimit,
  markPlanningTrialUsage,
  resolvePlanningTrialFingerprint,
} from "@/server/public/planning-trial-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BODY_BYTES = 32_000;

export async function GET(request: NextRequest) {
  const state = await checkPlanningTrialRateLimit(request);

  return NextResponse.json({
    success: true,
    limited: state.limited,
  });
}

export async function POST(request: NextRequest) {
  const rateState = await checkPlanningTrialRateLimit(request);

  if (rateState.limited) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "trial_limit_reached",
          message: "Você já testou o planejamento grátis neste dispositivo.",
        },
      },
      { status: 429 },
    );
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Requisição muito grande." },
      },
      { status: 413 },
    );
  }

  let payload: PlanningAiPayload | null = null;

  try {
    payload = JSON.parse(rawBody) as PlanningAiPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Corpo da requisição inválido." },
      },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Corpo da requisição inválido." },
      },
      { status: 400 },
    );
  }

  const trialPayload: PlanningAiPayload = {
    ...payload,
    tipoPlanejamento: "anual",
  };

  const validationError = validatePlanningPayload(trialPayload);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        error: { message: validationError },
      },
      { status: 400 },
    );
  }

  const fingerprint = resolvePlanningTrialFingerprint(request);
  let reservedAt: number | null = null;

  try {
    reservedAt = await markPlanningTrialUsage(request, fingerprint);

    const result = await generatePlanningWithAI(trialPayload, { userId: null });

    const response = NextResponse.json({
      ...result,
      success: result.success,
      materialId: null,
      persistWarning: null,
    });

    applyPlanningTrialUsageCookies(request, response, fingerprint, reservedAt);
    return response;
  } catch (error) {
    if (error instanceof UnifiedQualityGateError) {
      const response = NextResponse.json(
        {
          success: false,
          code: "quality_gate_failed",
          error: {
            code: "quality_gate_failed",
            message: error.message,
          },
          qualityScore: error.qualityScore,
          qualityIssues: error.qualityIssues,
        },
        { status: 422 },
      );

      if (reservedAt !== null) {
        applyPlanningTrialUsageCookies(request, response, fingerprint, reservedAt);
      }

      return response;
    }

    const response = NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o planejamento de teste.",
        },
      },
      { status: 500 },
    );

    if (reservedAt !== null) {
      applyPlanningTrialUsageCookies(request, response, fingerprint, reservedAt);
    }

    return response;
  }
}
