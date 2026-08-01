import {
  getBillingPlan,
  normalizeBillingPlanKey,
  resolvePlanKeyFromPriceId,
} from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getCreditWallet, grantPlanCredits } from "./credit-service";

type SubscriptionRow = {
  id: string;
  status: string | null;
  plan_id?: string | null;
  plan_key?: string | null;
  price_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function resolveSubscriptionPlanKey(
  subscription: SubscriptionRow,
): string | null {
  return (
    normalizeBillingPlanKey(subscription.plan_key) ||
    normalizeBillingPlanKey(subscription.plan_id) ||
    resolvePlanKeyFromPriceId(subscription.price_id) ||
    null
  );
}

async function querySubscription(
  column: string,
  value: string,
): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAdminClient();
  const select =
    "id,status,plan_id,plan_key,price_id,current_period_start,current_period_end,updated_at";

  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select(select)
    .eq(column, value)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as SubscriptionRow;
  return ACTIVE_STATUSES.has(row.status || "") ? row : null;
}

async function findActiveSubscription(
  userId: string,
  email: string | null,
): Promise<SubscriptionRow | null> {
  const byUser = await querySubscription("user_id", userId);
  if (byUser) {
    return byUser;
  }

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  return querySubscription("stripe_customer_email", normalizedEmail);
}

export async function resolveUserBillingPlanKey(params: {
  userId: string;
  email?: string | null;
}): Promise<string | null> {
  const subscription = await findActiveSubscription(
    params.userId,
    params.email ?? null,
  );

  if (subscription) {
    return resolveSubscriptionPlanKey(subscription);
  }

  return getProfilePlan(params.userId);
}

async function getProfilePlan(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = (data as { plan?: string | null } | null)?.plan;
  const normalized = normalizeBillingPlanKey(plan);
  return normalized && getBillingPlan(normalized) ? normalized : null;
}

async function maybeGrant(params: {
  userId: string;
  planKey: string;
  cycleStart?: string | null;
  cycleEnd?: string | null;
}): Promise<boolean> {
  const wallet = await getCreditWallet(params.userId);

  if (wallet && wallet.balance > 0) {
    return true;
  }

  return grantPlanCredits({
    userId: params.userId,
    planKey: params.planKey,
    cycleStart: params.cycleStart ?? null,
    cycleEnd: params.cycleEnd ?? null,
  });
}

/**
 * Garante carteira legada para assinantes ativos. Evita inconsistencias
 * pos-migracao quando a tabela existe mas o webhook ainda nao sincronizou o ciclo.
 */
export async function syncCreditWalletFromSubscription(params: {
  userId: string;
  email?: string | null;
}): Promise<boolean> {
  const subscription = await findActiveSubscription(
    params.userId,
    params.email ?? null,
  );

  if (subscription) {
    const planKey = resolveSubscriptionPlanKey(subscription);
    if (!planKey) {
      return false;
    }

    return maybeGrant({
      userId: params.userId,
      planKey,
      cycleStart: subscription.current_period_start ?? null,
      cycleEnd: subscription.current_period_end ?? null,
    });
  }

  const profilePlan = await getProfilePlan(params.userId);
  if (!profilePlan) {
    return false;
  }

  return maybeGrant({
    userId: params.userId,
    planKey: profilePlan,
  });
}
