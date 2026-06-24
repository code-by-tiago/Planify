import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findAuthUserByEmail } from "../../../../server/auth/find-user-by-email";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";
import { linkPendingSubscriptionsToUser } from "../../../../server/stripe/link-subscription-to-user";
import {
  syncCheckoutSessionToDatabase,
  syncSubscriptionsForEmailFromStripe,
} from "../../../../server/stripe/webhook-service";
import { getCheckoutSessionPublicSummary } from "../../../../server/stripe/checkout-session-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing"];

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
): Promise<{ ok: true } | { ok: false; reason: "no_subscription" | "email_mismatch" }> {
  if (sessionId) {
    const syncResult = await syncCheckoutSessionToDatabase(sessionId);

    if (!syncResult.synced) {
      const summary = await getCheckoutSessionPublicSummary(sessionId);
      if (!summary) {
        return { ok: false, reason: "no_subscription" };
      }

      const summaryEmail = summary.email?.trim().toLowerCase() || "";
      if (summaryEmail && summaryEmail !== email.trim().toLowerCase()) {
        return { ok: false, reason: "email_mismatch" };
      }
    }
  }

  if (await hasActiveSubscription(email)) {
    return { ok: true };
  }

  await syncSubscriptionsForEmailFromStripe(email);

  const maxAttempts = 8;
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

  try {
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
              "Não encontramos uma assinatura ativa para este e-mail. Aguarde alguns minutos e tente de novo, ou confira se usou o mesmo e-mail do pagamento.",
          },
        },
        { status: 403 },
      );
    }

    const admin = getSupabaseAdminClient();
    const existingUser = await findAuthUserByEmail(email);

    if (existingUser) {
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
