import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";

export type ExamQuestionsRetryResult = {
  html: string;
  estrutura: MaterialEngineResponse;
  questionsResolved: number;
  qualityScore?: number;
  qualityIssues?: string[];
  creditCost?: number;
};

export async function requestExamQuestionsRetry(
  payload: MaterialEngineInput & { estrutura: MaterialEngineResponse },
): Promise<ExamQuestionsRetryResult> {
  const response = await planifyAuthenticatedFetch("/api/materiais/regenerar-questoes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | (ExamQuestionsRetryResult & { ok?: boolean; message?: string; code?: string })
    | null;

  if (!response.ok || !data?.ok) {
    const message = data?.message || "Não foi possível regenerar as questões.";
    const error = new Error(message) as Error & { code?: string; status?: number };
    if (data?.code) error.code = data.code;
    error.status = response.status;
    throw error;
  }

  return {
    html: data.html,
    estrutura: data.estrutura,
    questionsResolved: data.questionsResolved,
    qualityScore: data.qualityScore,
    qualityIssues: data.qualityIssues,
    creditCost: data.creditCost,
  };
}
