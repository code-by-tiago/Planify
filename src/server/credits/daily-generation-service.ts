import {
  getDailyDeepGenerationLimit,
  isDeepGenerationType,
  nextBrazilMidnightIso,
} from "@/lib/ai/material-generation-policy";
import { isOwnerEmail } from "../auth/owner-emails";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getCreditWallet } from "./credit-service";

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

export async function getDailyGenerationStatus(params: {
  userId: string;
  tipo?: string;
  email?: string | null;
  planKey?: string | null;
}): Promise<DailyGenerationStatus> {
  const tipo = String(params.tipo || "");
  const appliesToType = isDeepGenerationType(tipo);
  const limit = getDailyDeepGenerationLimit(params.planKey);

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

  const wallet = await getCreditWallet(params.userId);
  const limit = getDailyDeepGenerationLimit(wallet?.planKey);

  try {
    const { data, error } = await db().rpc("planify_consume_deep_generation", {
      p_user: params.userId,
      p_daily_limit: limit,
    });

    if (error) return { status: "skipped" };

    const used = Number(data);
    if (used < 0) {
      const status = await getDailyGenerationStatus({
        userId: params.userId,
        tipo: params.tipo,
        planKey: wallet?.planKey,
      });
      return {
        status: "limit_reached",
        used: status.used,
        limit: status.limit,
      };
    }

    return { status: "ok", used, limit };
  } catch {
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
