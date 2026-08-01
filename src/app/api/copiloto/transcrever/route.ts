import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { transcribeCopilotoAudio } from "@/server/copiloto/copiloto-transcribe-service";
import { consumeCopilotoTranscribeRateLimit } from "@/server/copiloto/copiloto-rate-limit-service";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      await consumeCopilotoTranscribeRateLimit(userId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Muitas transcrições em pouco tempo. Aguarde um instante.";
      return copilotoErrorResponse(message, 429, "rate_limit");
    }
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return copilotoErrorResponse(
      "Não foi possível ler o áudio enviado.",
      400,
      "invalid_form",
    );
  }

  const file = form.get("audio");
  if (!(file instanceof File) || !file.size) {
    return copilotoErrorResponse(
      "Envie um arquivo de áudio válido.",
      400,
      "invalid_audio",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await transcribeCopilotoAudio({
    buffer,
    mimeType: file.type || "audio/webm",
  });

  if (!result.ok) {
    return copilotoErrorResponse(result.message, result.status, result.code);
  }

  return NextResponse.json({
    ok: true,
    success: true,
    transcript: result.transcript,
    durationMs: Date.now() - startedAt,
  });
}

export const POST = withOperationalCapture(
  { eventType: "copiloto_transcribe", toolTipo: "copiloto" },
  handlePost,
);
