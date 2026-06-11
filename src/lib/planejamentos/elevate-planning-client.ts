import {
  createGenerationTimeoutError,
  GENERATION_CLIENT_TIMEOUT_MS,
  isFetchTimeoutError,
} from "@/lib/pro/generation-timeout";
import type {
  PlanningAiPayload,
  PlanningAiResult,
} from "@/server/planejamentos/planning-ai-service";

export type PlanningGenerationApiResult = PlanningAiResult & {
  success?: boolean;
  code?: string;
  error?: { message?: string };
  materialId?: string | null;
  persistWarning?: string | null;
  alertas?: string[];
};

export async function requestPlanningGeneration(
  payload: PlanningAiPayload,
): Promise<PlanningGenerationApiResult> {
  let response: Response;
  try {
    response = await fetch("/api/planejamentos/gerar-ia", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(GENERATION_CLIENT_TIMEOUT_MS),
    });
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw createGenerationTimeoutError("planejamento");
    }
    throw error;
  }

  const data = (await response.json().catch(() => null)) as PlanningGenerationApiResult | null;

  if (!response.ok || !data?.success || !data?.planejamento) {
    const message = data?.error?.message || "Não foi possível gerar o planejamento.";
    const error = new Error(message) as Error & { code?: string; status?: number };
    if (data?.code) error.code = data.code;
    if (response.status === 504) error.code = "timeout";
    if (
      !data?.code &&
      response.status === 429 &&
      message.includes("gerações profundas")
    ) {
      error.code = "daily_limit_reached";
    }
    throw error;
  }

  return data;
}

export function buildElevatePlanningPayload(
  base: PlanningAiPayload,
  problemas: string[],
): PlanningAiPayload {
  return {
    ...base,
    elevarQualidade: true,
    problemasQualidade: problemas,
  };
}
