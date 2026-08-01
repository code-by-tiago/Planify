import { NextRequest, NextResponse } from "next/server";
import type { CorrectionAiOutput } from "@/types/correction";
import { CORRECAO_GENERATION_TYPE } from "@/types/correction";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  logGenerationComplete,
  bucketQualityScore,
} from "@/server/telemetry/generation-telemetry";
import {
  evaluateCorrectionWithAI,
  type CorrectionAiPayload,
} from "@/server/correcao/correction-ai-service";
import {
  appendQualityRetryNote,
  runQualityRetry,
} from "@/server/generation/quality-retry";
import { assessCorrectionQuality } from "@/server/correcao/correction-quality";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const MAX_BATCH_SIZE = 5;

type BatchBody = CorrectionAiPayload & {
  respostas?: string[];
};

type CorrectionSuccess = Extract<
  Awaited<ReturnType<typeof evaluateCorrectionWithAI>>,
  { ok: true }
>;

async function evaluateWithQualityRetry(payload: CorrectionAiPayload) {
  const outcome = await runQualityRetry({
    input: payload,
    generate: async (input) => evaluateCorrectionWithAI(input),
    assess: (value) => assessCorrectionQuality(value.result),
    buildRetryInput: (input, issues) => ({
      ...input,
      rubrica: appendQualityRetryNote(input.rubrica, issues),
    }),
  });

  if (!outcome.ok) return outcome;

  return {
    ok: true as const,
    result: outcome.value.result,
    quality: outcome.quality,
    retried: outcome.retried,
  };
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

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
      { ok: false, message: `Maximo de ${MAX_BATCH_SIZE} respostas por lote.` },
      { status: 400 },
    );
  }

  try {
    const resultados: CorrectionAiOutput[] = [];
    const falhas: { index: number; message: string }[] = [];
    const qualityScores: number[] = [];
    let retriedCount = 0;

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

      const evaluated = await evaluateWithQualityRetry(payload);

      if (!evaluated.ok) {
        falhas.push({ index, message: evaluated.message });
        continue;
      }

      if (evaluated.retried) retriedCount += 1;

      if (!evaluated.quality.pass) {
        falhas.push({ index, message: evaluated.quality.message });
        continue;
      }

      resultados.push(evaluated.result);
      qualityScores.push(evaluated.quality.qualityScore);
    }

    if (!resultados.length) {
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
      tipo: CORRECAO_GENERATION_TYPE,
      pipeline:
        retriedCount > 0 ? "correcao-ai-batch-quality-retry" : "correcao-ai-batch",
      qualityScoreBucket: bucketQualityScore(avgQuality),
      elevarQualidade: retriedCount > 0,
      usedAI: true,
      dailyQuotaConsumed: false,
    });

    return NextResponse.json({
      ok: true,
      resultados,
      falhas,
      qualityScore: avgQuality,
      creditCost: 0,
    });
  } catch (error) {
    console.error("[correcao/avaliar-lote] unexpected failure:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro inesperado ao corrigir o lote. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "correcao-ia-lote" },
  handlePost,
);
