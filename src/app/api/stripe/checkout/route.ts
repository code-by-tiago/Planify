import { NextRequest, NextResponse } from "next/server";
import { createStripeCheckoutSession } from "../../../../server/stripe/checkout-service";
import type { BillingPlanKey } from "../../../../types/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPlanFromRequest(request: NextRequest): BillingPlanKey | null {
  const plan =
    request.nextUrl.searchParams.get("plan") ||
    request.nextUrl.searchParams.get("tipo");

  if (plan === "monthly" || plan === "yearly") {
    return plan;
  }

  if (plan === "mensal") {
    return "monthly";
  }

  if (plan === "anual") {
    return "yearly";
  }

  return null;
}

function redirectToPlans(request: NextRequest, reason: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/planos";
  url.search = "";
  url.searchParams.set("checkout", reason);

  return NextResponse.redirect(url);
}

function redirectToPlansWithError(request: NextRequest, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/planos";
  url.search = "";
  url.searchParams.set("checkout", "error");
  url.searchParams.set("message", message);

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const planKey = getPlanFromRequest(request);

  if (!planKey) {
    return redirectToPlans(request, "missing_plan");
  }

  try {
    const session = await createStripeCheckoutSession({
      planKey,
    });

    if (!session.url) {
      return redirectToPlansWithError(
        request,
        "Stripe não retornou uma URL de checkout.",
      );
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    return redirectToPlansWithError(
      request,
      error instanceof Error ? error.message : "Erro ao iniciar checkout.",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      plan?: string;
      tipo?: string;
    };

    const rawPlan = body.plan || body.tipo;
    const planKey =
      rawPlan === "monthly" || rawPlan === "mensal"
        ? "monthly"
        : rawPlan === "yearly" || rawPlan === "anual"
          ? "yearly"
          : null;

    if (!planKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Plano inválido. Use monthly/yearly ou mensal/anual.",
          },
        },
        { status: 400 },
      );
    }

    const session = await createStripeCheckoutSession({
      planKey,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Erro ao iniciar checkout Stripe.",
        },
      },
      { status: 500 },
    );
  }
}
