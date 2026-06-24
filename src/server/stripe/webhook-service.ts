import crypto from "node:crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getCreditWallet, grantPlanCredits } from "../credits/credit-service";
import { stripeApiRequest } from "./stripe-api";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

/**
 * Concede/renova créditos do ciclo. Em eventos de criação concede sempre; em
 * atualizações só concede se o período de cobrança mudou (renovação) — evita
 * resetar o saldo a meio do ciclo num `customer.subscription.updated`.
 */
async function maybeGrantCredits(params: {
  subscription: StripeSubscription;
  userId: string | null;
  eventType: string;
}): Promise<void> {
  const { subscription, userId, eventType } = params;
  if (!userId) return;
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status || "")) return;

  const planKey = getPlanKey(subscription);
  const cycleStart = unixToISOString(subscription.current_period_start);
  const cycleEnd = unixToISOString(subscription.current_period_end);

  const isCreation =
    eventType === "checkout.session.completed" ||
    eventType === "customer.subscription.created";

  if (!isCreation) {
    const wallet = await getCreditWallet(userId);
    const sameCycle =
      wallet && cycleStart && wallet.cycleStartsAt === cycleStart;
    if (wallet && sameCycle) return; // já concedido neste ciclo
  }

  await grantPlanCredits({ userId, planKey, cycleStart, cycleEnd });
}

type StripeWebhookEvent<T = Record<string, unknown>> = {
  id: string;
  type: string;
  data: {
    object: T;
  };
};

type StripeCheckoutSession = {
  id: string;
  customer?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  subscription?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string | undefined> | null;
};

type StripeCustomer = {
  id: string;
  email?: string | null;
  deleted?: boolean;
};

type StripeSubscription = {
  id: string;
  customer?: string | StripeCustomer | null;
  status?: string | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
  canceled_at?: number | null;
  metadata?: Record<string, string | undefined> | null;
  items?: {
    data?: Array<{
      price?: {
        id?: string | null;
      } | null;
    }>;
  };
};

type AuthUser = {
  id: string;
  email?: string | null;
};

const SIGNATURE_TOLERANCE_SECONDS = 60 * 5;

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || secret === "whsec_..." || secret.length < 20) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurado corretamente.");
  }

  return secret;
}

function getTimestampFromSignature(signatureHeader: string): string | null {
  const parts = signatureHeader.split(",");

  for (const part of parts) {
    const [key, value] = part.split("=");

    if (key === "t" && value) {
      return value;
    }
  }

  return null;
}

function getSignaturesFromHeader(signatureHeader: string): string[] {
  return signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a, "hex");
    const bufferB = Buffer.from(b, "hex");

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

export function verifyStripeWebhookSignature(params: {
  payload: string;
  signatureHeader: string | null;
}): StripeWebhookEvent {
  if (!params.signatureHeader) {
    throw new Error("Cabeçalho stripe-signature ausente.");
  }

  const webhookSecret = getWebhookSecret();
  const timestamp = getTimestampFromSignature(params.signatureHeader);
  const signatures = getSignaturesFromHeader(params.signatureHeader);

  if (!timestamp || signatures.length === 0) {
    throw new Error("Assinatura Stripe inválida.");
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    throw new Error("Timestamp da assinatura Stripe inválido.");
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const age = Math.abs(nowInSeconds - timestampNumber);

  if (age > SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error("Assinatura Stripe expirada.");
  }

  const signedPayload = `${timestamp}.${params.payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const isValid = signatures.some((signature) =>
    timingSafeEqualHex(signature, expectedSignature),
  );

  if (!isValid) {
    throw new Error("Assinatura Stripe não confere.");
  }

  return JSON.parse(params.payload) as StripeWebhookEvent;
}

function unixToISOString(value: number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function getCustomerId(subscription: StripeSubscription): string | null {
  if (!subscription.customer) {
    return null;
  }

  if (typeof subscription.customer === "string") {
    return subscription.customer;
  }

  return subscription.customer.id || null;
}

function getPriceId(subscription: StripeSubscription): string | null {
  return subscription.items?.data?.[0]?.price?.id || null;
}

function getPlanKey(subscription: StripeSubscription): string | null {
  return (
    subscription.metadata?.ui_plan_key ||
    subscription.metadata?.plan_key ||
    subscription.metadata?.plan ||
    subscription.metadata?.tipo ||
    null
  );
}

async function retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeApiRequest<StripeSubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

async function retrieveCustomer(customerId: string): Promise<StripeCustomer | null> {
  const customer = await stripeApiRequest<StripeCustomer>(
    `/customers/${encodeURIComponent(customerId)}`,
  );

  if (customer.deleted) {
    return null;
  }

  return customer;
}

async function findAuthUserByEmail(email: string | null | undefined): Promise<AuthUser | null> {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  let page = 1;
  const perPage = 100;

  while (page <= 30) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => String(item.email || "").trim().toLowerCase() === normalizedEmail,
    );

    if (user) {
      return {
        id: user.id,
        email: user.email,
      };
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function getEmailFromSubscription(
  subscription: StripeSubscription,
): Promise<string | null> {
  const customerId = getCustomerId(subscription);

  if (!customerId) {
    return null;
  }

  const customer = await retrieveCustomer(customerId);

  return customer?.email || null;
}

async function upsertSubscription(params: {
  subscription: StripeSubscription;
  user: AuthUser | null;
  email: string | null;
  eventType: string;
}) {
  const supabase = getSupabaseAdminClient();

  const customerId = getCustomerId(params.subscription);
  const priceId = getPriceId(params.subscription);
  const planKey = getPlanKey(params.subscription);

  const row = {
    id: params.subscription.id,
    user_id: params.user?.id || null,
    plan_id: planKey || priceId || null,
    plan_key: planKey,
    price_id: priceId,
    status: params.subscription.status || "incomplete",
    current_period_start: unixToISOString(params.subscription.current_period_start),
    current_period_end: unixToISOString(params.subscription.current_period_end),
    cancel_at_period_end: Boolean(params.subscription.cancel_at_period_end),
    canceled_at: unixToISOString(params.subscription.canceled_at),
    stripe_customer_id: customerId,
    stripe_customer_email: params.email,
    stripe_subscription_id: params.subscription.id,
    last_stripe_event_type: params.eventType,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase as any).from("subscriptions").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }

  return row;
}

async function handleCheckoutCompleted(
  session: StripeCheckoutSession,
  eventType: string,
) {
  const subscriptionId = session.subscription;

  if (!subscriptionId) {
    return {
      handled: false,
      reason: "checkout_without_subscription",
    };
  }

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    null;

  const subscription = await retrieveSubscription(subscriptionId);
  const resolvedEmail = email || (await getEmailFromSubscription(subscription));
  const user = await findAuthUserByEmail(resolvedEmail);
  const saved = await upsertSubscription({
    subscription,
    user,
    email: resolvedEmail,
    eventType,
  });

  await maybeGrantCredits({ subscription, userId: user?.id || null, eventType });

  return {
    handled: true,
    reason: user ? "subscription_linked_to_user" : "subscription_saved_without_user",
    userId: user?.id || null,
    email: resolvedEmail,
    subscriptionId: saved.id,
    status: saved.status,
  };
}

async function handleSubscriptionEvent(
  subscription: StripeSubscription,
  eventType: string,
) {
  const email = await getEmailFromSubscription(subscription);
  const user = await findAuthUserByEmail(email);
  const saved = await upsertSubscription({
    subscription,
    user,
    email,
    eventType,
  });

  await maybeGrantCredits({ subscription, userId: user?.id || null, eventType });

  return {
    handled: true,
    reason: user ? "subscription_linked_to_user" : "subscription_saved_without_user",
    userId: user?.id || null,
    email,
    subscriptionId: saved.id,
    status: saved.status,
  };
}

export async function handleStripeWebhookEvent(event: StripeWebhookEvent) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        event.data.object as StripeCheckoutSession,
        event.type,
      );

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return handleSubscriptionEvent(
        event.data.object as StripeSubscription,
        event.type,
      );

    default:
      return {
        handled: false,
        reason: "event_ignored",
        eventType: event.type,
      };
  }
}

/** Sincroniza assinatura do Stripe quando o webhook ainda não gravou no banco. */
export async function syncCheckoutSessionToDatabase(sessionId: string): Promise<{
  synced: boolean;
  email: string | null;
}> {
  const trimmed = sessionId.trim();
  if (!trimmed.startsWith("cs_")) {
    return { synced: false, email: null };
  }

  const session = await stripeApiRequest<StripeCheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(trimmed)}`,
  );

  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    null;

  if (session.payment_status !== "paid" || !session.subscription) {
    return { synced: false, email };
  }

  const result = await handleCheckoutCompleted(session, "checkout.session.sync");

  return {
    synced: Boolean(result.handled),
    email,
  };
}

type StripeCustomerListResponse = {
  data?: Array<{ id: string }>;
};

type StripeSubscriptionListResponse = {
  data?: StripeSubscription[];
};

/** Recupera assinaturas pagas na Stripe quando o webhook ainda não gravou no banco. */
export async function syncSubscriptionsForEmailFromStripe(
  email: string,
): Promise<{ synced: number; email: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { synced: 0, email: normalizedEmail };
  }

  const customers = await stripeApiRequest<StripeCustomerListResponse>(
    `/customers?email=${encodeURIComponent(normalizedEmail)}&limit=5`,
  );

  let synced = 0;

  for (const customer of customers.data || []) {
    for (const status of ["active", "trialing"] as const) {
      const subscriptions = await stripeApiRequest<StripeSubscriptionListResponse>(
        `/subscriptions?customer=${customer.id}&status=${status}&limit=10`,
      );

      for (const subscription of subscriptions.data || []) {
        const result = await handleSubscriptionEvent(
          subscription,
          "customer.subscription.sync_by_email",
        );
        if (result.handled) {
          synced += 1;
        }
      }
    }
  }

  return { synced, email: normalizedEmail };
}
