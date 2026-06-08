import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { exportMaterialToGoogle } from "../../../../../server/google/google-export-service";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { getSupabaseAdminClient } from "../../../../../server/supabase/admin-client";
import { getGoogleTokensForUser } from "../../../../../server/google/google-token-store";

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

  const body = (await request.json()) as {
    title?: string;
    html?: string;
    description?: string;
    courseId?: string;
    filename?: string;
    documentType?: string;
  };

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

  try {
    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_admin,status")
      .eq("id", user.id)
      .maybeSingle();
    const googleTokens = await getGoogleTokensForUser(user.id).catch(() => null);

    const result = await exportMaterialToGoogle(user.id, {
      title,
      html: body.html,
      description: body.description,
      courseId: body.courseId ? String(body.courseId) : undefined,
      filename: body.filename,
      documentType: body.documentType,
    });

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1b39d8",
      },
      body: JSON.stringify({
        sessionId: "1b39d8",
        runId: "classroom-export",
        hypothesisId: "H-admin",
        location: "classroom/export/route.ts:POST",
        message: "classroom export success",
        data: {
          userId: user.id,
          planifyEmail: user.email,
          profileRole: profile?.role ?? null,
          isAdmin: Boolean(profile?.is_admin),
          profileStatus: profile?.status ?? null,
          googleEmail: googleTokens?.googleEmail ?? result.googleEmail ?? null,
          googleConnected: Boolean(googleTokens?.refreshToken),
          courseId: String(body.courseId || ""),
          isEducarRs: Boolean(
            (googleTokens?.googleEmail || user.email || "").includes("educar.rs"),
          ),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Não foi possível enviar ao Google Classroom.";
    const supabase = getSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_admin,status")
      .eq("id", user.id)
      .maybeSingle();
    const googleTokens = await getGoogleTokensForUser(user.id).catch(() => null);

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1b39d8",
      },
      body: JSON.stringify({
        sessionId: "1b39d8",
        runId: "classroom-export",
        hypothesisId: "H-admin",
        location: "classroom/export/route.ts:POST",
        message: "classroom export failed",
        data: {
          userId: user.id,
          planifyEmail: user.email,
          profileRole: profile?.role ?? null,
          isAdmin: Boolean(profile?.is_admin),
          profileStatus: profile?.status ?? null,
          googleEmail: googleTokens?.googleEmail ?? null,
          googleConnected: Boolean(googleTokens?.refreshToken),
          courseId: String(body.courseId || ""),
          isEducarRs: Boolean(
            (googleTokens?.googleEmail || user.email || "").includes("educar.rs"),
          ),
          errorMessage,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
