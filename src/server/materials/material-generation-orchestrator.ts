import { buildStageEvent } from "@/lib/generation/generation-pipeline-stages";
import type { GenerationStageEvent } from "@/lib/generation/generation-job-types";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import { generateMaterialWithAI } from "../ai/material-ai-service";
import type { MaterialAIInput, MaterialAIOutput } from "@/types/ai";
import { tryAssembleExamFromBank } from "./exam-bank-assembler";
import { generateMaterialByEngine } from "./material-engine-service";
import { renderMaterialAIOutputToHtml } from "./material-ai-html-renderer";
import { engineRequestToMaterialAI } from "./material-input-adapter";
import {
  buildAIQualityRetryObservacoes,
  getAIOutputIssues,
} from "./material-ai-output-quality";
import { usesPlanifyMaterialEngine } from "./planify-material-routing";
import type { MaterialEngineInput } from "./material-engine-types";
import {
  normalizeMaterialEngineRequest,
  validateMaterialEngineRequest,
} from "./material-engine-validation";

const AI_MAX_ATTEMPTS = 3;

export type MaterialGenerationOptions = {
  userId?: string | null;
  onStage?: (stage: GenerationStageEvent) => void;
};

function emitStage(
  options: MaterialGenerationOptions | undefined,
  stage: GenerationStageEvent["stage"],
  message?: string,
) {
  options?.onStage?.(buildStageEvent(stage, message));
}

function isClientValidationError(message: string): boolean {
  return (
    message.includes("Informe") ||
    message.includes("Selecione") ||
    message.includes("Envie") ||
    message.includes("Dados") ||
    message.includes("inválido")
  );
}

async function generateWithAIQualityLoop(
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  input: MaterialEngineInput,
  baseAiInput: MaterialAIInput,
): Promise<MaterialAIOutput> {
  let retryNotes = "";

  for (let attempt = 0; attempt < AI_MAX_ATTEMPTS; attempt += 1) {
    const aiInput: MaterialAIInput = {
      ...baseAiInput,
      observacoes: [baseAiInput.observacoes, retryNotes]
        .filter(Boolean)
        .join("\n\n"),
    };

    const output = await generateMaterialWithAI(aiInput);
    const issues = getAIOutputIssues(request, output);

    if (!issues.length || attempt === AI_MAX_ATTEMPTS - 1) {
      return output;
    }

    retryNotes = buildAIQualityRetryObservacoes(request, issues);
  }

  return generateMaterialWithAI(baseAiInput);
}

function successFromAI(
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  output: MaterialAIOutput,
  pipeline: "ai" | "engine-fallback",
  extraAlertas: string[] = [],
  qualityIssues: string[] = [],
) {
  const html = renderMaterialAIOutputToHtml(output, request);
  const alertas = [
    ...(output.alertas ?? []),
    ...extraAlertas,
  ].filter(Boolean);
  const qualityScore = computeQualityScore(qualityIssues, alertas);

  return {
    ok: true as const,
    status: 200,
    data: {
      tipoMaterial: request.tipoMaterial,
      html,
      estrutura: output,
      alertas,
      pipeline,
      qualityScore,
      qualityIssues,
    },
  };
}

async function fallbackToEngine(
  input: MaterialEngineInput,
  reason: string,
  options?: MaterialGenerationOptions,
) {
  emitStage(options, "generate", "Gerando com motor estruturado…");
  const engineResult = await generateMaterialByEngine(input);

  if (!engineResult.ok) {
    return engineResult;
  }

  const fallbackIssues =
    "qualityIssues" in engineResult.data
      ? (engineResult.data.qualityIssues as string[])
      : [];
  const fallbackAlertas = [
    `O motor pedagógico auxiliar assumiu a entrega: ${reason}`,
  ];

  emitStage(options, "quality");

  return {
    ok: true as const,
    status: 200,
    data: {
      ...engineResult.data,
      alertas: fallbackAlertas,
      pipeline: "engine-fallback" as const,
      qualityScore:
        "qualityScore" in engineResult.data
          ? engineResult.data.qualityScore
          : computeQualityScore(fallbackIssues, fallbackAlertas),
      qualityIssues: fallbackIssues,
    },
  };
}

async function enrichInputWithPedagogicalContext(
  input: MaterialEngineInput,
  userId?: string | null,
  allowScrape = true,
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
      allowScrape,
    },
  );
}

async function tryBankPath(
  input: MaterialEngineInput,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  options?: MaterialGenerationOptions,
) {
  if (request.tipoMaterial !== "lista" && request.tipoMaterial !== "prova") {
    return null;
  }

  if (request.elevarQualidade) {
    return null;
  }

  emitStage(options, "bank");
  const bank = await tryAssembleExamFromBank(input, {
    userId: options?.userId,
  });

  if (!bank.ok) {
    return null;
  }

  emitStage(options, "quality");
  return {
    ok: true as const,
    status: 200,
    data: {
      tipoMaterial: request.tipoMaterial,
      html: bank.html,
      estrutura: bank.estrutura,
      alertas: bank.alertas,
      pipeline: bank.pipeline,
      qualityScore: bank.qualityScore,
      qualityIssues: bank.qualityIssues,
    },
  };
}

export async function generatePlanifyMaterial(
  input: MaterialEngineInput,
  options?: MaterialGenerationOptions,
) {
  const request = normalizeMaterialEngineRequest(input);
  const errors = validateMaterialEngineRequest(request);

  if (errors.length > 0) {
    return {
      ok: false as const,
      status: 400,
      message: errors[0],
    };
  }

  emitStage(options, "prepare");

  const bankResult = await tryBankPath(input, request, options);
  if (bankResult) {
    return bankResult;
  }

  emitStage(options, "context");
  const enrichedInput = await enrichInputWithPedagogicalContext(
    input,
    options?.userId,
    true,
  );

  if (usesPlanifyMaterialEngine(request.tipoMaterial)) {
    emitStage(options, "generate");
    const engineResult = await generateMaterialByEngine(enrichedInput);
    if (engineResult.ok) {
      emitStage(options, "quality");
    }
    return engineResult;
  }

  const aiInput = engineRequestToMaterialAI(request, enrichedInput);

  try {
    emitStage(options, "generate");
    const output = await generateWithAIQualityLoop(request, input, aiInput);
    const postIssues = getAIOutputIssues(request, output);
    const criticalTypes = new Set(["prova", "lista", "apostila", "atividade"]);
    const warn =
      postIssues.length > 0
        ? criticalTypes.has(request.tipoMaterial)
          ? [
              "Passo crítico: a IA não resolveu todos os critérios após 3 tentativas.",
              "Regenere o material ou use Elevar qualidade antes de imprimir ou aplicar em sala.",
              ...postIssues.slice(0, 8),
            ]
          : [
              "Alguns critérios de qualidade ainda precisam de revisão antes de aplicar em sala.",
              ...postIssues.slice(0, 8),
            ]
        : [];

    emitStage(options, "quality");
    return successFromAI(request, output, "ai", warn, postIssues);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "A IA não conseguiu gerar o material. Tente novamente.";

    if (isClientValidationError(message)) {
      return {
        ok: false as const,
        status: 400,
        message,
      };
    }

    const fallback = await fallbackToEngine(
      input,
      "a geração principal falhou; usamos o motor estruturado como alternativa.",
      options,
    );

    if (fallback.ok) {
      return fallback;
    }

    return {
      ok: false as const,
      status: 502,
      message,
    };
  }
}
