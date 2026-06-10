import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  InclusaoEducationLevel,
  InclusaoModeId,
  InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";

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
): Promise<InclusaoGenerationResult> {
  const response = await planifyAuthenticatedFetch("/api/inclusao/adaptar", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    const error = new Error(
      data?.message || "Não foi possível gerar a adaptação inclusiva.",
    ) as Error & { code?: string; status?: number };
    error.code = data?.code;
    error.status = response.status;
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
