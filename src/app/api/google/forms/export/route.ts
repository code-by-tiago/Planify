import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { exportQuizToGoogleForms } from "../../../../../server/google/google-forms-export-service";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { jsonExportErrorResponse } from "@/server/export/export-error-service";

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
    const htmlLen = String(body.html || "").trim().length;
    // #region agent log
    fetch("http://127.0.0.1:7453/ingest/bd608440-c83f-44b6-8664-8f8ef1293166", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "335b85" },
      body: JSON.stringify({
        sessionId: "335b85",
        runId: "forms-export",
        hypothesisId: "H4",
        location: "forms/export/route.ts:POST",
        message: "forms_export_request",
        data: { titleLen: title.length, htmlLen, userId: user.id.slice(0, 8) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const result = await exportQuizToGoogleForms(user.id, {
      title,
      html: body.html!,
      description: body.description,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = error instanceof Error && "status" in error ? (error as { status?: number }).status : undefined;
    // #region agent log
    fetch("http://127.0.0.1:7453/ingest/bd608440-c83f-44b6-8664-8f8ef1293166", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "335b85" },
      body: JSON.stringify({
        sessionId: "335b85",
        runId: "forms-export",
        hypothesisId: "H1-H3",
        location: "forms/export/route.ts:catch",
        message: "forms_export_error",
        data: { errMsg, errStatus },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return jsonExportErrorResponse(error, { surface: "google-forms" });
  }
}
