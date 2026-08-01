import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  createGenerationTimeoutError,
  GENERATION_CLIENT_TIMEOUT_MS,
  isFetchTimeoutError,
  withGenerationTimeoutSignal,
} from "@/lib/pro/generation-timeout";
import type {
  PeiGenerationRequest,
  PeiGenerationResult,
} from "@/lib/pei/pei-options";

export async function requestPeiGeneration(
  payload: PeiGenerationRequest,
  options?: { signal?: AbortSignal },
): Promise<PeiGenerationResult> {
  const signal = withGenerationTimeoutSignal(
    options?.signal,
    GENERATION_CLIENT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await planifyAuthenticatedFetch("/api/pei/gerar", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw createGenerationTimeoutError("pei");
    }
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const error = new Error(
      data?.message || "Não foi possível gerar o PEI.",
    ) as Error & { code?: string; status?: number };
    error.code = data?.code;
    error.status = response.status;
    if (response.status === 504) error.code = "timeout";
    throw error;
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    ok: true,
    html: String(data.html || ""),
    parecer: String(data.parecer || ""),
    title: String(data.title || "PEI"),
    pipeline: data.pipeline === "pei-ai" ? "pei-ai" : "pei-fallback",
    qualityScore:
      typeof data.qualityScore === "number" ? data.qualityScore : 0,
    alertas: Array.isArray(data.alertas)
      ? data.alertas.map(String).filter(Boolean)
      : [],
    creditCost:
      typeof data.creditCost === "number" ? data.creditCost : undefined,
    materialId:
      typeof data.materialId === "string" ? data.materialId : null,
  };
}
