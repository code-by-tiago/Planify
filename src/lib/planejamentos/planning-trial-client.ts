import {
  createGenerationTimeoutError,
  GENERATION_CLIENT_TIMEOUT_MS,
  isFetchTimeoutError,
} from "@/lib/pro/generation-timeout";
import type {
  PlanningAiPayload,
  PlanningAiResult,
} from "@/server/planejamentos/planning-ai-service";

export type PlanningTrialStatus = {
  limited: boolean;
};

export type PlanningTrialGenerationResult = PlanningAiResult & {
  success?: boolean;
  code?: string;
  error?: { message?: string; code?: string };
  warning?: string;
  alertas?: string[];
};

export async function fetchPlanningTrialStatus(): Promise<PlanningTrialStatus> {
  const response = await fetch("/api/public/planning-trial/gerar", {
    method: "GET",
    credentials: "include",
  });

  const data = (await response.json().catch(() => null)) as {
    limited?: boolean;
  } | null;

  return { limited: Boolean(data?.limited) };
}

export async function requestPlanningTrialGeneration(
  payload: PlanningAiPayload,
): Promise<PlanningTrialGenerationResult> {
  let response: Response;

  try {
    response = await fetch("/api/public/planning-trial/gerar", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        tipoPlanejamento: "anual",
      }),
      signal: AbortSignal.timeout(GENERATION_CLIENT_TIMEOUT_MS),
    });
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw createGenerationTimeoutError("planejamento");
    }
    throw error;
  }

  const data = (await response.json().catch(() => null)) as PlanningTrialGenerationResult | null;

  if (!response.ok || !data?.success || !data?.planejamento) {
    const message =
      data?.error?.message ||
      (response.status === 429
        ? "Você já testou o planejamento grátis neste dispositivo."
        : "Não foi possível gerar o planejamento de teste.");

    const error = new Error(message) as Error & { code?: string; status?: number };
    error.status = response.status;
    if (data?.error?.code) error.code = data.error.code;
    if (response.status === 422 && !error.code) error.code = "quality_gate_failed";
    if (response.status === 429) error.code = "trial_limit_reached";
    throw error;
  }

  return data;
}

export function getPlanningTrialBnccSuggestUrl(): string {
  return "/api/public/planning-trial/sugerir-bncc";
}
