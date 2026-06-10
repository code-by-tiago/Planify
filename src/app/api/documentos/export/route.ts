import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  exportEditorHtmlDocument,
  type EditorHtmlExportFormat,
} from "../../../../server/export/editor-html-export-service";
import { jsonExportErrorResponse } from "@/server/export/export-error-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseFormat(value: unknown): EditorHtmlExportFormat {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "pdf" || normalized === "html") {
    return normalized;
  }

  return "docx";
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const title = String(body?.title || "Documento Planify").trim();
    const html = String(body?.html || "");
    const format = parseFormat(body?.format);

    if (!html.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "O conteúdo HTML está vazio." },
        },
        { status: 400 },
      );
    }

    const exported = await exportEditorHtmlDocument({
      title,
      html,
      format,
      documentType:
        typeof body?.documentType === "string" ? body.documentType : null,
    });

    return new NextResponse(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.filename}"; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
        "X-Planify-Filename": exported.filename,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonExportErrorResponse(error, { surface: "documentos-export" });
  }
}
