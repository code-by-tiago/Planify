import { NextRequest, NextResponse } from "next/server";
import {
  handleStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "../../../../server/stripe/webhook-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signatureHeader = request.headers.get("stripe-signature");

    const event = verifyStripeWebhookSignature({
      payload,
      signatureHeader,
    });

    const result = await handleStripeWebhookEvent(event);

    return NextResponse.json(
      {
        received: true,
        eventId: event.id,
        eventType: event.type,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Erro ao processar webhook Stripe.",
        },
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message:
        "Webhook Stripe ativo. Configure este endpoint no painel da Stripe e envie eventos via POST.",
      endpoint: "/api/stripe/webhook",
    },
    { status: 200 },
  );
}
