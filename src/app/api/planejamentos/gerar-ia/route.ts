import { NextRequest, NextResponse } from "next/server";
import { PLANNING_DEEP_GENERATION_TYPE } from "@/lib/ai/material-generation-policy";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  consumeDeepGeneration,
  refundDeepGeneration,
} from "../../../../server/credits/daily-generation-service";
import { generatePlanningWithAI } from "../../../../server/planejamentos/planning-ai-service";
import { validatePlanningPayload } from "../../../../server/planejamentos/planning-validation";
import type { PlanningAiPayload } from "../../../../server/planejamentos/planning-ai-service";
import { persistGeneratedMaterialBestEffort } from "../../../../server/materials/persist-generated-material";
import {
  finalizeGenerationFailure,
  logGenerationSuccessEvent,
} from "@/server/generation/generation-api-shared";
import { jsonPlanningError } from "@/server/generation/generation-api-contract";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia — ou gere flashcards e resumos, que não contam na cota.";

async function handlePost(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  const tipo = PLANNING_DEEP_GENERATION_TYPE;
  let chargedDeepDaily = false;

  if (user?.id && process.env.GEMINI_API_KEY) {
    const daily = await consumeDeepGeneration({
      userId: user.id,
      tipo,
      email: user.email,
    });

    if (daily.status === "limit_reached") {
      return jsonPlanningError(
        DAILY_LIMIT_MESSAGE.replace(
          "suas gerações profundas",
          `suas ${daily.limit} gerações profundas`,
        ),
        429,
        "daily_limit_reached",
        { used: daily.used, limit: daily.limit },
      );
    }

    if (daily.status === "ok") {
      chargedDeepDaily = true;
    }
  }

  const charge = { chargedCost: 0, chargedDeepDaily };

  try {
    const payload = (await request.json().catch(() => null)) as PlanningAiPayload | null;

    if (!payload || typeof payload !== "object") {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "planning_generation_failed",
        errorCode: "validation_error",
      });

      return jsonPlanningError("Corpo da requisição inválido.", 400);
    }

    const validationError = validatePlanningPayload(payload);

    if (validationError) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "planning_generation_failed",
        errorCode: "validation_error",
      });

      return jsonPlanningError(validationError, 400);
    }

    const result = await generatePlanningWithAI(payload);

    const dailyQuotaConsumed = chargedDeepDaily && result.usedAI;

    logGenerationSuccessEvent({
      surface: "planning",
      tipo: String(payload.tipoPlanejamento || tipo),
      pipeline: result.usedAI ? "planning-ai" : "planning-fallback",
      qualityScore: result.qualityScore,
      elevarQualidade: payload.elevarQualidade === true,
      usedAI: result.usedAI,
      dailyQuotaConsumed,
    });

    if (!result.usedAI && user?.id && chargedDeepDaily) {
      await refundDeepGeneration(user.id);
    }

    let materialId: string | null = null;
    if (user?.id && result.success) {
      materialId = await persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "planning",
        tipo: String(payload.tipoPlanejamento || tipo),
        classId: payload.classId || null,
        className: payload.className?.trim() || payload.turma?.trim() || null,
        discipline:
          payload.discipline?.trim() ||
          payload.disciplina?.trim() ||
          payload.componenteCurricular?.trim() ||
          null,
        pipeline: result.usedAI ? "planning-ai" : "planning-fallback",
        qualityScore:
          typeof result.qualityScore === "number" ? result.qualityScore : null,
        payload: payload as Record<string, unknown>,
        result: result as unknown as Record<string, unknown>,
      });
    }

    const persistWarning =
      user?.id && result.success && !materialId
        ? "O planejamento foi gerado, mas não foi possível registrá-lo no Progresso BNCC. Tente gerar novamente em instantes."
        : null;

    const resultRecord = result as Record<string, unknown>;
    const existingAlertas = Array.isArray(resultRecord.alertas)
      ? resultRecord.alertas.map((item) => String(item)).filter(Boolean)
      : [];

    return NextResponse.json({
      ...result,
      materialId,
      persistWarning,
      alertas: persistWarning
        ? [...existingAlertas, persistWarning]
        : existingAlertas,
    });
  } catch (error) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "planning_generation_failed",
      errorCode: "exception",
      metadata: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    return jsonPlanningError(
      error instanceof Error
        ? error.message
        : "Não foi possível gerar o planejamento com IA.",
      500,
      "server_error",
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "planning_generation_failed", toolTipo: "planning" },
  handlePost,
);
