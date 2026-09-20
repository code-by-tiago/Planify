import { NextRequest, NextResponse } from "next/server";
import { buildContentDispositionAttachment } from "../../../../../server/marketplace/marketplace-download";
import {
  LessonSimulatorError,
  renderLessonSimulatorListaPdf,
} from "../../../../../server/public/lesson-simulator-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 80_000;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "invalid_input", message: "Requisição inválida." },
        },
        { status: 400 },
      );
    }

    let body: { lista?: unknown; theme?: unknown; filename?: unknown };

    try {
      body = JSON.parse(rawBody) as typeof body;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "invalid_input", message: "Requisição inválida." },
        },
        { status: 400 },
      );
    }

    const rendered = await renderLessonSimulatorListaPdf(body.lista, body.theme);
    const requestedName = typeof body.filename === "string" ? body.filename.trim() : "";
    const filename = requestedName.endsWith(".pdf") ? requestedName : rendered.filename;

    return new NextResponse(new Uint8Array(rendered.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": buildContentDispositionAttachment(filename),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Planify-Filename": filename,
      },
    });
  } catch (error) {
    if (error instanceof LessonSimulatorError) {
      const message =
        error.code === "pdf_failed"
          ? "Não foi possível gerar o PDF completo. Tente novamente em alguns instantes."
          : "A lista de atividades está incompleta. Gere novamente para baixar o PDF.";

      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message },
        },
        { status: error.code === "pdf_failed" ? 500 : 400 },
      );
    }

    console.error(
      "[lesson-simulator] pdf download failed:",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "pdf_failed",
          message: "Não foi possível gerar o PDF completo. Tente novamente em alguns instantes.",
        },
      },
      { status: 500 },
    );
  }
}
