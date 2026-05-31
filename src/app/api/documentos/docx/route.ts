import { NextRequest, NextResponse } from "next/server";
import { normalizeDocxPayload } from "../../../../server/docx/document-normalizer";
import { buildSimpleDocx } from "../../../../server/docx/simple-docx-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(value: string | undefined) {
  const cleaned = String(value || "documento-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "documento-planify";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spec = normalizeDocxPayload(body);
    const buffer = buildSimpleDocx(spec);
    const filename = safeFilename(spec.filename || spec.title);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"; filename*=UTF-8''${encodeURIComponent(filename)}.docx`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o DOCX.",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message:
        "Motor DOCX real ativo. Use POST com kind e document para baixar .docx.",
    },
    { status: 200 },
  );
}
