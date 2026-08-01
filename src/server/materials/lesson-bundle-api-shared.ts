import { NextRequest, NextResponse } from "next/server";
import {
  getLessonBundleCreditCost,
  LESSON_BUNDLE_GENERATION_TYPE,
  normalizeLessonBundleTools,
} from "@/lib/aula-completa/lesson-bundle-config";
import { isDeepGenerationType } from "@/lib/ai/material-generation-policy";
import {
  DISABLED_AI_TOOL_MESSAGE,
  isAiToolDisabled,
} from "@/lib/pro/disabled-ai-tools";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  consumeDeepGeneration,
  refundDeepGeneration,
} from "@/server/credits/daily-generation-service";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "@/server/credits/credit-service";
import {
  assertGenerationSlotAvailable,
  GenerationInflightError,
} from "@/server/generation/generation-inflight-guard";
import {
  extractIdempotencyKey,
  shouldSkipUsageQuotas,
} from "@/server/generation/usage-quota-policy";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";
import type { LessonBundleInput } from "@/server/materials/lesson-bundle-orchestrator";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialAIOutput } from "@/types/ai";

export type LessonBundleApiUser = {
  id: string;
  email?: string | null;
};

export type LessonBundleChargeState = {
  chargedCost: number;
  chargedDeepDaily: boolean;
};

export type LessonBundlePreparedRequest =
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      user: LessonBundleApiUser | null;
      payload: LessonBundleInput;
      toolIds: PlanifyToolId[];
      tipo: string;
      bundleCost: number;
      charge: LessonBundleChargeState;
    };

export async function prepareLessonBundleRequest(
  request: NextRequest,
  options?: { skipDailyQuota?: boolean },
): Promise<LessonBundlePreparedRequest> {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return { ok: false, response: auth.response };

  if (isAiToolDisabled(LESSON_BUNDLE_GENERATION_TYPE)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: DISABLED_AI_TOOL_MESSAGE },
        { status: 400 },
      ),
    };
  }

  const user = auth.access.user;
  const payload = (await request.json().catch(() => null)) as LessonBundleInput | null;

  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Requisição inválida." },
        { status: 400 },
      ),
    };
  }

  const { toolIds, invalidToolIds } = normalizeLessonBundleTools(payload.bundleTools);
  if (invalidToolIds.length) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: `Ferramenta(s) inválida(s) para Aula Completa: ${invalidToolIds.join(", ")}.`,
        },
        { status: 400 },
      ),
    };
  }

  payload.bundleTools = toolIds;

  const tipo = LESSON_BUNDLE_GENERATION_TYPE;
  const bundleCost = getLessonBundleCreditCost(toolIds);

  let chargedCost = 0;
  let chargedDeepDaily = false;

  if (user?.id) {
    try {
      await assertGenerationSlotAvailable({
        userId: user.id,
        idempotencyKey: extractIdempotencyKey(payload),
      });
    } catch (error) {
      if (error instanceof GenerationInflightError) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              ok: false,
              code: "generation_in_progress",
              message: error.message,
              retryable: false,
            },
            { status: error.status },
          ),
        };
      }
      throw error;
    }
  }

  const skipQuotas = user?.id
    ? await shouldSkipUsageQuotas({ userId: user.id, email: user.email })
    : true;

  if (
    !skipQuotas &&
    user?.id &&
    isDeepGenerationType(tipo) &&
    !options?.skipDailyQuota
  ) {
    const daily = await consumeDeepGeneration({
      userId: user.id,
      tipo,
      email: user.email,
    });

    if (daily.status === "limit_reached") {
      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            code: "daily_limit_reached",
            message:
              `Você usou suas ${daily.limit} gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). O pacote Aula Completa conta como uma geração profunda.`,
            used: daily.used,
            limit: daily.limit,
          },
          { status: 429 },
        ),
      };
    }

    if (daily.status === "ok") {
      chargedDeepDaily = true;
    }
  }

  if (!skipQuotas && user?.id) {
    const spend = await spendCredits(user.id, tipo, user.email, bundleCost);

    if (spend.status === "insufficient") {
      if (chargedDeepDaily) {
        await refundDeepGeneration(user.id);
      }

      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            code: "insufficient_credits",
            message:
              "Você não tem créditos suficientes para gerar este pacote. Faça upgrade do plano para continuar.",
            balance: spend.balance,
            cost: spend.cost,
          },
          { status: 402 },
        ),
      };
    }

    if (spend.status === "ok") {
      chargedCost = spend.cost;
    }
  }

  return {
    ok: true,
    user: user?.id ? { id: user.id, email: user.email } : null,
    payload,
    toolIds,
    tipo,
    bundleCost,
    charge: { chargedCost, chargedDeepDaily },
  };
}

export async function refundLessonBundleCharges(
  userId: string | undefined,
  tipo: string,
  charge: LessonBundleChargeState,
): Promise<void> {
  if (!userId) return;
  if (charge.chargedDeepDaily) {
    await refundDeepGeneration(userId);
  }
  if (charge.chargedCost > 0) {
    await refundCredits(userId, charge.chargedCost, tipo);
  }
}

export function createLessonBundlePersistItem(
  user: LessonBundleApiUser | null,
  payload: LessonBundleInput,
) {
  if (!user?.id) return undefined;

  return async ({
    toolId,
    html,
    estrutura,
    pipeline,
    qualityScore,
  }: {
    toolId: PlanifyToolId;
    html: string;
    estrutura: MaterialAIOutput;
    pipeline: string;
    qualityScore?: number;
  }) =>
    persistGeneratedMaterialBestEffort({
      userId: user.id,
      surface: "material",
      tipo: toolId,
      classId: payload.classId || null,
      className: payload.className?.trim() || payload.turma?.trim() || null,
      discipline:
        payload.discipline?.trim() ||
        payload.disciplina?.trim() ||
        payload.componenteCurricular?.trim() ||
        payload.componente?.trim() ||
        null,
      contentHtml: html,
      pipeline,
      qualityScore: qualityScore ?? null,
      payload: {
        ...payload,
        tipoMaterial: toolId,
        bundleParent: LESSON_BUNDLE_GENERATION_TYPE,
      } as Record<string, unknown>,
      result: { html, estrutura, pipeline, qualityScore },
    });
}

export function resolveLessonBundleCreditCost(
  charge: LessonBundleChargeState,
  bundleCost: number,
  tipo: string,
): number {
  void charge;
  void bundleCost;
  void tipo;
  return 0;
}
