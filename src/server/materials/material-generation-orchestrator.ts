import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import { generateMaterialWithAI } from "../ai/material-ai-service";
import type { MaterialAIInput, MaterialAIOutput } from "@/types/ai";
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
) {
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

export async function generatePlanifyMaterial(input: MaterialEngineInput) {
  const request = normalizeMaterialEngineRequest(input);
  const errors = validateMaterialEngineRequest(request);

  if (errors.length > 0) {
    return {
      ok: false as const,
      status: 400,
      message: errors[0],
    };
  }

  if (usesPlanifyMaterialEngine(request.tipoMaterial)) {
    return generateMaterialByEngine(input);
  }

  const aiInput = engineRequestToMaterialAI(request, input);

  try {
    const output = await generateWithAIQualityLoop(request, input, aiInput);
    const postIssues = getAIOutputIssues(request, output);
    const warn =
      postIssues.length > 0
        ? [
            "Alguns critérios de qualidade ainda precisam de revisão antes de aplicar em sala.",
            ...postIssues.slice(0, 8),
          ]
        : [];

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
