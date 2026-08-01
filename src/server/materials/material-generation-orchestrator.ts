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
import { buildQualityRetryPrompt } from "./material-engine-quality";
import { assessUnifiedQualityGate } from "@/lib/materiais/unified-quality-gate";
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
const ORCHESTRATOR_QUALITY_RETRY_THRESHOLD = 80;
const GENERATE_HEARTBEAT_MESSAGES = [
  "Gerando conteúdo…",
  "A IA está elaborando o material…",
  "Finalizando a geração…",
];

function enforceUnifiedQualityGate(
  delivery: UnifiedMaterialDelivery,
): GenerationSuccess | GenerationFailure {
  const gate = assessUnifiedQualityGate({
    qualityScore: delivery.qualityScore,
    qualityIssues: delivery.qualityIssues,
  });

  if (!gate.pass) {
    // Score baixo com conteúdo utilizável: entrega com aviso em vez de bloquear.
    if (gate.code === "quality_score_low" && delivery.html.trim().length > 0) {
      const alertas = [...(delivery.alertas ?? []), gate.message];
      return {
        ok: true,
        status: 200,
        data: { ...delivery, alertas },
      };
    }

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
      // Uma busca externa em cache miss não pode atrasar a entrega. Contexto
      // aprovado em cache continua sendo injetado; novas buscas seguem pelo
      // fluxo pedagógico explícito, fora da geração em tempo real.
      allowScrape: false,
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

  let heartbeatTick = 0;
  const heartbeat = setInterval(() => {
    heartbeatTick += 1;
    const message =
      GENERATE_HEARTBEAT_MESSAGES[
        heartbeatTick % GENERATE_HEARTBEAT_MESSAGES.length
      ];
    options?.onStage?.({
      ...buildStageEvent("generate", message),
      // A geração ainda está ativa. Atualizar a faixa evita que a interface
      // pare visualmente em 58% enquanto aguarda a resposta estruturada.
      progress: Math.min(72, 58 + heartbeatTick * 3),
    });
  }, GENERATE_HEARTBEAT_MS);

  let firstPass: Awaited<ReturnType<typeof generateMaterialByEngine>>;
  try {
    firstPass = await generateMaterialByEngine(input, {
      onStage: options?.onStage,
    });
  } finally {
    clearInterval(heartbeat);
  }

  if (!firstPass.ok) {
    return firstPass;
  }

  let engineData = firstPass.data;
  let pipeline: UnifiedDeliveryPipeline = request.elevarQualidade
    ? "engine-elevated"
    : "engine";

  const firstDelivery = finalizeUnifiedDelivery(
    {
      tipoMaterial: engineData.tipoMaterial,
      html: engineData.html,
      estrutura: engineData.estrutura,
      qualityScore: engineData.qualityScore,
      qualityIssues: engineData.qualityIssues,
      alertas: engineData.alertas,
    },
    pipeline,
    request,
  );

  const firstGate = assessUnifiedQualityGate({
    qualityScore: firstDelivery.qualityScore,
    qualityIssues: firstDelivery.qualityIssues,
  });

  const shouldRetryForQuality =
    !request.elevarQualidade &&
    firstGate.pass === false &&
    firstGate.code === "quality_score_low" &&
    (firstDelivery.qualityScore ?? 0) < ORCHESTRATOR_QUALITY_RETRY_THRESHOLD &&
    (firstDelivery.qualityIssues?.length ?? 0) > 0;

  if (shouldRetryForQuality) {
    emitStage(options, "generate", "Refinando qualidade do material…");
    const retryHint = buildQualityRetryPrompt(
      request,
      firstDelivery.qualityIssues ?? [],
    );
    const retryInput: MaterialEngineInput = {
      ...input,
      observacoes: [input.observacoes, retryHint].filter(Boolean).join("\n\n"),
    };

    const secondPass = await generateMaterialByEngine(retryInput, {
      onStage: options?.onStage,
    });

    if (secondPass.ok) {
      const secondScore = secondPass.data.qualityScore ?? 0;
      const firstScore = engineData.qualityScore ?? 0;
      if (secondScore >= firstScore) {
        engineData = secondPass.data;
        pipeline = "engine-elevated";
      }
    }
  }

  emitStage(options, "quality");
  return enforceUnifiedQualityGate(
    finalizeUnifiedDelivery(
      {
        tipoMaterial: engineData.tipoMaterial,
        html: engineData.html,
        estrutura: engineData.estrutura,
        qualityScore: engineData.qualityScore,
        qualityIssues: engineData.qualityIssues,
        alertas: engineData.alertas,
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
