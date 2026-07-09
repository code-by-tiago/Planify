import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { interpretCopilotoTranscript } from "@/server/copiloto/copiloto-interpret-service";
import { consumeCopilotoInterpretRateLimit } from "@/server/copiloto/copiloto-rate-limit-service";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function copilotoErrorResponse(
  message: string,
  status: number,
  code?: string,
) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      message,
      error: { message, code },
      code,
    },
    { status },
  );
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const startedAt = Date.now();
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (userId) {
    try {
      await consumeCopilotoInterpretRateLimit(userId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Muitas interpretações em pouco tempo. Aguarde um instante.";
      return copilotoErrorResponse(message, 429, "rate_limit");
    }
  }

  let body: { transcript?: string };
  try {
    body = (await request.json()) as { transcript?: string };
  } catch {
    return copilotoErrorResponse("JSON inválido.", 400, "invalid_json");
  }

  const transcript = String(body.transcript || "").trim();
  if (transcript.length < 8) {
    return copilotoErrorResponse(
      "Descreva o pedido com pelo menos algumas palavras.",
      400,
      "invalid_transcript",
    );
  }

  try {
    const brief = await interpretCopilotoTranscript(transcript);
    return NextResponse.json({
      ok: true,
      success: true,
      brief,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[copiloto/interpretar]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível interpretar o pedido.";
    return copilotoErrorResponse(message, 502, "interpret_failed");
  }
}

export const POST = withOperationalCapture(
  { eventType: "copiloto_interpret", toolTipo: "copiloto" },
  handlePost,
);
