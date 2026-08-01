import { headers } from "next/headers";
import { getBillingPlan, type BillingPlanKey } from "../../types/billing";
import { stripeApiRequest } from "./stripe-api";

type CheckoutParams = {
  planKey: BillingPlanKey;
  customerEmail?: string | null;
};

type StripeCheckoutSessionResponse = {
  id: string;
  url: string | null;
  error?: {
    message?: string;
  };
};

type CheckoutSessionResult = {
  id: string;
  url: string;
};

function getAppUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

function getPriceId(planKey: BillingPlanKey): string {
  const plan = getBillingPlan(planKey);

  if (!plan) {
    throw new Error("Plano inválido.");
  }

  for (const envKey of plan.envPriceKeys) {
    const value = process.env[envKey];

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Preço Stripe não configurado. Configure uma destas variáveis: ${plan.envPriceKeys.join(", ")}.`,
  );
}

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return getAppUrl();
}

function buildStripeForm(params: Record<string, string>) {
  const form = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    form.append(key, value);
  });

  return form;
}

export async function createStripeCheckoutSession(
  params: CheckoutParams,
): Promise<CheckoutSessionResult> {
  const appUrl = await getOrigin();
  const priceId = getPriceId(params.planKey);
  const plan = getBillingPlan(params.planKey);

  if (!plan) {
    throw new Error("Plano inválido.");
  }

  const formEntries: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${appUrl}/planos/sucesso?checkout=success&plan=${params.planKey}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/planos?checkout=cancelled&plan=${params.planKey}`,
    "metadata[ui_plan_key]": params.planKey,
    "metadata[plan_key]": plan.stripePlanKey,
    "metadata[plan_name]": plan.name,
    "metadata[credits_per_cycle]": String(plan.creditsPerCycle),
    "subscription_data[metadata][ui_plan_key]": params.planKey,
    "subscription_data[metadata][plan_key]": plan.stripePlanKey,
    "subscription_data[metadata][plan_name]": plan.name,
    "subscription_data[metadata][credits_per_cycle]": String(plan.creditsPerCycle),
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
  };

  const email = params.customerEmail?.trim();
  if (email && email.includes("@")) {
    formEntries.customer_email = email;
  }

  const form = buildStripeForm(formEntries);

  const json = await stripeApiRequest<StripeCheckoutSessionResponse>(
    "/checkout/sessions",
    {
      method: "POST",
      body: form,
    },
  );

  const checkoutUrl = json.url;

  if (!checkoutUrl) {
    throw new Error("Stripe não retornou a URL do checkout.");
  }

  return {
    id: json.id,
    url: checkoutUrl,
  };
}
