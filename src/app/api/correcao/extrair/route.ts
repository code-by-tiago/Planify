import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { extractStudentResponseFromUpload } from "@/server/correcao/correction-ocr-service";
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
      { ok: false, message: "Não foi possível ler o arquivo enviado." },
      { status: 400 },
    );
  }

  const file = form.get("arquivo");
  const hintRaw = String(form.get("hint") || "resposta");
  const hint = hintRaw === "prova_completa" ? "prova_completa" : "resposta";

  if (!(file instanceof File) || !file.size) {
    return NextResponse.json(
      { ok: false, message: "Selecione uma imagem ou PDF válido." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractStudentResponseFromUpload({
      buffer,
      mimeType: file.type || "application/octet-stream",
      hint,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      texto: result.texto,
      avisos: result.avisos,
    });
  } catch (error) {
    console.error("[correcao/extrair] unexpected failure:", error);

    return NextResponse.json(
      { ok: false, message: "Erro inesperado ao extrair texto do arquivo." },
      { status: 500 },
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "correcao-ocr" },
  handlePost,
);
