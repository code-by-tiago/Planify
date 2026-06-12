import { NextRequest, NextResponse } from "next/server";
import { isDeepGenerationType } from "@/lib/ai/material-generation-policy";
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
  bucketQualityScore,
  logGenerationComplete,
} from "@/server/telemetry/generation-telemetry";
import {
  logOperationalEvent,
  type OperationalEventType,
} from "@/server/telemetry/operational-telemetry";
import {
  jsonGenerationError,
  jsonGenerationValidationError,
  type GenerationErrorCode,
} from "./generation-api-contract";

export type GenerationApiUser = {
  id: string;
  email?: string | null;
};

export type GenerationChargeState = {
  chargedCost: number;
  chargedDeepDaily: boolean;
};

export type GenerationPreparedRequest<TPayload = unknown> =
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      user: GenerationApiUser | null;
      payload: TPayload;
      tipo: string;
      charge: GenerationChargeState;
    };

const DEFAULT_DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). Você ainda pode gerar flashcards e resumos, que não contam na cota.";

export type PrepareGenerationOptions<TPayload = unknown> = {
  skipDailyQuota?: boolean;
  skipCreditCharge?: boolean;
  creditCost?: number;
  dailyLimitMessage?: string;
  insufficientCreditsMessage?: string;
  parsePayload: (raw: unknown) => TPayload | null;
  resolveTipo: (payload: TPayload) => string;
};

export async function prepareGenerationRequest<TPayload>(
  request: NextRequest,
  options: PrepareGenerationOptions<TPayload>,
): Promise<GenerationPreparedRequest<TPayload>> {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return { ok: false, response: auth.response };

  const user = auth.access.user;
  const raw = await request.json().catch(() => null);
  const payload = options.parsePayload(raw);

  if (!payload) {
    return {
      ok: false,
      response: jsonGenerationValidationError("Requisição inválida."),
    };
  }

  const tipo = options.resolveTipo(payload);
  let chargedCost = 0;
  let chargedDeepDaily = false;

  if (user?.id && isDeepGenerationType(tipo) && !options.skipDailyQuota) {
    const daily = await consumeDeepGeneration({
      userId: user.id,
      tipo,
      email: user.email,
    });

    if (daily.status === "limit_reached") {
      const message = (options.dailyLimitMessage ?? DEFAULT_DAILY_LIMIT_MESSAGE).replace(
        "suas gerações profundas",
        `suas ${daily.limit} gerações profundas`,
      );

      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            code: "daily_limit_reached" satisfies GenerationErrorCode,
            message,
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

  if (user?.id && !options.skipCreditCharge) {
    const spend = await spendCredits(
      user.id,
      tipo,
      user.email,
      options.creditCost,
    );

    if (spend.status === "insufficient") {
      if (chargedDeepDaily) {
        await refundDeepGeneration(user.id);
      }

      return {
        ok: false,
        response: jsonGenerationError(
          "insufficient_credits",
          options.insufficientCreditsMessage ??
            "Você não tem créditos suficientes neste ciclo. Aguarde a renovação mensal ou fale com o suporte.",
          402,
          { meta: { balance: spend.balance, cost: spend.cost } },
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
    tipo,
    charge: { chargedCost, chargedDeepDaily },
  };
}

export async function refundGenerationCharges(
  userId: string | undefined,
  tipo: string,
  charge: GenerationChargeState,
): Promise<void> {
  if (!userId) return;
  if (charge.chargedDeepDaily) {
    await refundDeepGeneration(userId);
  }
  if (charge.chargedCost > 0) {
    await refundCredits(userId, charge.chargedCost, tipo);
  }
}

export function resolveGenerationCreditCost(
  charge: GenerationChargeState,
  tipo: string,
  fallbackCost?: number,
): number {
  return charge.chargedCost || fallbackCost || getCreditCost(tipo);
}

export function logGenerationSuccessEvent(options: {
  surface: "material" | "planning";
  tipo: string;
  pipeline: string;
  qualityScore?: number;
  elevarQualidade?: boolean;
  usedAI: boolean;
  dailyQuotaConsumed: boolean;
}): void {
  logGenerationComplete({
    surface: options.surface,
    tipo: options.tipo,
    pipeline: options.pipeline,
    qualityScoreBucket: bucketQualityScore(options.qualityScore),
    elevarQualidade: options.elevarQualidade === true,
    usedAI: options.usedAI,
    dailyQuotaConsumed: options.dailyQuotaConsumed,
  });
}

export function logGenerationFailureEvent(options: {
  eventType: OperationalEventType;
  toolTipo: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}): void {
  logOperationalEvent({
    eventType: options.eventType,
    toolTipo: options.toolTipo,
    ok: false,
    errorCode: options.errorCode,
    metadata: options.metadata,
  });
}

export async function finalizeGenerationFailure(
  userId: string | undefined,
  tipo: string,
  charge: GenerationChargeState,
  options?: {
    eventType?: OperationalEventType;
    errorCode?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await refundGenerationCharges(userId, tipo, charge);

  if (options?.eventType) {
    logGenerationFailureEvent({
      eventType: options.eventType,
      toolTipo: tipo,
      errorCode: options.errorCode,
      metadata: options.metadata,
    });
  }
}
