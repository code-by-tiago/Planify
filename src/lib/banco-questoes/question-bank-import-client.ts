import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { QuestionBankItem } from "@/types/question-bank";

export type ImportableQuestionSource = {
  id: string;
  title: string;
  tipo: string;
  discipline: string | null;
  questaoCount: number;
  createdAt: string;
};

export async function listImportableSources(params?: {
  tipos?: string[];
  limit?: number;
}): Promise<ImportableQuestionSource[]> {
  const search = new URLSearchParams();
  if (params?.tipos?.length) {
    search.set("tipo", params.tipos.join(","));
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }

  const query = search.toString();
  const response = await planifyAuthenticatedFetch(
    `/api/banco-questoes/fontes${query ? `?${query}` : ""}`,
    { method: "GET" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !Array.isArray(data.fontes)) {
    return [];
  }

  return data.fontes as ImportableQuestionSource[];
}

export async function importQuestionsFromServer(
  materialIds: string[],
): Promise<{ imported: number; items: QuestionBankItem[] }> {
  const response = await planifyAuthenticatedFetch("/api/banco-questoes/importar", {
    method: "POST",
    body: JSON.stringify({ materialIds }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Não foi possível importar questões do servidor.");
  }

  return {
    imported: Number(data.imported || 0),
    items: Array.isArray(data.items) ? (data.items as QuestionBankItem[]) : [],
  };
}
