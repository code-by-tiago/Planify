import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  InclusaoEducationLevel,
  InclusaoModeId,
  InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";
import {
  createGenerationTimeoutError,
  GENERATION_CLIENT_TIMEOUT_MS,
  isFetchTimeoutError,
  withGenerationTimeoutSignal,
} from "@/lib/pro/generation-timeout";

export type InclusaoGenerationPayload = {
  modo: InclusaoModeId;
  necessidade: InclusaoNeedId;
  etapaEnsino: InclusaoEducationLevel;
  conteudo: string;
  observacoes?: string;
  classId?: string | null;
  className?: string | null;
  turma?: string | null;
  discipline?: string | null;
  disciplina?: string | null;
};

export type InclusaoGenerationResult = {
  ok: true;
  markdown: string;
  html: string;
  creditCost?: number;
};

export class InclusaoGenerationError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "InclusaoGenerationError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function requestInclusaoGeneration(
  payload: InclusaoGenerationPayload,
  options?: { signal?: AbortSignal },
): Promise<InclusaoGenerationResult> {
  const signal = withGenerationTimeoutSignal(
    options?.signal,
    GENERATION_CLIENT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await planifyAuthenticatedFetch("/api/inclusao/adaptar", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw createGenerationTimeoutError("inclusao");
    }
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const error = new Error(
      data?.message || "Não foi possível gerar a adaptação inclusiva.",
    ) as Error & { code?: string; status?: number };
    error.code = data?.code;
    error.status = response.status;
    if (response.status === 504) error.code = "timeout";
    throw error;
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    ok: true,
    markdown: String(data.markdown || ""),
    html: String(data.html || ""),
    creditCost: typeof data.creditCost === "number" ? data.creditCost : undefined,
  };
}
