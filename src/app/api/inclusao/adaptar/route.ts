import { NextRequest, NextResponse } from "next/server";
import { INCLUSAO_GENERATION_TYPE } from "@/lib/inclusao/inclusao-config";
import { isDeepGenerationType } from "@/lib/ai/material-generation-policy";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  consumeDeepGeneration,
  refundDeepGeneration,
} from "@/server/credits/daily-generation-service";
import {
  getCreditCost,
  refundCredits,
  spendCredits,
} from "@/server/credits/credit-service";
import {
  generateInclusaoWithAI,
  type InclusaoAiPayload,
} from "@/server/inclusao/inclusao-ai-service";
import { logGenerationComplete, bucketQualityScore } from "@/server/telemetry/generation-telemetry";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia.";

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const user = auth.access.user;
  const payload = (await request.json().catch(() => null)) as
    | InclusaoAiPayload
    | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Requisição inválida." },
      { status: 400 },
    );
  }

  const tipo = INCLUSAO_GENERATION_TYPE;
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
          message: DAILY_LIMIT_MESSAGE.replace(
            "suas gerações profundas",
            `suas ${daily.limit} gerações profundas`,
          ),
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
            "Você não tem créditos suficientes neste ciclo. Faça upgrade do plano para continuar gerando.",
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
    const result = await generateInclusaoWithAI(payload);

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

    logGenerationComplete({
      surface: "material",
      tipo: `${tipo}:${payload.modo}`,
      pipeline: result.usedAI ? "inclusao-ai" : "inclusao-fallback",
      qualityScoreBucket: bucketQualityScore(undefined),
      elevarQualidade: false,
      usedAI: result.usedAI,
      dailyQuotaConsumed: chargedDeepDaily && result.usedAI,
    });

    if (user?.id) {
      persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "inclusao",
        tipo: `${tipo}:${payload.modo}`,
        classId: payload.classId || null,
        className: payload.className?.trim() || payload.turma?.trim() || null,
        discipline:
          payload.discipline?.trim() || payload.disciplina?.trim() || null,
        title: String(payload.conteudo || "Adaptação inclusiva").slice(0, 120),
        contentHtml: result.html,
        contentPreview: result.markdown,
        pipeline: result.usedAI ? "inclusao-ai" : "inclusao-fallback",
        payload: payload as unknown as Record<string, unknown>,
        result: {
          markdown: result.markdown,
          html: result.html,
          usedAI: result.usedAI,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      markdown: result.markdown,
      html: result.html,
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
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar adaptação inclusiva.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
