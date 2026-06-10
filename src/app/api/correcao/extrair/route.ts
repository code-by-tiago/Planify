import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { extractStudentResponseFromUpload } from "@/server/correcao/correction-ocr-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
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
}
