import { getBillingPlan, normalizeBillingPlanKey } from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { grantPlanCredits } from "../credits/credit-service";

/** Mesma chave e cotas do Professor Pro mensal (Stripe) — sem Premium/ilimitado. */
const SCHOOL_INVITE_PRO_PLAN_KEY = "monthly";

async function userAlreadyHasPaidAccess(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const profilePlan = normalizeBillingPlanKey(
    (profile as { plan?: string | null } | null)?.plan,
  );
  if (profilePlan && getBillingPlan(profilePlan)) {
    return true;
  }

  type SubscriptionLookup = {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          in: (
            col: string,
            vals: string[],
          ) => {
            order: (
              col: string,
              opts: { ascending: boolean; nullsFirst: boolean },
            ) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: unknown }>;
              };
            };
          };
        };
      };
    };
  };

  const { data: subscription } = await (supabase as unknown as SubscriptionLookup)
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const row = subscription as {
    status?: string | null;
    current_period_end?: string | null;
  } | null;

  if (!row?.status || !["active", "trialing"].includes(row.status)) {
    return false;
  }

  if (!row.current_period_end) {
    return true;
  }

  return new Date(row.current_period_end).getTime() > Date.now();
}

/**
 * Concede Pro via convite escolar quando o usuário ainda não tem plano pago.
 * Créditos e cota diária profunda seguem o plano `monthly` (350/ciclo, 3/dia).
 */
export async function grantSchoolProPlan(userId: string): Promise<boolean> {
  if (await userAlreadyHasPaidAccess(userId)) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const profileUpdate = {
    plan: SCHOOL_INVITE_PRO_PLAN_KEY,
    status: "active" as const,
  };

  const { error } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Não foi possível ativar o plano Pro.");
  }

  await grantPlanCredits({
    userId,
    planKey: SCHOOL_INVITE_PRO_PLAN_KEY,
  });

  return true;
}
