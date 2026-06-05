import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { exportSlidesToGooglePresentations } from "../../../../../server/google/google-slides-export-service";
import type { MaterialEngineResponse } from "../../../../../server/materials/material-engine-types";

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
    slides?: MaterialEngineResponse["slides"];
  };

  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o título da apresentação." } },
      { status: 400 },
    );
  }

  if (!body.slides?.length && !String(body.html || "").trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Conteúdo dos slides vazio." } },
      { status: 400 },
    );
  }

  try {
    const result = await exportSlidesToGooglePresentations(user.id, {
      title,
      html: body.html,
      slides: body.slides,
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
              : "Não foi possível abrir no Google Apresentações.",
        },
      },
      { status: 400 },
    );
  }
}
