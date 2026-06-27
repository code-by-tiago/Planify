import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "@/server/google/google-auth";
import { exportSlidesToGooglePresentations } from "@/server/google/google-slides-export-service";
import { getGoogleConfigStatus } from "@/server/google/google-oauth";
import {
  jsonExportErrorResponse,
  logExportSuccess,
  parseExportTelemetryMetadata,
} from "@/server/export/export-error-service";
import { buildLessonPlanSlidesFromHtml } from "@/server/lesson-execution/lesson-plan-slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type SlidesExportBody = {
  title?: string;
  html?: string;
  documentType?: string;
  theme?: string;
};

function isLessonPlanDocument(documentType?: string | null): boolean {
  const normalized = String(documentType || "").toLowerCase();
  return normalized.includes("plano-aula") || normalized.includes("plano de aula");
}

export async function POST(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Integracao Google nao configurada. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI.",
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
        error: { message: "Faca login e conecte sua conta Google." },
      },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as SlidesExportBody | null;

  if (!body) {
    return NextResponse.json(
      { success: false, error: { message: "Corpo da requisicao invalido." } },
      { status: 400 },
    );
  }

  const title = String(body.title || "").trim();
  const html = String(body.html || "").trim();
  const documentType = String(body.documentType || "").trim();

  if (!title) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o titulo da apresentacao." } },
      { status: 400 },
    );
  }

  if (!html) {
    return NextResponse.json(
      { success: false, error: { message: "Conteudo HTML vazio." } },
      { status: 400 },
    );
  }

  try {
    const startedAt = Date.now();
    const slides = isLessonPlanDocument(documentType)
      ? buildLessonPlanSlidesFromHtml({ title, html })
      : undefined;

    const result = await exportSlidesToGooglePresentations(user.id, {
      title,
      html,
      slides,
      theme: body.theme,
    });

    logExportSuccess({
      surface: "google-slides",
      toolTipo: documentType || "google-slides",
      durationMs: Date.now() - startedAt,
      metadata: parseExportTelemetryMetadata({
        documentType,
        format: "google-slides",
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return jsonExportErrorResponse(error, { surface: "google-slides" });
  }
}
