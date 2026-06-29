import { NextRequest, NextResponse } from "next/server";
import {
  normalizeContactPayload,
  sendContactSupportEmail,
  validateContactPayload,
} from "@/server/contact/contact-email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);

  if (!rateLimit(key)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Muitas mensagens enviadas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        },
      },
      { status: 429 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const payload = normalizeContactPayload({
    ...((rawBody || {}) as Record<string, unknown>),
    userAgent: request.headers.get("user-agent") || "",
  });
  const validationError = validateContactPayload(payload);

  if (validationError) {
    return NextResponse.json(
      { success: false, error: { message: validationError } },
      { status: 400 },
    );
  }

  try {
    await sendContactSupportEmail(payload);

    return NextResponse.json({
      success: true,
      message:
        "Sua mensagem foi enviada à equipe do Planify. Em breve entraremos em contato.",
    });
  } catch (error) {
    console.error("[contact] email send failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Não foi possível enviar sua mensagem agora. Tente novamente em alguns instantes.",
        },
      },
      { status: 503 },
    );
  }
}
