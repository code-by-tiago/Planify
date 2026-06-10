import { NextRequest, NextResponse } from "next/server";
import { CORRECAO_GENERATION_TYPE } from "@/types/correction";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "@/server/credits/credit-service";
import { logGenerationComplete, bucketQualityScore } from "@/server/telemetry/generation-telemetry";
import {
  evaluateCorrectionWithAI,
  type CorrectionAiPayload,
} from "@/server/correcao/correction-ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  const payload = (await request.json().catch(() => null)) as CorrectionAiPayload | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = CORRECAO_GENERATION_TYPE;
  let chargedCost = 0;

  if (user?.id) {
    const spend = await spendCredits(user.id, tipo, user.email);

    if (spend.status === "insufficient") {
      return NextResponse.json(
        {
          ok: false,
          code: "insufficient_credits",
          message:
            "Você não tem créditos suficientes para corrigir com IA. Faça upgrade do plano.",
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

  const result = await evaluateCorrectionWithAI(payload);

  if (!result.ok) {
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo);
    }

    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status },
    );
  }

  logGenerationComplete({
    surface: "material",
    tipo,
    pipeline: "ai",
    qualityScoreBucket: bucketQualityScore(undefined),
    elevarQualidade: false,
    usedAI: true,
    dailyQuotaConsumed: false,
  });

  return NextResponse.json({
    ok: true,
    result: result.result,
    creditCost: chargedCost || getCreditCost(tipo),
  });
}
