import { NextRequest, NextResponse } from "next/server";
import { generatePlanifyMaterial } from "../../../../server/materials/material-generation-orchestrator";
import type { MaterialEngineInput } from "../../../../server/materials/material-engine-types";
import { persistGeneratedMaterialBestEffort } from "../../../../server/materials/persist-generated-material";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "../../../../server/materials/material-engine-validation";
import {
  finalizeGenerationFailure,
  logGenerationSuccessEvent,
  prepareGenerationRequest,
  resolveGenerationCreditCost,
} from "@/server/generation/generation-api-shared";
import { jsonGenerationValidationError } from "@/server/generation/generation-api-contract";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handlePost(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  const prepared = await prepareGenerationRequest<MaterialEngineInput>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as MaterialEngineInput) : null,
    resolveTipo: (payload) => String(payload.tipoMaterial || payload.tipo || ""),
    dailyLimitMessage:
      "Você usou suas gerações profundas de hoje (materiais e planejamentos). A cota reinicia à meia-noite (horário de Brasília). Faça upgrade para Premium e tenha até 5 por dia — ou gere flashcards e resumos, que não contam na cota.",
    insufficientCreditsMessage:
      "Você não tem créditos suficientes neste ciclo. Faça upgrade do plano para continuar gerando materiais.",
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;
  const normalizedRequest = normalizeMaterialEngineRequest(payload);
  const validationErrors = validateMaterialEngineRequest(normalizedRequest);

  if (validationErrors.length > 0) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "material_generation_failed",
      errorCode: "validation_error",
    });
    return jsonGenerationValidationError(validationErrors[0]);
  }

  try {
    const result = await generatePlanifyMaterial(payload, { userId: user?.id });

    if (!result.ok) {
      // #region agent log
      try {
        const { appendFileSync } = await import("node:fs");
        const { join } = await import("node:path");
        appendFileSync(
          join(process.cwd(), "debug-0e58e7.log"),
          `${JSON.stringify({
            sessionId: "0e58e7",
            hypothesisId: "H3",
            location: "api/materiais/gerar:handlePost",
            message: "generation failed",
            data: {
              tipo,
              status: result.status,
              errorMessage: result.message,
            },
            timestamp: Date.now(),
          })}\n`,
        );
      } catch {
        /* debug log optional */
      }
      // #endregion

      await finalizeGenerationFailure(user?.id, tipo, charge, {
        eventType: "material_generation_failed",
        errorCode: String(result.status),
        metadata: { message: result.message },
      });

      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.status },
      );
    }

    const pipeline =
      "pipeline" in result.data ? String(result.data.pipeline) : "engine";
    const qualityScore =
      "qualityScore" in result.data ? result.data.qualityScore : undefined;

    logGenerationSuccessEvent({
      surface: "material",
      tipo: String(result.data.tipoMaterial || tipo),
      pipeline,
      qualityScore: typeof qualityScore === "number" ? qualityScore : undefined,
      elevarQualidade: payload.elevarQualidade === true,
      usedAI: pipeline !== "engine-fallback",
      dailyQuotaConsumed: charge.chargedDeepDaily,
    });

    let materialId: string | null = null;
    if (user?.id) {
      materialId = await persistGeneratedMaterialBestEffort({
        userId: user.id,
        surface: "material",
        tipo: String(result.data.tipoMaterial || tipo),
        classId: payload.classId || null,
        className: payload.className?.trim() || payload.turma?.trim() || null,
        discipline:
          payload.discipline?.trim() ||
          payload.disciplina?.trim() ||
          payload.componenteCurricular?.trim() ||
          payload.componente?.trim() ||
          null,
        contentHtml: result.data.html,
        pipeline,
        qualityScore: typeof qualityScore === "number" ? qualityScore : null,
        payload: payload as Record<string, unknown>,
        result: result.data as Record<string, unknown>,
      });
    }

    const baseAlertas =
      "alertas" in result.data && Array.isArray(result.data.alertas)
        ? result.data.alertas.map((item) => String(item)).filter(Boolean)
        : [];
    const persistWarning =
      user?.id && !materialId
        ? "O material foi gerado, mas não foi possível registrá-lo no Progresso BNCC. Tente gerar novamente em instantes."
        : null;

    return NextResponse.json({
      ok: true,
      html: result.data.html,
      tipoMaterial: result.data.tipoMaterial,
      estrutura: result.data.estrutura,
      alertas: persistWarning ? [...baseAlertas, persistWarning] : baseAlertas,
      pipeline,
      qualityScore,
      qualityIssues:
        "qualityIssues" in result.data ? result.data.qualityIssues : [],
      creditCost: resolveGenerationCreditCost(charge, tipo),
      materialId,
      persistWarning,
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
      error instanceof Error ? error.message : "Erro inesperado ao gerar material.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "material" },
  handlePost,
);
