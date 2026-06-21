import { getClientCreditCost } from "@/lib/credits/credit-costs";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/**
 * Pacote enxuto para sala de aula — fluxo natural:
 * planejar → apresentar → praticar → fixar com exercícios.
 */
export const DEFAULT_LESSON_BUNDLE_TOOLS: PlanifyToolId[] = [
  "plano-aula",
  "slides",
  "atividade",
  "lista",
];

/** Materiais opcionais que o professor pode acrescentar ao pacote. */
export const OPTIONAL_LESSON_BUNDLE_TOOLS: PlanifyToolId[] = [
  "resumo",
  "flashcards",
  "jogo",
  "prova",
  "mapa-mental",
];

/** Ferramentas que podem compor Aula Completa; impede recursão e itens incompatíveis. */
export const LESSON_BUNDLE_ALLOWED_TOOLS: readonly PlanifyToolId[] = [
  ...DEFAULT_LESSON_BUNDLE_TOOLS,
  ...OPTIONAL_LESSON_BUNDLE_TOOLS,
];

export function isLessonBundleTool(value: string): value is PlanifyToolId {
  return LESSON_BUNDLE_ALLOWED_TOOLS.includes(value as PlanifyToolId);
}

export function normalizeLessonBundleTools(
  tools?: PlanifyToolId[],
): { toolIds: PlanifyToolId[]; invalidToolIds: string[] } {
  const requested = tools?.length ? tools : DEFAULT_LESSON_BUNDLE_TOOLS;
  const invalidToolIds = requested.filter((toolId) => !isLessonBundleTool(toolId));
  const toolIds = [...new Set(requested.filter(isLessonBundleTool))];

  return { toolIds, invalidToolIds };
}

export const LESSON_BUNDLE_GENERATION_TYPE = "aula-completa";

const BUNDLE_DISCOUNT = 0.85;

/** Quantidades menores no pacote — mais rápido sem perder coerência pedagógica. */
export function getBundleQuantityForTool(toolId: PlanifyToolId): string | undefined {
  switch (toolId) {
    case "lista":
      return "5";
    case "prova":
      return "8";
    case "slides":
      return "8";
    case "atividade":
      return "1";
    default:
      return undefined;
  }
}

export function getLessonBundleCreditCost(toolIds: PlanifyToolId[]): number {
  const sum = toolIds.reduce((acc, id) => acc + getClientCreditCost(id), 0);
  return Math.max(1, Math.round(sum * BUNDLE_DISCOUNT));
}

export function buildLessonBundleObservacoes(input: {
  baseObservacoes?: string;
  tema: string;
  objetivo?: string;
  completedLabels: string[];
}): string {
  const parts = [
    input.baseObservacoes?.trim(),
    [
      "PACOTE AULA COMPLETA — gere material coeso, enxuto e pronto para aplicar em sala.",
      `Tema central: ${input.tema.trim()}.`,
      input.objetivo?.trim() ? `Objetivo: ${input.objetivo.trim()}.` : "",
      input.completedLabels.length
        ? `Materiais já gerados neste pacote:\n${input.completedLabels.map((l) => `- ${l}`).join("\n")}\nMantenha linguagem, exemplos e progressão alinhados.`
        : "",
      "Versão do pacote: objetiva, sem introduções longas; priorize aplicabilidade imediata em sala.",
    ]
      .filter(Boolean)
      .join("\n"),
  ];

  return parts.filter(Boolean).join("\n\n");
}
