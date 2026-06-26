import { NextRequest, NextResponse } from "next/server";
import { UnifiedQualityGateError } from "@/lib/materiais/unified-quality-gate";
import { generatePlanningWithAI } from "@/server/planejamentos/planning-ai-service";
import { validatePlanningPayload } from "@/server/planejamentos/planning-validation";
import type { PlanningAiPayload } from "@/server/planejamentos/planning-ai-service";
import { isPlanningTrialRequestOriginAllowed } from "@/server/public/planning-trial-origin";
import {
  applyPlanningTrialUsageCookies,
  checkPlanningTrialRateLimit,
  resolvePlanningTrialFingerprint,
  tryConsumePlanningTrialUsage,
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
  if (!isPlanningTrialRequestOriginAllowed(request)) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Origem da requisição não permitida." },
      },
      { status: 403 },
    );
  }

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

  try {
    const result = await generatePlanningWithAI(trialPayload, { userId: null });

    if (!result?.planejamento) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Não foi possível gerar o planejamento de teste. Tente novamente.",
          },
          retryable: true,
        },
        { status: 500 },
      );
    }

    const consume = await tryConsumePlanningTrialUsage(request, fingerprint);

    if (!consume.consumed) {
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

    const response = NextResponse.json({
      ...result,
      success: result.success,
      materialId: null,
      persistWarning: null,
    });

    applyPlanningTrialUsageCookies(request, response, fingerprint, consume.usedAt);
    return response;
  } catch (error) {
    if (error instanceof UnifiedQualityGateError) {
      return NextResponse.json(
        {
          success: false,
          code: "quality_gate_failed",
          error: {
            code: "quality_gate_failed",
            message: error.message,
          },
          qualityScore: error.qualityScore,
          qualityIssues: error.qualityIssues,
          retryable: true,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Não foi possível gerar o planejamento de teste. Tente novamente em instantes.",
        },
        retryable: true,
      },
      { status: 500 },
    );
  }
}
