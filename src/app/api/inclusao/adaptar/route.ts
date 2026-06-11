import { NextRequest, NextResponse } from "next/server";
import { INCLUSAO_GENERATION_TYPE } from "@/lib/inclusao/inclusao-config";
import {
  generateInclusaoWithAI,
  type InclusaoAiPayload,
} from "@/server/inclusao/inclusao-ai-service";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";
import {
  finalizeGenerationFailure,
  logGenerationSuccessEvent,
  prepareGenerationRequest,
  resolveGenerationCreditCost,
} from "@/server/generation/generation-api-shared";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAILY_LIMIT_MESSAGE =
  "Você usou suas gerações profundas de hoje. A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia.";

async function handlePost(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  const prepared = await prepareGenerationRequest<InclusaoAiPayload>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as InclusaoAiPayload) : null,
    resolveTipo: () => INCLUSAO_GENERATION_TYPE,
    dailyLimitMessage: DAILY_LIMIT_MESSAGE,
    insufficientCreditsMessage:
      "Você não tem créditos suficientes neste ciclo. Faça upgrade do plano para continuar gerando.",
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;

  try {
    const result = await generateInclusaoWithAI(payload, { userId: user?.id ?? null });

    if (!result.ok) {
      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: String(result.status),
        metadata: { message: result.message, modo: payload.modo },
      });

      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    logGenerationSuccessEvent({
      surface: "material",
      tipo: `${tipo}:${payload.modo}`,
      pipeline: result.usedAI ? "inclusao-ai" : "inclusao-fallback",
      elevarQualidade: false,
      usedAI: result.usedAI,
      dailyQuotaConsumed: charge.chargedDeepDaily && result.usedAI,
    });

    if (user?.id) {
      await persistGeneratedMaterialBestEffort({
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
      creditCost: resolveGenerationCreditCost(charge, tipo),
    });
  } catch (error) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "material_generation_failed",
      errorCode: "exception",
      metadata: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao gerar adaptação inclusiva.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "inclusao" },
  handlePost,
);
