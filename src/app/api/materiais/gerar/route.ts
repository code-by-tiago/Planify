import { NextRequest, NextResponse } from "next/server";
import { generatePlanifyMaterial } from "../../../../server/materials/material-generation-orchestrator";
import type { MaterialEngineInput } from "../../../../server/materials/material-engine-types";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "../../../../server/credits/credit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Gerar slides pode incluir várias ilustrações por IA — concede mais tempo.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as
    | MaterialEngineInput
    | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = String(payload.tipoMaterial || payload.tipo || "");

  // Cobrança de créditos (falha aberta: só bloqueia quem tem carteira sem saldo).
  const user = await resolvePlanifyUserFromRequest(request);
  let chargedCost = 0;

  if (user) {
    const spend = await spendCredits(user.id, tipo);

    if (spend.status === "insufficient") {
      return NextResponse.json(
        {
          ok: false,
          code: "insufficient_credits",
          message:
            "Você não tem créditos suficientes neste ciclo. Faça upgrade do plano para continuar gerando materiais.",
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
    const result = await generatePlanifyMaterial(payload);

    if (!result.ok) {
      // Não consumiu de fato — devolve os créditos debitados.
      if (user && chargedCost > 0) {
        await refundCredits(user.id, chargedCost, tipo);
      }

      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      html: result.data.html,
      tipoMaterial: result.data.tipoMaterial,
      estrutura: result.data.estrutura,
      alertas: "alertas" in result.data ? result.data.alertas : [],
      pipeline: "pipeline" in result.data ? result.data.pipeline : "engine",
      creditCost: chargedCost || getCreditCost(tipo),
    });
  } catch (error) {
    if (user && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    const message =
      error instanceof Error ? error.message : "Erro inesperado ao gerar material.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
