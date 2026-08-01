import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { exportQuizToGoogleForms } from "../../../../../server/google/google-forms-export-service";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { jsonExportErrorResponse, logExportSuccess, parseExportTelemetryMetadata } from "@/server/export/export-error-service";

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

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    html?: string;
    description?: string;
  } | null;

  if (!body) {
    return NextResponse.json(
      { success: false, error: { message: "Corpo da requisição inválido." } },
      { status: 400 },
    );
  }

  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o título do formulário." } },
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
    const startedAt = Date.now();
    const result = await exportQuizToGoogleForms(user.id, {
      title,
      html: body.html!,
      description: body.description,
    });

    logExportSuccess({
      surface: "google-forms",
      toolTipo: "google-forms",
      durationMs: Date.now() - startedAt,
      metadata: parseExportTelemetryMetadata({
        documentType: "material:prova",
        format: "google-forms",
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return jsonExportErrorResponse(error, { surface: "google-forms" });
  }
}
