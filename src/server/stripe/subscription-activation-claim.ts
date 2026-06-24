import { getSupabaseAdminClient } from "../supabase/admin-client";

export async function claimSubscriptionActivationEmail(params: {
  email: string;
  checkoutSessionId?: string | null;
}): Promise<{ claimed: true } | { claimed: false; reason: "already_claimed" }> {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();
  const checkoutSessionId = params.checkoutSessionId?.trim() || null;

  const { data, error } = await (admin as any)
    .from("subscription_activation_claims")
    .insert({
      email: normalizedEmail,
      checkout_session_id: checkoutSessionId,
    })
    .select("email")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { claimed: false, reason: "already_claimed" };
    }

    throw error;
  }

  if (!data) {
    return { claimed: false, reason: "already_claimed" };
  }

  return { claimed: true };
}

export async function releaseSubscriptionActivationClaim(
  email: string,
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  await (admin as any)
    .from("subscription_activation_claims")
    .delete()
    .eq("email", normalizedEmail)
    .is("user_id", null);
}

export async function completeSubscriptionActivationClaim(params: {
  email: string;
  userId: string;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  await (admin as any)
    .from("subscription_activation_claims")
    .update({ user_id: params.userId })
    .eq("email", normalizedEmail);
}
