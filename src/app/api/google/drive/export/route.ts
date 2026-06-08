import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { saveDocumentToGoogleDrive } from "../../../../../server/google/google-docs-export-service";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Integração Google não configurada. Veja docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
        },
      },
      { status: 503 },
    );
  }

  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Faça login e conecte sua conta Google." },
      },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    title?: string;
    html?: string;
    documentType?: string;
    planningPayload?: Record<string, unknown> | null;
  };

  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o título do documento." } },
      { status: 400 },
    );
  }

  if (!String(body.html || "").trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Conteúdo HTML vazio." } },
      { status: 400 },
    );
  }

  try {
    const result = await saveDocumentToGoogleDrive(user.id, {
      title,
      html: body.html!,
      documentType: body.documentType,
      planningPayload: body.planningPayload ?? null,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível salvar no Google Drive.",
        },
      },
      { status: 400 },
    );
  }
}
