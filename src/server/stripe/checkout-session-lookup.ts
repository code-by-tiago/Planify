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
