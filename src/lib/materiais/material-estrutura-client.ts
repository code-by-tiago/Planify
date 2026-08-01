import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEstruturaMeta } from "@/server/materials/material-estrutura-service";

export type FetchMaterialEstruturaResult = {
  ok: true;
  estrutura: MaterialAIOutput | null;
  meta: MaterialEstruturaMeta;
};

export async function fetchMaterialEstrutura(
  materialId: string,
): Promise<FetchMaterialEstruturaResult | null> {
  const id = String(materialId || "").trim();
  if (!id) return null;

  const response = await planifyAuthenticatedFetch(
    `/api/materiais/${encodeURIComponent(id)}/estrutura`,
    { method: "GET" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) return null;

  return {
    ok: true,
    estrutura: (data.estrutura as MaterialAIOutput | null) ?? null,
    meta: data.meta as MaterialEstruturaMeta,
  };
}
