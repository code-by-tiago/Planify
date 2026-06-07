import type { TablesUpdate } from "@/types/database";
import { getBillingPlan, normalizeBillingPlanKey } from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { grantPlanCredits } from "../credits/credit-service";
import { createSchoolMember } from "./school-service";

const SCHOOL_INVITE_PRO_PLAN_KEY = "monthly";

export type AcceptPendingSchoolInvitesResult = {
  acceptedCount: number;
  schoolIds: string[];
  proGranted: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

async function grantSchoolProPlan(userId: string): Promise<boolean> {
  if (await userAlreadyHasPaidAccess(userId)) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const profileUpdate = {
    plan: "pro",
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

/**
 * Vincula convites pendentes ao usuário autenticado (login ou cadastro).
 * Cria membership na escola, marca convite como aceito e concede Pro quando aplicável.
 */
export async function acceptPendingSchoolInvites(
  userId: string,
  email: string,
): Promise<AcceptPendingSchoolInvitesResult> {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes("@")) {
    return { acceptedCount: 0, schoolIds: [], proGranted: false };
  }

  const supabase = getSupabaseAdminClient();
  const { data: invites, error } = await supabase
    .from("school_invites")
    .select("id,school_id")
    .eq("status", "pending")
    .ilike("email", normalized);

  if (error) {
    throw new Error(error.message || "Não foi possível consultar convites pendentes.");
  }

  const rows = (invites || []) as Array<{ id: string; school_id: string }>;

  if (rows.length === 0) {
    return { acceptedCount: 0, schoolIds: [], proGranted: false };
  }

  const schoolIds: string[] = [];

  for (const invite of rows) {
    await createSchoolMember(invite.school_id, {
      userId,
      role: "teacher",
      status: "active",
    });

    const inviteUpdate: TablesUpdate<"school_invites"> = {
      status: "accepted",
      accepted_user_id: userId,
    };

    const { error: updateError } = await supabase
      .from("school_invites")
      .update(inviteUpdate)
      .eq("id", invite.id);

    if (updateError) {
      throw new Error(updateError.message || "Não foi possível aceitar o convite.");
    }

    schoolIds.push(invite.school_id);
  }

  const proGranted = await grantSchoolProPlan(userId);

  return {
    acceptedCount: rows.length,
    schoolIds,
    proGranted,
  };
}
