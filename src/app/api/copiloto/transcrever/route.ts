import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { transcribeCopilotoAudio } from "@/server/copiloto/copiloto-transcribe-service";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível ler o áudio enviado." },
      { status: 400 },
    );
  }

  const file = form.get("audio");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json(
      { ok: false, message: "Envie um arquivo de áudio válido." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await transcribeCopilotoAudio({
    buffer,
    mimeType: file.type || "audio/webm",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, transcript: result.transcript });
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "copiloto-transcrever" },
  handlePost,
);
