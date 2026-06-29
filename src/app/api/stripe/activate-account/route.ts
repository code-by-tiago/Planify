import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findAuthUserByEmail } from "../../../../server/auth/find-user-by-email";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";
import { linkPendingSubscriptionsToUser } from "../../../../server/stripe/link-subscription-to-user";
import {
  syncCheckoutSessionToDatabase,
  syncSubscriptionsForEmailFromStripe,
} from "../../../../server/stripe/webhook-service";
import {
  validateCheckoutSessionForEmail,
} from "../../../../server/stripe/checkout-session-lookup";
import {
  claimSubscriptionActivationEmail,
  completeSubscriptionActivationClaim,
  releaseSubscriptionActivationClaim,
} from "../../../../server/stripe/subscription-activation-claim";
import {
  consumePublicApiRateLimit,
  getClientIp,
  rateLimitResponse,
} from "../../../../server/public/public-api-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing"];
const RATE_LIMIT = { maxRequests: 12, windowMs: 15 * 60 * 1000 };

const activateAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  sessionId: z.string().optional(),
});

async function hasActiveSubscription(email: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await (admin as any)
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_email", normalizedEmail)
    .in("status", ACTIVE_STATUSES)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function resolvePaidSubscription(
  email: string,
  sessionId?: string,
): Promise<{ ok: true } | { ok: false; reason: "no_subscription" | "email_mismatch" | "invalid_session" }> {
  if (sessionId) {
    const proof = await validateCheckoutSessionForEmail({
      sessionId,
      email,
    });

    if (!proof.ok) {
      if (proof.reason === "email_mismatch") {
        return { ok: false, reason: "email_mismatch" };
      }

      return { ok: false, reason: "invalid_session" };
    }

    await syncCheckoutSessionToDatabase(sessionId);
  }

  if (await hasActiveSubscription(email)) {
    return { ok: true };
  }

  if (sessionId) {
    await syncCheckoutSessionToDatabase(sessionId);
  } else {
    await syncSubscriptionsForEmailFromStripe(email);
  }

  const maxAttempts = sessionId ? 8 : 4;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await hasActiveSubscription(email)) {
      return { ok: true };
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return { ok: false, reason: "no_subscription" };
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateState = consumePublicApiRateLimit(
    "stripe-activate-account",
    clientIp,
    RATE_LIMIT,
  );

  if (rateState.limited) {
    return rateLimitResponse(rateState.retryAfterMs);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Corpo da requisição inválido." },
      },
      { status: 400 },
    );
  }

  const parsed = activateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: parsed.error.issues[0]?.message || "Dados inválidos.",
        },
      },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const sessionId = parsed.data.sessionId?.trim() || undefined;
  let claimHeld = false;

  try {
    const existingUser = await findAuthUserByEmail(email);

    if (existingUser) {
      try {
        if (sessionId) {
          await syncCheckoutSessionToDatabase(sessionId);
        } else {
          await syncSubscriptionsForEmailFromStripe(email);
        }

        await linkPendingSubscriptionsToUser({
          userId: existingUser.id,
          email,
        });
      } catch {
        // A conta existente ainda pode entrar; a validação de acesso roda no login.
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "account_exists",
            message: "Já existe uma conta com este e-mail. Faça login com sua senha.",
          },
        },
        { status: 409 },
      );
    }

    const subscriptionState = await resolvePaidSubscription(email, sessionId);

    if (!subscriptionState.ok) {
      if (subscriptionState.reason === "email_mismatch") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "email_mismatch",
              message:
                "O e-mail informado não corresponde ao pagamento. Use o mesmo e-mail do checkout.",
            },
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "no_subscription",
            message:
              "Não encontramos uma assinatura ativa para este e-mail. Aguarde alguns minutos e tente novamente, ou confira se usou o mesmo e-mail do pagamento.",
          },
        },
        { status: 403 },
      );
    }

    const claim = await claimSubscriptionActivationEmail({
      email,
      checkoutSessionId: sessionId,
    });

    if (!claim.claimed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "activation_in_progress",
            message:
              "Este e-mail já está em processo de ativação ou já possui conta. Tente entrar com sua senha.",
          },
        },
        { status: 409 },
      );
    }

    claimHeld = true;

    const admin = getSupabaseAdminClient();

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          onboarding_completed: false,
        },
      });

    if (createError || !createdUser.user) {
      await releaseSubscriptionActivationClaim(email);

      if (
        createError?.message?.toLowerCase().includes("already") ||
        createError?.message?.toLowerCase().includes("registered")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "account_exists",
              message: "Já existe uma conta com este e-mail. Faça login com sua senha.",
            },
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              createError?.message ||
              "Não foi possível criar sua conta. Tente novamente.",
          },
        },
        { status: 500 },
      );
    }

    await completeSubscriptionActivationClaim({
      email,
      userId: createdUser.user.id,
    });

    await linkPendingSubscriptionsToUser({
      userId: createdUser.user.id,
      email,
    });

    return NextResponse.json({
      success: true,
      data: {
        email,
        userId: createdUser.user.id,
      },
    });
  } catch (error) {
    if (claimHeld) {
      await releaseSubscriptionActivationClaim(email).catch(() => undefined);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível ativar sua conta.",
        },
      },
      { status: 500 },
    );
  }
}
