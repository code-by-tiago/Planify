import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { CorrectionAiOutput, TeacherCorrectionProfile } from "@/types/correction";

export type CorrectionPayload = {
  respostaAluno: string;
  enunciado?: string;
  gabarito?: string;
  rubrica?: string;
  componente?: string;
  anoSerie?: string;
  tema?: string;
  notaMaxima?: number;
  teacherProfile?: TeacherCorrectionProfile;
};

export type CorrectionResult = {
  ok: true;
  result: CorrectionAiOutput;
  creditCost: number;
};

export class CorrectionError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "CorrectionError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function requestCorrection(
  payload: CorrectionPayload,
): Promise<CorrectionResult> {
  const response = await planifyAuthenticatedFetch("/api/correcao/avaliar", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new CorrectionError(
      data?.message || "Não foi possível corrigir a resposta.",
      { code: data?.code, status: response.status },
    );
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    ok: true,
    result: data.result as CorrectionAiOutput,
    creditCost: Number(data.creditCost || 0),
  };
}

export type BatchCorrectionResult = {
  ok: true;
  resultados: CorrectionAiOutput[];
  falhas: { index: number; message: string }[];
  creditCost: number;
};

export async function requestBatchCorrection(
  payload: Omit<CorrectionPayload, "respostaAluno"> & { respostas: string[] },
): Promise<BatchCorrectionResult> {
  const response = await planifyAuthenticatedFetch("/api/correcao/avaliar-lote", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new CorrectionError(
      data?.message || "Não foi possível corrigir as respostas.",
      { code: data?.code, status: response.status },
    );
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    ok: true,
    resultados: data.resultados as CorrectionAiOutput[],
    falhas: Array.isArray(data.falhas) ? data.falhas : [],
    creditCost: Number(data.creditCost || 0),
  };
}
