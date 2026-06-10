import { NextRequest, NextResponse } from "next/server";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";
import { regenerateFailedSlideImages } from "@/server/materials/slide-images-retry";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "@/server/credits/credit-service";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RegenerarImagensBody = MaterialEngineInput & {
  estrutura: MaterialEngineResponse;
};

async function handlePost(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
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
      { ok: false, message: "Retry de imagens disponível apenas para slides." },
      { status: 400 },
    );
  }

  const retryCost = Math.max(1, Math.round(getCreditCost(tipo) * 0.5));
  let chargedCost = 0;

  if (user?.id) {
    const spend = await spendCredits(user.id, tipo, user.email, retryCost);

    if (spend.status === "insufficient") {
      return NextResponse.json(
        {
          ok: false,
          code: "insufficient_credits",
          message:
            "Você não tem créditos suficientes para regenerar as imagens. Faça upgrade do plano para continuar.",
          balance: spend.balance,
          cost: spend.cost,
        },
        { status: 402 },
      );
    }

    if (spend.status === "ok") {
      chargedCost = spend.cost;
    }
  }

  try {
    const result = await regenerateFailedSlideImages(body, body.estrutura);

    if (result.imagesResolved === 0 && user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    return NextResponse.json({
      ok: true,
      html: result.html,
      estrutura: result.estrutura,
      imagesResolved: result.imagesResolved,
      creditCost: chargedCost || retryCost,
    });
  } catch (error) {
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

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
