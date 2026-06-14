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
export const maxDuration = 180;

/** Lote: 1 crédito por resposta (transparente vs. correcao-ia unitário de 3). */
const BATCH_CREDIT_PER_RESPONSE = 1;
const MAX_BATCH_SIZE = 5;

type BatchBody = CorrectionAiPayload & {
  respostas?: string[];
};

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  const body = (await request.json().catch(() => null)) as BatchBody | null;

  if (!body || !Array.isArray(body.respostas)) {
    return NextResponse.json(
      { ok: false, message: "Informe um array respostas." },
      { status: 400 },
    );
  }

  const respostas = body.respostas
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

  if (!respostas.length) {
    return NextResponse.json(
      { ok: false, message: "Informe ao menos uma resposta." },
      { status: 400 },
    );
  }

  if (respostas.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { ok: false, message: `Máximo de ${MAX_BATCH_SIZE} respostas por lote.` },
      { status: 400 },
    );
  }

  const tipo = CORRECAO_GENERATION_TYPE;
  const totalCost = respostas.length * BATCH_CREDIT_PER_RESPONSE;
  let chargedCost = 0;

  try {
    if (user?.id) {
      const spend = await spendCredits(
        user.id,
        tipo,
        user.email,
        totalCost,
      );

      if (spend.status === "insufficient") {
        return NextResponse.json(
          {
            ok: false,
            code: "insufficient_credits",
            message: `Você precisa de ${totalCost} crédito(s) para corrigir ${respostas.length} resposta(s).`,
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

    const resultados: import("@/types/correction").CorrectionAiOutput[] = [];

    const falhas: { index: number; message: string }[] = [];
    let successCount = 0;
    const qualityScores: number[] = [];

    for (let index = 0; index < respostas.length; index += 1) {
      const payload: CorrectionAiPayload = {
        respostaAluno: respostas[index],
        enunciado: body.enunciado,
        gabarito: body.gabarito,
        rubrica: body.rubrica,
        componente: body.componente,
        anoSerie: body.anoSerie,
        tema: body.tema,
        notaMaxima: body.notaMaxima,
        teacherProfile: body.teacherProfile,
      };

      const result = await evaluateCorrectionWithAI(payload);

      if (result.ok) {
        const quality = assessCorrectionQuality(result.result);
        if (!quality.pass) {
          falhas.push({ index, message: quality.message });
          continue;
        }

        resultados.push(result.result);
        qualityScores.push(quality.qualityScore);
        successCount += 1;
      } else {
        falhas.push({ index, message: result.message });
      }
    }

    const failedCount = falhas.length;
    if (user?.id && chargedCost > 0 && failedCount > 0) {
      const refundAmount = failedCount * BATCH_CREDIT_PER_RESPONSE;
      await refundCredits(user.id, refundAmount, tipo);
    }

    if (successCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: falhas[0]?.message || "Nenhuma resposta foi corrigida.",
          falhas,
        },
        { status: 422 },
      );
    }

    const avgQuality =
      qualityScores.length > 0
        ? Math.round(
            qualityScores.reduce((sum, score) => sum + score, 0) /
              qualityScores.length,
          )
        : undefined;

    logGenerationComplete({
      surface: "material",
      tipo,
      pipeline: "correcao-ai-batch",
      qualityScoreBucket: bucketQualityScore(avgQuality),
      elevarQualidade: false,
      usedAI: true,
      dailyQuotaConsumed: false,
    });

    return NextResponse.json({
      ok: true,
      resultados,
      falhas,
      qualityScore: avgQuality,
      creditCost: successCount * BATCH_CREDIT_PER_RESPONSE || getCreditCost(tipo),
    });
  } catch (error) {
    if (user?.id && chargedCost > 0) {
      await refundCredits(user.id, chargedCost, tipo).catch(() => null);
    }

    console.error("[correcao/avaliar-lote] unexpected failure:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro inesperado ao corrigir o lote. Seus créditos foram estornados.",
      },
      { status: 500 },
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "correcao-ia-lote" },
  handlePost,
);
