import { NextRequest } from "next/server";
import type { MaterialStreamEvent, MaterialStreamCompleteEvent } from "@/lib/materiais/material-stream-types";
import { isMaterialStreamType } from "@/lib/materiais/material-stream-types";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import { generatePlanifyMaterial } from "@/server/materials/material-generation-orchestrator";
import { persistGeneratedMaterialBestEffort } from "@/server/materials/persist-generated-material";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "@/server/materials/material-engine-validation";
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

function encodeEvent(event: MaterialStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

async function handlePost(request: NextRequest, _context: { params: Promise<Record<string, string>> }) {
  const prepared = await prepareGenerationRequest<MaterialEngineInput>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as MaterialEngineInput) : null,
    resolveTipo: (payload) => String(payload.tipoMaterial || payload.tipo || ""),
    dailyLimitMessage:
      "Você usou suas gerações profundas de hoje (materiais e planejamentos). A cota reinicia à meia-noite (horário de Brasília).",
    insufficientCreditsMessage:
      "Você não tem créditos suficientes neste ciclo. Faça upgrade do plano para continuar gerando materiais.",
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;

  if (!isMaterialStreamType(tipo)) {
    await finalizeGenerationFailure(user?.id, tipo, charge);
    return jsonGenerationValidationError(
      "Streaming disponível apenas para slides, prova e apostila.",
    );
  }

  const normalizedRequest = normalizeMaterialEngineRequest(payload);
  const validationErrors = validateMaterialEngineRequest(normalizedRequest);

  if (validationErrors.length > 0) {
    await finalizeGenerationFailure(user?.id, tipo, charge, {
      eventType: "material_generation_failed",
      errorCode: "validation_error",
    });
    return jsonGenerationValidationError(validationErrors[0]);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: MaterialStreamEvent) => {
        controller.enqueue(encodeEvent(event));
      };

      try {
        emit({
          type: "progress",
          phase: "content",
          message: "Gerando conteúdo…",
        });

        const result = await generatePlanifyMaterial(payload);

        if (!result.ok) {
          await finalizeGenerationFailure(user?.id, tipo, charge, {
            eventType: "material_generation_failed",
            errorCode: String(result.status),
            metadata: { message: result.message },
          });
          emit({ type: "error", message: result.message });
          controller.close();
          return;
        }

        if (tipo === "slides") {
          emit({
            type: "progress",
            phase: "images",
            message: "Resolvendo imagens…",
          });
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

        emit({
          type: "complete",
          html: result.data.html,
          tipoMaterial: String(result.data.tipoMaterial || tipo),
          estrutura: result.data.estrutura as MaterialStreamCompleteEvent["estrutura"],
          alertas: persistWarning ? [...baseAlertas, persistWarning] : baseAlertas,
          pipeline,
          qualityScore: typeof qualityScore === "number" ? qualityScore : undefined,
          qualityIssues:
            "qualityIssues" in result.data
              ? (result.data.qualityIssues as string[])
              : [],
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
        emit({ type: "error", message, code: "server_error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}

export const POST = withOperationalCapture(
  { eventType: "material_generation_failed", toolTipo: "material-stream" },
  handlePost,
);
