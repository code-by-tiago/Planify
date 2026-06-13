import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { getCheckoutSessionPublicSummary } from "@/server/stripe/checkout-session-lookup";
import { linkPendingSubscriptionsToUser } from "@/server/stripe/link-subscription-to-user";
import { appendFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["active", "trialing"];

function debugLog(payload: Record<string, unknown>) {
  try {
    const line = JSON.stringify({
      sessionId: "3ed578",
      runId: "checkout-activate",
      timestamp: Date.now(),
      ...payload,
    });
    appendFileSync(join(process.cwd(), "debug-3ed578.log"), `${line}\n`, "utf8");
  } catch {
    // ignore
  }
}

async function findAuthUserByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  let page = 1;

  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(error.message);

    const user = data.users.find(
      (item) => String(item.email || "").trim().toLowerCase() === email,
    );

    if (user) return user;

    if (data.users.length < 100) return null;
    page += 1;
  }

  return null;
}

async function hasActiveSubscription(email: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select("id")
    .eq("stripe_customer_email", email)
    .in("status", ACTIVE_STATUSES)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      sessionId?: string;
    };

    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const sessionId = body.sessionId?.trim() || "";

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, error: { message: "E-mail inválido.", code: "invalid_email" } },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A senha deve ter pelo menos 6 caracteres.", code: "weak_password" },
        },
        { status: 400 },
      );
    }

    if (sessionId) {
      const summary = await getCheckoutSessionPublicSummary(sessionId);
      const checkoutEmail = summary?.email?.trim().toLowerCase();

      if (!checkoutEmail || checkoutEmail !== email) {
        debugLog({
          hypothesisId: "H7",
          location: "activate-account:sessionMismatch",
          message: "checkout session email mismatch",
          data: { hasSession: Boolean(summary), checkoutEmailMatch: checkoutEmail === email },
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Use o mesmo e-mail confirmado no pagamento Stripe.",
              code: "email_mismatch",
            },
          },
          { status: 400 },
        );
      }
    }

    const paid = await hasActiveSubscription(email);

    if (!paid) {
      debugLog({
        hypothesisId: "H7",
        location: "activate-account:noSubscription",
        message: "no active subscription for email",
        data: { emailDomain: email.split("@")[1] },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Não encontramos pagamento ativo para este e-mail. Aguarde alguns segundos e tente de novo.",
            code: "no_subscription",
          },
        },
        { status: 403 },
      );
    }

    const existing = await findAuthUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Já existe conta com este e-mail. Entre com sua senha.",
            code: "account_exists",
          },
        },
        { status: 409 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "" },
    });

    if (createError || !created.user) {
      debugLog({
        hypothesisId: "H6",
        location: "activate-account:createUserFailed",
        message: "admin createUser failed",
        data: { errorMessage: createError?.message || "unknown" },
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            message: createError?.message || "Não foi possível criar a conta.",
            code: "create_failed",
          },
        },
        { status: 500 },
      );
    }

    const linkResult = await linkPendingSubscriptionsToUser({
      userId: created.user.id,
      email,
    });

    debugLog({
      hypothesisId: "H1-H6",
      location: "activate-account:success",
      message: "account created via admin API",
      data: {
        emailDomain: email.split("@")[1],
        linkedCount: linkResult.linkedCount,
        userId: created.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: created.user.id,
        linkedCount: linkResult.linkedCount,
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
              : "Erro ao ativar conta após pagamento.",
          code: "server_error",
        },
      },
      { status: 500 },
    );
  }
}
