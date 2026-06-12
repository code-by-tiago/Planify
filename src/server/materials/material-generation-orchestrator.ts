import { buildStageEvent } from "@/lib/generation/generation-pipeline-stages";
import type { GenerationStageEvent } from "@/lib/generation/generation-job-types";
import {
  prefetchQuestionBankContext,
  tryAssembleExamFromBank,
} from "./exam-bank-assembler";
import {
  buildBankFirstEngineHint,
  resolveQuestionBankFirstMode,
} from "./question-bank-first-policy";
import { generateMaterialByEngine } from "./material-engine-service";
import { assessUnifiedQualityGate } from "@/lib/materiais/unified-quality-gate";
import {
  finalizeUnifiedDelivery,
  shouldAutoElevateQuality,
  type UnifiedDeliveryPipeline,
  type UnifiedMaterialDelivery,
} from "./material-unified-delivery";
import type { MaterialEngineInput } from "./material-engine-types";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "./material-engine-validation";

export type MaterialGenerationOptions = {
  userId?: string | null;
  onStage?: (stage: GenerationStageEvent) => void;
};

type GenerationSuccess = {
  ok: true;
  status: 200;
  data: UnifiedMaterialDelivery;
};

type GenerationFailure = {
  ok: false;
  status: number;
  message: string;
  errorCode?: string;
  qualityScore?: number;
  qualityIssues?: string[];
};

function enforceUnifiedQualityGate(
  delivery: UnifiedMaterialDelivery,
): GenerationSuccess | GenerationFailure {
  const gate = assessUnifiedQualityGate({
    qualityScore: delivery.qualityScore,
    qualityIssues: delivery.qualityIssues,
  });

  if (!gate.pass) {
    return {
      ok: false,
      status: 422,
      message: gate.message,
      errorCode: gate.code,
      qualityScore: gate.qualityScore,
      qualityIssues: gate.qualityIssues,
    };
  }

  return { ok: true, status: 200, data: delivery };
}

function emitStage(
  options: MaterialGenerationOptions | undefined,
  stage: GenerationStageEvent["stage"],
  message?: string,
) {
  options?.onStage?.(buildStageEvent(stage, message));
}

async function enrichInputWithPedagogicalContext(
  input: MaterialEngineInput,
  userId?: string | null,
): Promise<MaterialEngineInput> {
  const { enrichWithPedagogicalContext } = await import(
    "@/server/pedagogical-cache/enrich-with-pedagogical-context"
  );

  return enrichWithPedagogicalContext(
    input,
    {
      tema: String(input.tema || input.temaCentral || "").trim(),
      componenteCurricular: input.componenteCurricular || input.componente,
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      habilidadesSelecionadas: input.habilidadesSelecionadas,
      habilidadesBncc: input.habilidadesBncc,
    },
    {
      userId: userId ?? null,
      toolTipo: input.tipoMaterial || input.tipo || "material",
      allowScrape: true,
    },
  );
}

async function tryBankFullDelivery(
  input: MaterialEngineInput,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  options?: MaterialGenerationOptions,
): Promise<GenerationSuccess | GenerationFailure | null> {
  if (resolveQuestionBankFirstMode(request) !== "full") {
    return null;
  }

  emitStage(options, "bank", "Buscando questões no banco Planify…");
  const bank = await tryAssembleExamFromBank(input, {
    userId: options?.userId,
  });

  if (!bank.ok) {
    return null;
  }

  emitStage(options, "quality");
  return enforceUnifiedQualityGate(
    finalizeUnifiedDelivery(
      {
        tipoMaterial: request.tipoMaterial,
        html: bank.html,
        estrutura: bank.estrutura,
        alertas: bank.alertas,
        qualityScore: bank.qualityScore,
        qualityIssues: bank.qualityIssues,
      },
      bank.pipeline as UnifiedDeliveryPipeline,
      request,
    ),
  );
}

async function enrichInputWithBankPrefetch(
  input: MaterialEngineInput,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  options?: MaterialGenerationOptions,
): Promise<MaterialEngineInput> {
  if (resolveQuestionBankFirstMode(request) !== "prefetch") {
    return input;
  }

  emitStage(options, "bank", "Injetando questões fortes do banco no contexto…");
  const prefetch = await prefetchQuestionBankContext(input, {
    userId: options?.userId,
  });

  if (!prefetch?.bankCount) {
    return input;
  }

  const hint = buildBankFirstEngineHint("prefetch");
  const observacoes = [hint, input.observacoes, prefetch.observacoes]
    .filter(Boolean)
    .join("\n\n");

  return { ...input, observacoes };
}

async function runEngineDelivery(
  input: MaterialEngineInput,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  options?: MaterialGenerationOptions,
): Promise<GenerationSuccess | GenerationFailure> {
  emitStage(options, "generate");
  const firstPass = await generateMaterialByEngine(input);

  if (!firstPass.ok) {
    return firstPass;
  }

  let result = firstPass;
  let pipeline: UnifiedDeliveryPipeline = request.elevarQualidade
    ? "engine-elevated"
    : "engine";

  const firstScore = result.data.qualityScore ?? 0;
  const firstIssues = result.data.qualityIssues ?? [];

  if (shouldAutoElevateQuality(firstScore, Boolean(request.elevarQualidade))) {
    emitStage(options, "generate", "Reforçando qualidade automaticamente…");
    const elevated = await generateMaterialByEngine({
      ...input,
      elevarQualidade: true,
      problemasQualidade: firstIssues,
    });

    if (elevated.ok) {
      const elevatedScore = elevated.data.qualityScore ?? 0;
      if (elevatedScore >= firstScore) {
        result = elevated;
        pipeline = "engine-elevated";
      }
    }
  }

  emitStage(options, "quality");
  return enforceUnifiedQualityGate(
    finalizeUnifiedDelivery(
      {
        tipoMaterial: result.data.tipoMaterial,
        html: result.data.html,
        estrutura: result.data.estrutura,
        qualityScore: result.data.qualityScore,
        qualityIssues: result.data.qualityIssues,
        alertas: result.data.alertas,
      },
      pipeline,
      request,
    ),
  );
}

/**
 * Entrega unificada Planify — todas as ferramentas:
 * 1. Banco (quando aplicável) → 2. Contexto pedagógico → 3. Motor + qualidade máxima
 */
export async function generatePlanifyMaterial(
  input: MaterialEngineInput,
  options?: MaterialGenerationOptions,
): Promise<GenerationSuccess | GenerationFailure> {
  const request = normalizeMaterialEngineRequest(input);
  const errors = validateMaterialEngineRequest(request);

  if (errors.length > 0) {
    return {
      ok: false,
      status: 400,
      message: errors[0],
    };
  }

  emitStage(options, "prepare", "Preparando entrega unificada…");

  const bankDelivery = await tryBankFullDelivery(input, request, options);
  if (bankDelivery?.ok) {
    return bankDelivery;
  }

  emitStage(options, "context", "Enriquecendo contexto pedagógico…");
  const withBank = await enrichInputWithBankPrefetch(input, request, options);
  const enrichedInput = await enrichInputWithPedagogicalContext(
    withBank,
    options?.userId,
  );

  return runEngineDelivery(enrichedInput, request, options);
}
