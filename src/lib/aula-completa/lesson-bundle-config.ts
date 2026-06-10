import { getClientCreditCost } from "@/lib/credits/credit-costs";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Pacote padrão (modelo Teachy Aula Mágica): plano → slides → resumo → prática → avaliação */
export const DEFAULT_LESSON_BUNDLE_TOOLS: PlanifyToolId[] = [
  "plano-aula",
  "slides",
  "resumo",
  "lista",
  "atividade",
  "jogo",
  "prova",
  "projeto",
];

export const LESSON_BUNDLE_GENERATION_TYPE = "aula-completa";

const BUNDLE_DISCOUNT = 0.85;

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
      "PACOTE AULA COMPLETA — gere material coeso com os demais itens do pacote.",
      `Tema central: ${input.tema.trim()}.`,
      input.objetivo?.trim() ? `Objetivo: ${input.objetivo.trim()}.` : "",
      input.completedLabels.length
        ? `Materiais já gerados neste pacote:\n${input.completedLabels.map((l) => `- ${l}`).join("\n")}\nMantenha linguagem, exemplos e progressão alinhados.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  ].filter(Boolean);

  return parts.join("\n\n");
}
