import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import {
  assertClassroomExportAllowed,
  buildClassroomExportDedupKey,
  recordClassroomExportDedup,
} from "../../../../../server/google/classroom-export-dedup";
import { exportMaterialToGoogle } from "../../../../../server/google/google-export-service";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { logExportSuccess, parseExportTelemetryMetadata } from "@/server/export/export-error-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    courseId?: string;
    filename?: string;
    documentType?: string;
    publishState?: "PUBLISHED" | "DRAFT";
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
      { success: false, error: { message: "Informe o título do material." } },
      { status: 400 },
    );
  }

  if (!String(body.html || "").trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Conteúdo HTML vazio." } },
      { status: 400 },
    );
  }

  if (!body.courseId) {
    return NextResponse.json(
      { success: false, error: { message: "Selecione uma turma do Classroom." } },
      { status: 400 },
    );
  }

  const courseId = String(body.courseId).trim();
  const html = String(body.html || "").trim();
  const publishState =
    body.publishState === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  try {
    const dedupKey = buildClassroomExportDedupKey({
      userId: user.id,
      courseId,
      title,
      html,
    });

    assertClassroomExportAllowed(dedupKey);

    const startedAt = Date.now();
    const result = await exportMaterialToGoogle(user.id, {
      title,
      html,
      description: body.description,
      courseId,
      filename: body.filename,
      documentType: body.documentType,
      publishState,
    });

    recordClassroomExportDedup(dedupKey);

    logExportSuccess({
      surface: "google-classroom",
      toolTipo: body.documentType || "google-classroom",
      durationMs: Date.now() - startedAt,
      metadata: parseExportTelemetryMetadata({
        documentType: body.documentType,
        format: "google-classroom",
      }),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Não foi possível enviar ao Google Classroom.";

    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage,
        },
      },
      { status: 400 },
    );
  }
}
