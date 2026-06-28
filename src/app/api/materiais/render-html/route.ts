import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import { buildMaterialEngineHtmlFromStructure } from "@/server/materials/material-engine-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RenderHtmlBody = {
  generationPayload?: MaterialEngineInput;
  estrutura?: unknown;
};

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as RenderHtmlBody | null;

  if (!body?.generationPayload || !body.estrutura) {
    return NextResponse.json(
      { ok: false, message: "Payload de renderização inválido." },
      { status: 400 },
    );
  }

  try {
    const html = buildMaterialEngineHtmlFromStructure(
      body.generationPayload,
      body.estrutura as Parameters<typeof buildMaterialEngineHtmlFromStructure>[1],
    );

    if (!html.trim()) {
      return NextResponse.json(
        { ok: false, message: "Renderização retornou HTML vazio." },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, html });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao renderizar HTML do material.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
