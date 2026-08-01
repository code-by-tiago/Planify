import type {
  AIResponse,
  MaterialAIInput,
  MaterialAIOutput,
} from "../../types/ai";

export async function requestMaterialAI(
  input: MaterialAIInput,
): Promise<AIResponse<MaterialAIOutput>> {
  const response = await fetch("/api/ai/material", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const json = (await response.json()) as AIResponse<MaterialAIOutput>;

  return json;
}
