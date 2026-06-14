import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { exportSlidesPptxBuffer } from "@/server/materials/slides-pptx-export-service";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";
import { jsonExportErrorResponse } from "@/server/export/export-error-service";
import { resolveSlideDeck } from "@/lib/google/document-type-detection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body = {
  title?: string;
  html?: string;
  slides?: MaterialEngineResponse["slides"];
  theme?: string;
  documentType?: string | null;
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as Body | null;
    const title = String(body?.title || "Apresentação Planify").trim();
    const html = String(body?.html || "");

    if (!html.trim() && !body?.slides?.length) {
      return NextResponse.json(
        { success: false, error: { message: "Conteúdo vazio." } },
        { status: 400 },
      );
    }

    const isSlideDeck = resolveSlideDeck(() => html, body?.documentType, undefined);
    if (!isSlideDeck && !body?.slides?.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Exportação PPTX disponível apenas para apresentações de slides.",
          },
        },
        { status: 400 },
      );
    }

    const exported = await exportSlidesPptxBuffer({
      title,
      html,
      slides: body?.slides,
      theme: body?.theme,
    });

    return new NextResponse(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.filename}"; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
        "X-Planify-Filename": exported.filename,
        "X-Planify-Slide-Count": String(exported.slideCount),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonExportErrorResponse(error, { surface: "documentos-export-pptx" });
  }
}
