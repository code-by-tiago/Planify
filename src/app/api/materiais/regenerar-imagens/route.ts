import { NextRequest, NextResponse } from "next/server";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { regenerateFailedSlideImages } from "@/server/materials/slide-images-retry";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RegenerarImagensBody = MaterialEngineInput & {
  estrutura: MaterialEngineResponse;
};

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as RegenerarImagensBody | null;

  if (!body?.estrutura || !body.tipoMaterial) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = String(body.tipoMaterial || body.tipo || "slides");
  if (tipo !== "slides") {
    return NextResponse.json(
      { ok: false, message: "Retry de imagens disponivel apenas para material legado de slides." },
      { status: 400 },
    );
  }

  try {
    const result = await regenerateFailedSlideImages(body, body.estrutura);

    return NextResponse.json({
      ok: true,
      html: result.html,
      estrutura: result.estrutura,
      imagesResolved: result.imagesResolved,
      creditCost: 0,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao regenerar imagens.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "slides-images-retry" },
  handlePost,
);
