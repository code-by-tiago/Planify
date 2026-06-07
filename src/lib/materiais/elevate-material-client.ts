import type { MaterialEngineInput } from "@/server/materials/material-engine-types";

export type MaterialGenerationApiResult = {
  ok?: boolean;
  html?: string;
  estrutura?: unknown;
  alertas?: string[];
  pipeline?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  message?: string;
  code?: string;
  materialId?: string | null;
  persistWarning?: string | null;
};

export async function requestMaterialGeneration(
  payload: MaterialEngineInput,
): Promise<MaterialGenerationApiResult> {
  const response = await fetch("/api/materiais/gerar", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as MaterialGenerationApiResult | null;

  if (!response.ok || !data?.ok) {
    const message = data?.message || "Não foi possível gerar o material.";
    const error = new Error(message) as Error & { code?: string };
    if (data?.code) error.code = data.code;
    throw error;
  }

  return data;
}

export function buildElevatePayload(
  base: MaterialEngineInput,
  problemas: string[],
): MaterialEngineInput {
  return {
    ...base,
    elevarQualidade: true,
    problemasQualidade: problemas,
  };
}
