import { NextRequest } from "next/server";
import { humanizeGeminiError, resolveGeminiFailureCode } from "@/server/ai/gemini-client";
import { buildStageEvent } from "@/lib/generation/generation-pipeline-stages";
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
import {
  completeGenerationJob,
  createGenerationJob,
  failGenerationJob,
  updateGenerationJobStage,
} from "@/server/generation/generation-job-service";
import { autoPublishExamToQuestionBank } from "@/server/banco-questoes/question-bank-auto-publish";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";
import { withOperationalCapture } from "@/server/telemetry/with-operational-capture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function encodeEvent(event: MaterialStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function progressPhase(stage: string): "content" | "images" {
  return stage === "images" ? "images" : "content";
}

async function handlePost(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> },
) {
  const prepared = await prepareGenerationRequest<MaterialEngineInput>(request, {
    parsePayload: (raw) =>
      raw && typeof raw === "object" ? (raw as MaterialEngineInput) : null,
    resolveTipo: (payload) => String(payload.tipoMaterial || payload.tipo || ""),
  });

  if (!prepared.ok) return prepared.response;

  const { user, payload, tipo, charge } = prepared;

  if (!isMaterialStreamType(tipo)) {
    await finalizeGenerationFailure(user?.id, tipo, charge);
    return jsonGenerationValidationError("Tipo de material inválido para geração.");
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

      let jobId: string | undefined;

      try {
        try {
          const job = await createGenerationJob({
            userId: user?.id,
            surface: "material",
            tipo,
            payload: payload as Record<string, unknown>,
          });
          jobId = job.id;
        } catch {
          jobId = undefined;
        }

        const emitStage = (stage: ReturnType<typeof buildStageEvent>) => {
          emit({
            type: "progress",
            phase: progressPhase(stage.stage),
            message: stage.message,
            progress: stage.progress,
            stage: stage.stage,
            jobId,
          });
          if (jobId) {
            void updateGenerationJobStage(jobId, stage);
          }
        };

        const result = await generatePlanifyMaterial(payload, {
          userId: user?.id,
          onStage: emitStage,
        });

        if (!result.ok) {
          if (jobId) await failGenerationJob(jobId, result.message);
          await finalizeGenerationFailure(user?.id, tipo, charge, {
            eventType: "material_generation_failed",
            errorCode: String(result.status),
            metadata: { message: result.message },
          });
          emit({
            type: "error",
            message: result.message,
            code:
              result.errorCode ??
              (result.status === 422 ? "quality_gate_failed" : "ai_unavailable"),
            qualityScore: result.qualityScore,
            qualityIssues: result.qualityIssues,
          });
          controller.close();
          return;
        }

        emitStage(buildStageEvent("persist", "Salvando material..."));

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
          usedAI: !pipeline.startsWith("bank"),
          dailyQuotaConsumed: charge.chargedDeepDaily,
        });

        const estruturaResult = result.data.estrutura as MaterialEngineResponse | undefined;
        const examQuestions = estruturaResult?.exam?.questions ?? [];
        const tipoMaterial = String(result.data.tipoMaterial || tipo);

        if (
          user?.id &&
          examQuestions.length > 0 &&
          (tipoMaterial === "lista" || tipoMaterial === "prova") &&
          typeof qualityScore === "number"
        ) {
          void autoPublishExamToQuestionBank({
            userId: user.id,
            engineInput: payload,
            questions: examQuestions,
            qualityScore,
            pipeline,
          });
        }

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

        const completePayload = {
          type: "complete" as const,
          html: result.data.html,
          jobId,
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
        };

        if (jobId) {
          await completeGenerationJob(jobId, {
            pipeline,
            result: completePayload as unknown as Record<string, unknown>,
          });
        }

        emit(completePayload);
        emitStage(buildStageEvent("done"));
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "Erro inesperado ao gerar material.";
        const message = humanizeGeminiError(rawMessage);

        if (jobId) await failGenerationJob(jobId, message);

        await finalizeGenerationFailure(user?.id, tipo, charge, {
          eventType: "material_generation_failed",
          errorCode: "exception",
          metadata: { message },
        });

        emit({
          type: "error",
          message,
          code: resolveGeminiFailureCode(rawMessage),
        });
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
