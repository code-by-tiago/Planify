import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { MaterialEngineInput, MaterialEngineResponse } from "@/server/materials/material-engine-types";

export type ExamBankMontarResult = {
  html: string;
  estrutura: MaterialEngineResponse;
  alertas: string[];
  pipeline: string;
  qualityScore: number;
  qualityIssues: string[];
  materialId: string | null;
  tipoMaterial: string;
};

export async function requestExamAssemblyFromBank(
  payload: MaterialEngineInput,
  questionIds: string[],
): Promise<ExamBankMontarResult> {
  const response = await planifyAuthenticatedFetch("/api/banco-questoes/montar", {
    method: "POST",
    body: JSON.stringify({ payload, questionIds }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(
      data?.message || "Não foi possível montar a lista a partir do banco.",
    );
  }

  return {
    html: String(data.html || ""),
    estrutura: data.estrutura as MaterialEngineResponse,
    alertas: Array.isArray(data.alertas) ? data.alertas.map(String) : [],
    pipeline: String(data.pipeline || "bank-selected"),
    qualityScore: Number(data.qualityScore || 0),
    qualityIssues: Array.isArray(data.qualityIssues)
      ? data.qualityIssues.map(String)
      : [],
    materialId: data.materialId ? String(data.materialId) : null,
    tipoMaterial: String(data.tipoMaterial || payload.tipoMaterial || "lista"),
  };
}
