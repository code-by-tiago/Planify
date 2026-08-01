import { stripeApiRequest } from "./stripe-api";

type StripeCheckoutSession = {
  id: string;
  status: string | null;
  payment_status: string | null;
  customer_details?: {
    email?: string | null;
  } | null;
  customer_email?: string | null;
};

export type CheckoutSessionPublicSummary = {
  email: string | null;
  status: string | null;
  paymentStatus: string | null;
};

const PAID_PAYMENT_STATUSES = new Set(["paid", "no_payment_required"]);

export function isCheckoutSessionPaid(
  summary: CheckoutSessionPublicSummary | null,
): boolean {
  if (!summary) {
    return false;
  }

  if (summary.status === "expired") {
    return false;
  }

  return PAID_PAYMENT_STATUSES.has(summary.paymentStatus || "");
}

export async function validateCheckoutSessionForEmail(params: {
  sessionId: string;
  email: string;
}): Promise<
  | { ok: true; summary: CheckoutSessionPublicSummary }
  | { ok: false; reason: "invalid_session" | "email_mismatch" | "unpaid" }
> {
  const summary = await getCheckoutSessionPublicSummary(params.sessionId);

  if (!summary) {
    return { ok: false, reason: "invalid_session" };
  }

  if (!isCheckoutSessionPaid(summary)) {
    return { ok: false, reason: "unpaid" };
  }

  const sessionEmail = summary.email?.trim().toLowerCase() || "";
  const expectedEmail = params.email.trim().toLowerCase();

  if (!sessionEmail || sessionEmail !== expectedEmail) {
    return { ok: false, reason: "email_mismatch" };
  }

  return { ok: true, summary };
}

export async function getCheckoutSessionPublicSummary(
  sessionId: string,
): Promise<CheckoutSessionPublicSummary | null> {
  const trimmed = sessionId.trim();

  if (!trimmed.startsWith("cs_")) {
    return null;
  }

  const session = await stripeApiRequest<StripeCheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(trimmed)}`,
  );

  if (session.status === "expired") {
    return null;
  }

  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    null;

  return {
    email,
    status: session.status,
    paymentStatus: session.payment_status,
  };
}
