import type { MaterialAIOutput } from "@/types/ai";

export type NormalizeMaterialEstruturaResult = {
  estrutura: MaterialAIOutput | null;
  hasQuestions: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasQuestionArray(value: unknown): value is { questoes: unknown[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.questoes) &&
    value.questoes.length > 0
  );
}

/**
 * Normaliza `response_json` de generated_materials em três caminhos:
 * 1. `estrutura` aninhada
 * 2. root com `questoes`
 * 3. vazio / sem questões
 */
export function normalizeMaterialEstrutura(
  responseJson: unknown,
): NormalizeMaterialEstruturaResult {
  if (!isRecord(responseJson)) {
    return { estrutura: null, hasQuestions: false };
  }

  if (isRecord(responseJson.estrutura)) {
    const estrutura = responseJson.estrutura as MaterialAIOutput;
    return {
      estrutura,
      hasQuestions: hasQuestionArray(estrutura),
    };
  }

  if (hasQuestionArray(responseJson)) {
    return {
      estrutura: responseJson as unknown as MaterialAIOutput,
      hasQuestions: true,
    };
  }

  return { estrutura: null, hasQuestions: false };
}

export function countQuestionsInResponseJson(responseJson: unknown): number {
  const { estrutura } = normalizeMaterialEstrutura(responseJson);
  return estrutura?.questoes?.length ?? 0;
}
