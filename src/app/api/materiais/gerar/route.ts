import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import { generatePlanifyMaterial } from "../../../../server/materials/material-generation-orchestrator";
import type { MaterialEngineInput } from "../../../../server/materials/material-engine-types";
import { isDeepGenerationType } from "@/lib/ai/material-generation-policy";
import {
  consumeDeepGeneration,
  refundDeepGeneration,
} from "../../../../server/credits/daily-generation-service";
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
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

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

  const user = auth.access.user;
  let chargedCost = 0;
  let chargedDeepDaily = false;

  if (user?.id && isDeepGenerationType(tipo)) {
    const daily = await consumeDeepGeneration({
      userId: user.id,
      tipo,
      email: user.email,
    });

    if (daily.status === "limit_reached") {
      return NextResponse.json(
        {
          ok: false,
          code: "daily_limit_reached",
          message:
            `Você usou suas ${daily.limit} gerações profundas de hoje (materiais e planejamentos). A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia — ou gere flashcards e resumos, que não contam na cota.`,
          used: daily.used,
          limit: daily.limit,
        },
        { status: 429 },
      );
    }

    if (daily.status === "ok") {
      chargedDeepDaily = true;
    }
  }

  if (user?.id) {
    const spend = await spendCredits(user.id, tipo, user.email);

    if (spend.status === "insufficient") {
      if (chargedDeepDaily) {
        await refundDeepGeneration(user.id);
      }

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
      if (user?.id && chargedDeepDaily) {
        await refundDeepGeneration(user.id);
      }
      if (user?.id && chargedCost > 0) {
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
      qualityScore:
        "qualityScore" in result.data ? result.data.qualityScore : undefined,
      qualityIssues:
        "qualityIssues" in result.data ? result.data.qualityIssues : [],
      creditCost: chargedCost || getCreditCost(tipo),
    });
  } catch (error) {
    if (user?.id && chargedDeepDaily) {
      await refundDeepGeneration(user.id);
    }
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    const message =
      error instanceof Error ? error.message : "Erro inesperado ao gerar material.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
