import { NextRequest, NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/server/auth/find-user-by-email";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { syncSubscriptionsForEmailFromStripe } from "@/server/stripe/webhook-service";
import { validateCheckoutSessionForEmail } from "@/server/stripe/checkout-session-lookup";
import {
  consumePublicApiRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/server/public/public-api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing"];
const RATE_LIMIT = { maxRequests: 40, windowMs: 15 * 60 * 1000 };
const RECOVERY_RATE_LIMIT = { maxRequests: 8, windowMs: 15 * 60 * 1000 };

export type CheckoutAccountStatus =
  | "needs_proof"
  | "ready_to_activate"
  | "account_exists"
  | "subscription_pending";

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

function buildStatusResponse(status: CheckoutAccountStatus) {
  const hasAccount = status === "account_exists";
  const hasActiveSubscription =
    status === "ready_to_activate" || status === "account_exists";

  return NextResponse.json({
    success: true,
    data: {
      status,
      hasAccount,
      hasActiveSubscription,
      emailConfirmed: hasAccount,
      readyToActivate: status === "ready_to_activate",
    },
  });
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const sessionId =
    request.nextUrl.searchParams.get("session_id")?.trim() ||
    request.nextUrl.searchParams.get("sessionId")?.trim() ||
    undefined;
  const shouldSync = request.nextUrl.searchParams.get("sync") === "1";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { success: false, error: { message: "E-mail inválido." } },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(request);
  const rateState = consumePublicApiRateLimit(
    sessionId ? "checkout-account-status" : "checkout-account-status-recovery",
    clientIp,
    sessionId ? RATE_LIMIT : RECOVERY_RATE_LIMIT,
  );

  if (rateState.limited) {
    return rateLimitResponse(rateState.retryAfterMs);
  }

  try {
    if (!sessionId) {
      return buildStatusResponse("needs_proof");
    }

    const proof = await validateCheckoutSessionForEmail({
      sessionId,
      email,
    });

    if (!proof.ok) {
      return buildStatusResponse("needs_proof");
    }

    if (shouldSync) {
      await syncSubscriptionsForEmailFromStripe(email);
    }

    const user = await findAuthUserByEmail(email);
    if (user) {
      return buildStatusResponse("account_exists");
    }

    const hasSubscription = await hasActiveSubscription(email);
    if (hasSubscription) {
      return buildStatusResponse("ready_to_activate");
    }

    return buildStatusResponse("subscription_pending");
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
