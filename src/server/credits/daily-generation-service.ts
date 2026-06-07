/**
 * Cota diária de gerações profundas (Gemini Pro).
 *
 * Contrato Supabase (aplicar antes de produção):
 * `supabase/migrations/20260606_daily_deep_generations.sql`
 * - Tabela: daily_deep_generations (user_id, usage_date, count)
 * - RPCs: planify_get_deep_generation_usage(p_user)
 *          planify_consume_deep_generation(p_user, p_daily_limit) → -1 se limite
 *          planify_refund_deep_generation(p_user)
 * - Data: planify_brazil_today() em America/Sao_Paulo
 */
import {
  getDailyDeepGenerationLimit,
  isDeepGenerationType,
  nextBrazilMidnightIso,
} from "@/lib/ai/material-generation-policy";
import { isOwnerEmail } from "../auth/owner-emails";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getCreditWallet } from "./credit-service";
import { resolveUserBillingPlanKey } from "./credit-subscription-sync";

type DbResult = { data: unknown; error: unknown };
type SupabaseLoose = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<DbResult>;
};

function db(): SupabaseLoose {
  return getSupabaseAdminClient() as unknown as SupabaseLoose;
}

export type DailyGenerationStatus = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  appliesToType: boolean;
};

type ConsumeResult =
  | { status: "ok"; used: number; limit: number }
  | { status: "limit_reached"; used: number; limit: number }
  | { status: "skipped" };

async function resolveDeepGenerationPlanKey(params: {
  userId: string;
  email?: string | null;
  planKey?: string | null;
}): Promise<string | null> {
  if (params.planKey) {
    return params.planKey;
  }

  const wallet = await getCreditWallet(params.userId);
  if (wallet?.planKey) {
    return wallet.planKey;
  }

  return resolveUserBillingPlanKey({
    userId: params.userId,
    email: params.email,
  });
}

export async function getDailyGenerationStatus(params: {
  userId: string;
  tipo?: string;
  email?: string | null;
  planKey?: string | null;
}): Promise<DailyGenerationStatus> {
  const tipo = String(params.tipo || "");
  const appliesToType = isDeepGenerationType(tipo);
  const resolvedPlanKey = await resolveDeepGenerationPlanKey({
    userId: params.userId,
    email: params.email,
    planKey: params.planKey,
  });
  const limit = getDailyDeepGenerationLimit(resolvedPlanKey);

  if (isOwnerEmail(params.email)) {
    return {
      used: 0,
      limit,
      remaining: limit,
      resetsAt: nextBrazilMidnightIso(),
      appliesToType,
    };
  }

  try {
    const { data, error } = await db().rpc("planify_get_deep_generation_usage", {
      p_user: params.userId,
    });

    if (error) {
      return {
        used: 0,
        limit,
        remaining: limit,
        resetsAt: nextBrazilMidnightIso(),
        appliesToType,
      };
    }

    const used = Math.max(0, Number(data ?? 0));
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsAt: nextBrazilMidnightIso(),
      appliesToType,
    };
  } catch {
    return {
      used: 0,
      limit,
      remaining: limit,
      resetsAt: nextBrazilMidnightIso(),
      appliesToType,
    };
  }
}

export async function consumeDeepGeneration(params: {
  userId: string;
  tipo: string;
  email?: string | null;
}): Promise<ConsumeResult> {
  if (!isDeepGenerationType(params.tipo)) {
    return { status: "skipped" };
  }

  if (isOwnerEmail(params.email)) {
    return { status: "skipped" };
  }

  const resolvedPlanKey = await resolveDeepGenerationPlanKey({
    userId: params.userId,
    email: params.email,
  });
  const limit = getDailyDeepGenerationLimit(resolvedPlanKey);
  const mustEnforceDaily =
    Boolean(resolvedPlanKey) && !isOwnerEmail(params.email);

  try {
    const { data, error } = await db().rpc("planify_consume_deep_generation", {
      p_user: params.userId,
      p_daily_limit: limit,
    });

    if (error) {
      if (mustEnforceDaily) {
        const status = await getDailyGenerationStatus({
          userId: params.userId,
          tipo: params.tipo,
          planKey: resolvedPlanKey,
        });
        return {
          status: "limit_reached",
          used: status.used,
          limit: status.limit,
        };
      }
      return { status: "skipped" };
    }

    const used = Number(data);
    if (used < 0) {
      const status = await getDailyGenerationStatus({
        userId: params.userId,
        tipo: params.tipo,
        planKey: resolvedPlanKey,
      });
      return {
        status: "limit_reached",
        used: status.used,
        limit: status.limit,
      };
    }

    return { status: "ok", used, limit };
  } catch {
    if (mustEnforceDaily) {
      return { status: "limit_reached", used: limit, limit };
    }
    return { status: "skipped" };
  }
}

export async function refundDeepGeneration(userId: string): Promise<void> {
  try {
    await db().rpc("planify_refund_deep_generation", { p_user: userId });
  } catch {
    // best-effort
  }
}
