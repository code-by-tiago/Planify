import { NextRequest, NextResponse } from "next/server";
import {
  PLANNING_DEEP_GENERATION_TYPE,
} from "@/lib/ai/material-generation-policy";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  consumeDeepGeneration,
  refundDeepGeneration,
} from "../../../../server/credits/daily-generation-service";
import { generatePlanningWithAI } from "../../../../server/planejamentos/planning-ai-service";
import { validatePlanningPayload } from "../../../../server/planejamentos/planning-validation";
import type { PlanningAiPayload } from "../../../../server/planejamentos/planning-ai-service";
import {
  bucketQualityScore,
  logGenerationComplete,
} from "../../../../server/telemetry/generation-telemetry";
import { persistGeneratedMaterialBestEffort } from "../../../../server/materials/persist-generated-material";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia — ou gere flashcards e resumos, que não contam na cota.";

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  let chargedDeepDaily = false;

  if (user?.id && process.env.GEMINI_API_KEY) {
    const daily = await consumeDeepGeneration({
      userId: user.id,
      tipo: PLANNING_DEEP_GENERATION_TYPE,
      email: user.email,
    });

    if (daily.status === "limit_reached") {
      return NextResponse.json(
        {
          success: false,
          code: "daily_limit_reached",
          error: {
            message: DAILY_LIMIT_MESSAGE.replace(
              "suas gerações profundas",
              `suas ${daily.limit} gerações profundas`,
            ),
          },
          used: daily.used,
          limit: daily.limit,
        },
        { status: 429 },
      );
    }

    if (daily.status === "ok") {
      chargedDeepDaily = true;
    }
  }

  try {
    const payload = (await request.json()) as PlanningAiPayload;
    const validationError = validatePlanningPayload(payload);

    if (validationError) {
      if (user?.id && chargedDeepDaily) {
        await refundDeepGeneration(user.id);
      }

      return NextResponse.json(
        {
          success: false,
          error: { message: validationError },
        },
        { status: 400 },
      );
    }

    const result = await generatePlanningWithAI(payload);

    const dailyQuotaConsumed = chargedDeepDaily && result.usedAI;

    logGenerationComplete({
      surface: "planning",
      tipo: String(payload.tipoPlanejamento || PLANNING_DEEP_GENERATION_TYPE),
      pipeline: result.usedAI ? "planning-ai" : "planning-fallback",
      qualityScoreBucket: bucketQualityScore(result.qualityScore),
      elevarQualidade: payload.elevarQualidade === true,
      usedAI: result.usedAI,
      dailyQuotaConsumed,
    });

    if (!result.usedAI && user?.id && chargedDeepDaily) {
      await refundDeepGeneration(user.id);
    }

    if (user?.id && result.success) {
      persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "planning",
        tipo: String(payload.tipoPlanejamento || PLANNING_DEEP_GENERATION_TYPE),
        pipeline: result.usedAI ? "planning-ai" : "planning-fallback",
        qualityScore:
          typeof result.qualityScore === "number" ? result.qualityScore : null,
        payload: payload as Record<string, unknown>,
        result: result as unknown as Record<string, unknown>,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (user?.id && chargedDeepDaily) {
      await refundDeepGeneration(user.id);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o planejamento com IA.",
        },
      },
      { status: 500 },
    );
  }
}
