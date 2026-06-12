import { syncCreditWalletFromSubscription } from "../credits/credit-subscription-sync";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const LINKABLE_STATUSES = ["active", "trialing", "past_due"];

/**
 * Vincula assinaturas Stripe salvas só pelo e-mail (pagamento antes do cadastro)
 * ao user_id da conta recém-criada ou do login.
 */
export async function linkPendingSubscriptionsToUser(params: {
  userId: string;
  email: string;
}): Promise<{ linkedCount: number }> {
  const normalizedEmail = params.email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { linkedCount: 0 };
  }

  const supabase = getSupabaseAdminClient();

  const { data: rows, error } = await (supabase as any)
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_email", normalizedEmail)
    .is("user_id", null)
    .in("status", LINKABLE_STATUSES);

  if (error || !rows?.length) {
    return { linkedCount: 0 };
  }

  let linkedCount = 0;

  for (const row of rows as Array<{ id: string }>) {
    const { error: updateError } = await (supabase as any)
      .from("subscriptions")
      .update({
        user_id: params.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .is("user_id", null);

    if (!updateError) {
      linkedCount += 1;
    }
  }

  if (linkedCount > 0) {
    await syncCreditWalletFromSubscription({
      userId: params.userId,
      email: normalizedEmail,
    });
  }

  return { linkedCount };
}
