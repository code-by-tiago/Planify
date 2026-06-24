import { NextRequest, NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/server/auth/find-user-by-email";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { syncSubscriptionsForEmailFromStripe } from "@/server/stripe/webhook-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing"];

async function hasActiveSubscription(email: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  const { data } = await (supabase as any)
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_email", email)
    .in("status", ACTIVE_STATUSES)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const shouldSync = request.nextUrl.searchParams.get("sync") === "1";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { success: false, error: { message: "E-mail inválido." } },
      { status: 400 },
    );
  }

  try {
    if (shouldSync) {
      await syncSubscriptionsForEmailFromStripe(email);
    }

    const user = await findAuthUserByEmail(email);
    const hasAccount = Boolean(user);
    const emailConfirmed = Boolean(user?.email_confirmed_at);
    let hasActiveSubscriptionFlag = await hasActiveSubscription(email);

    if (!hasActiveSubscriptionFlag && !shouldSync) {
      await syncSubscriptionsForEmailFromStripe(email);
      hasActiveSubscriptionFlag = await hasActiveSubscription(email);
    }

    return NextResponse.json({
      success: true,
      data: {
        hasAccount,
        emailConfirmed,
        hasActiveSubscription: hasActiveSubscriptionFlag,
        readyToActivate: hasActiveSubscriptionFlag && !hasAccount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível verificar a conta.",
        },
      },
      { status: 500 },
    );
  }
}
