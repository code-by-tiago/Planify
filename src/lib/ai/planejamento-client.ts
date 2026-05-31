import type {
  AIResponse,
  PlanejamentoAIInput,
  PlanejamentoAIOutput,
} from "../../types/ai";

export async function requestPlanejamentoAI(
  input: PlanejamentoAIInput,
): Promise<AIResponse<PlanejamentoAIOutput>> {
  const response = await fetch("/api/ai/planejamento", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = (await response.json()) as AIResponse<PlanejamentoAIOutput>;

  return json;
}
