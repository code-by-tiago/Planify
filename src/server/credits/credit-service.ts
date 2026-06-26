/**
 * Servico de carteira legado do Planify.
 *
 * A regra de produto atual e uso ilimitado para assinantes nas ferramentas
 * ativas. As funcoes continuam existindo para compatibilidade com webhook,
 * admin e tabelas antigas, mas geracao nao aplica limites de uso.
 */

import { getBillingPlan } from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type DbResult = { data: unknown; error: unknown };
type SupabaseLoose = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<DbResult>;
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => { maybeSingle: () => Promise<DbResult> };
    };
  };
};

function db(): SupabaseLoose {
  return getSupabaseAdminClient() as unknown as SupabaseLoose;
}

export type CreditWallet = {
  balance: number;
  monthlyLimit: number;
  planKey: string | null;
  cycleStartsAt: string | null;
  cycleEndsAt: string | null;
};

export function getCreditCost(tipo: string): number {
  void tipo;
  return 0;
}

type SpendResult =
  | { status: "ok"; balance: number; cost: number }
  | { status: "insufficient"; balance: number; cost: number }
  | { status: "skipped" };

async function readCreditWalletRow(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const full = await db()
    .from("credit_wallets")
    .select("balance, monthly_limit, plan_key, cycle_started_at, cycle_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error && full.data) {
    return full.data as Record<string, unknown>;
  }

  const legacy = await db()
    .from("credit_wallets")
    .select("balance, monthly_limit, cycle_started_at, cycle_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (legacy.error || !legacy.data) {
    return null;
  }

  return legacy.data as Record<string, unknown>;
}

export async function getCreditWallet(
  userId: string,
): Promise<CreditWallet | null> {
  try {
    const data = await readCreditWalletRow(userId);
    if (!data) return null;

    const row = data as {
      balance?: number;
      monthly_limit?: number;
      plan_key?: string | null;
      cycle_started_at?: string | null;
      cycle_ends_at?: string | null;
    };

    return {
      balance: Number(row.balance ?? 0),
      monthlyLimit: Number(row.monthly_limit ?? 0),
      planKey: row.plan_key ?? null,
      cycleStartsAt: row.cycle_started_at ?? null,
      cycleEndsAt: row.cycle_ends_at ?? null,
    };
  } catch {
    return null;
  }
}

/** Politica atual ilimitada: nao debita creditos. */
export async function spendCredits(
  userId: string,
  tipo: string,
  email?: string | null,
  costOverride?: number,
): Promise<SpendResult> {
  void userId;
  void tipo;
  void email;
  void costOverride;
  return { status: "skipped" };
}

export async function refundCredits(
  userId: string,
  amount: number,
  tipo: string,
): Promise<void> {
  if (amount <= 0) return;
  try {
    await db().rpc("planify_refund_credits", {
      p_user: userId,
      p_amount: amount,
      p_tipo: tipo,
    });
  } catch {
    // best-effort
  }
}

/**
 * Mantem carteiras sincronizadas para telas/admin legado. A concessao nao
 * limita o uso das ferramentas ativas.
 */
export async function grantPlanCredits(params: {
  userId: string;
  planKey: string | null;
  cycleStart?: string | null;
  cycleEnd?: string | null;
}): Promise<boolean> {
  const plan = getBillingPlan(params.planKey);
  if (!plan) return false;

  try {
    const { error } = await db().rpc("planify_grant_credits", {
      p_user: params.userId,
      p_plan_key: plan.key,
      p_credits: plan.creditsPerCycle,
      p_cycle_start: params.cycleStart ?? null,
      p_cycle_end: params.cycleEnd ?? null,
    });
    if (error) {
      console.error("planify:grant-credits-failed", {
        userId: params.userId,
        planKey: plan.key,
        message:
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String((error as { message?: unknown }).message)
            : "unknown",
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("planify:grant-credits-exception", {
      userId: params.userId,
      planKey: plan.key,
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}
