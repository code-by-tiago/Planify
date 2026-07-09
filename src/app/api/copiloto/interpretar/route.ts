import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { interpretCopilotoTranscript } from "@/server/copiloto/copiloto-interpret-service";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  let body: { transcript?: string };
  try {
    body = (await request.json()) as { transcript?: string };
  } catch {
    return NextResponse.json(
      { ok: false, message: "JSON inválido." },
      { status: 400 },
    );
  }

  const transcript = String(body.transcript || "").trim();
  if (transcript.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        message: "Descreva o pedido com pelo menos algumas palavras.",
      },
      { status: 400 },
    );
  }

  try {
    const brief = await interpretCopilotoTranscript(transcript);
    return NextResponse.json({ ok: true, brief });
  } catch (error) {
    console.error("[copiloto/interpretar]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível interpretar o pedido.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "copiloto-interpretar" },
  handlePost,
);
