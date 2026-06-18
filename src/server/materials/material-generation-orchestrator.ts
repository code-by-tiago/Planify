import { buildStageEvent } from "@/lib/generation/generation-pipeline-stages";
import type { GenerationStageEvent } from "@/lib/generation/generation-job-types";
import { humanizeGeminiError } from "@/server/ai/gemini-client";
import {
  prefetchQuestionBankContext,
  tryAssembleExamFromBank,
} from "./exam-bank-assembler";
import {
  buildBankFirstEngineHint,
  resolveQuestionBankFirstMode,
} from "./question-bank-first-policy";
import { generateMaterialByEngine } from "./material-engine-service";
import {
  assessUnifiedQualityGate,
  hasCriticalQualityIssues,
} from "@/lib/materiais/unified-quality-gate";
import {
  finalizeUnifiedDelivery,
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

const GENERATE_HEARTBEAT_MS = 12_000;
const GENERATE_HEARTBEAT_MESSAGES = [
  "Gerando conteúdo…",
  "A IA está elaborando o material…",
  "Finalizando a geração…",
];

function enforceUnifiedQualityGate(
  delivery: UnifiedMaterialDelivery,
  strict = false,
): GenerationSuccess | GenerationFailure {
  if (
    !strict &&
    !hasCriticalQualityIssues(delivery.qualityIssues ?? [])
  ) {
    return { ok: true, status: 200, data: delivery };
  }

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
  try {
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
        allowScrape: false,
      },
    );
  } catch (error) {
    console.warn(
      "[material-orchestrator] pedagogical context enrich failed:",
      error instanceof Error ? error.message : error,
    );
    return input;
  }
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
  let bank: Awaited<ReturnType<typeof tryAssembleExamFromBank>>;
  try {
    bank = await tryAssembleExamFromBank(input, {
      userId: options?.userId,
    });
  } catch (error) {
    console.warn(
      "[material-orchestrator] bank delivery failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }

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
    Boolean(request.elevarQualidade),
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

  let heartbeatTick = 0;
  const heartbeat = setInterval(() => {
    heartbeatTick += 1;
    emitStage(
      options,
      "generate",
      GENERATE_HEARTBEAT_MESSAGES[
        heartbeatTick % GENERATE_HEARTBEAT_MESSAGES.length
      ],
    );
  }, GENERATE_HEARTBEAT_MS);

  let result: Awaited<ReturnType<typeof generateMaterialByEngine>>;
  try {
    result = await generateMaterialByEngine(input);
  } finally {
    clearInterval(heartbeat);
  }

  if (!result.ok) {
    return result;
  }

  const pipeline: UnifiedDeliveryPipeline = request.elevarQualidade
    ? "engine-elevated"
    : "engine";

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
    Boolean(request.elevarQualidade),
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
  try {
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

    const engineResult = await runEngineDelivery(enrichedInput, request, options);
    return engineResult;
  } catch (error) {
    const message = humanizeGeminiError(
      error instanceof Error ? error.message : "Erro inesperado ao gerar material.",
    );
    console.warn("[material-orchestrator] generatePlanifyMaterial failed:", message);
    return {
      ok: false,
      status: 502,
      message,
    };
  }
}
