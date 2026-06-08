/**
 * Serviço de créditos do Planify.
 *
 * Princípios:
 * - Custo ponderado por tipo de material (materiais "pesados" custam mais).
 * - Concessão por ciclo de assinatura (Stripe) — reseta o saldo ao total do plano.
 * - Débito atômico via RPC `planify_spend_credits`.
 * - FALHA ABERTA apenas para usuários sem plano de cobrança (free / pré-migração).
 *   Quem tem assinatura Stripe ou `profiles.plan` (ex.: Pro via convite escolar)
 *   deve ter carteira provisionada; sem carteira após sync, a geração é bloqueada.
 */

import { getBillingPlan } from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { MaterialEngineType } from "../materials/material-engine-types";
import { hasUnlimitedQuota } from "../auth/courtesy-emails";
import {
  resolveUserBillingPlanKey,
  syncCreditWalletFromSubscription,
} from "./credit-subscription-sync";

/**
 * O client admin é tipado a partir do schema gerado, que ainda não inclui as
 * funções/tabela de créditos. Usamos um acesso solto e tipado o suficiente para
 * as chamadas que fazemos, sem recorrer a `any`.
 */
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

/**
 * Custo em créditos por tipo de material.
 * Materiais profundos (Gemini Pro) custam mais — alinhado ao custo de API.
 */
const CREDIT_COST: Partial<Record<MaterialEngineType, number>> & Record<string, number> = {
  prova: 10,
  apostila: 10,
  slides: 10,
  "plano-aula": 10,
  redacao: 10,
  lista: 6,
  sequencia: 6,
  projeto: 6,
  atividade: 3,
  resumo: 1,
  flashcards: 1,
  "mapa-mental": 1,
  jogo: 1,
  inclusao: 6,
};

export function getCreditCost(tipo: string): number {
  return CREDIT_COST[tipo as MaterialEngineType] ?? 1;
}

type SpendResult =
  | { status: "ok"; balance: number; cost: number }
  | { status: "insufficient"; balance: number; cost: number }
  | { status: "skipped" };

export async function getCreditWallet(
  userId: string,
): Promise<CreditWallet | null> {
  try {
    const { data, error } = await db()
      .from("credit_wallets")
      .select("balance, monthly_limit, plan_key, cycle_started_at, cycle_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

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

/**
 * Tenta debitar `cost` créditos. Falha aberta (status "skipped") quando não há
 * carteira ou ocorre erro de infraestrutura, para não bloquear a geração antes
 * de o sistema de créditos estar provisionado.
 */
export async function spendCredits(
  userId: string,
  tipo: string,
  email?: string | null,
): Promise<SpendResult> {
  const cost = getCreditCost(tipo);

  await syncCreditWalletFromSubscription({ userId, email });

  const wallet = await getCreditWallet(userId);
  const billedPlanKey = await resolveUserBillingPlanKey({ userId, email });
  if (hasUnlimitedQuota(email)) {
    return { status: "skipped" };
  }

  const mustEnforceCredits = Boolean(billedPlanKey);

  if (!wallet) {
    if (mustEnforceCredits) {
      return { status: "insufficient", balance: 0, cost };
    }
    return { status: "skipped" };
  }

  try {
    const { data, error } = await db().rpc("planify_spend_credits", {
      p_user: userId,
      p_cost: cost,
      p_tipo: tipo,
    });

    if (error) {
      if (mustEnforceCredits) {
        return { status: "insufficient", balance: wallet.balance, cost };
      }
      return { status: "skipped" };
    }

    const newBalance = Number(data);

    if (newBalance < 0) {
      return { status: "insufficient", balance: wallet.balance, cost };
    }

    return { status: "ok", balance: newBalance, cost };
  } catch {
    return { status: "skipped" };
  }
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
 * Concede/renova os créditos do ciclo conforme o plano. Usado pelo webhook do
 * Stripe quando uma assinatura fica ativa ou é renovada.
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
    return !error;
  } catch {
    return false;
  }
}
