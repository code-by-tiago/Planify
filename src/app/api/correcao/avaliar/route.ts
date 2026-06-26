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
import { assessCorrectionQuality } from "@/server/correcao/correction-quality";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
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

  try {
    if (user?.id) {
      const spend = await spendCredits(user.id, tipo, user.email);

      if (spend.status === "insufficient") {
        return NextResponse.json(
          {
            ok: false,
            code: "insufficient_credits",
            message:
              "Você não tem créditos suficientes neste ciclo. Aguarde a renovação mensal ou fale com o suporte.",
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

    const quality = assessCorrectionQuality(result.result);
    if (!quality.pass) {
      if (user?.id && chargedCost > 0) {
        await refundCredits(user.id, chargedCost, tipo);
      }

      return NextResponse.json(
        {
          ok: false,
          code: "quality_gate",
          message: quality.message,
          qualityScore: quality.qualityScore,
          qualityIssues: quality.qualityIssues,
        },
        { status: 422 },
      );
    }

    logGenerationComplete({
      surface: "material",
      tipo,
      pipeline: "correcao-ai",
      qualityScoreBucket: bucketQualityScore(quality.qualityScore),
      elevarQualidade: false,
      usedAI: true,
      dailyQuotaConsumed: false,
    });

    return NextResponse.json({
      ok: true,
      result: result.result,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.qualityIssues,
      creditCost: 0,
    });
  } catch (error) {
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo).catch(() => null);
    }

    console.error("[correcao/avaliar] unexpected failure:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro inesperado ao corrigir. Seus créditos foram estornados.",
      },
      { status: 500 },
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "correcao-ia" },
  handlePost,
);
