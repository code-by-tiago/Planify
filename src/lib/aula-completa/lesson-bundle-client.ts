import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";

export type LessonBundleItem = {
  toolId: PlanifyToolId;
  ok: boolean;
  html?: string;
  estrutura?: MaterialAIOutput;
  alertas?: string[];
  pipeline?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  materialId?: string | null;
  error?: string;
};

export type LessonBundlePayload = MaterialEngineInput & {
  bundleTools?: PlanifyToolId[];
};

export type LessonBundleResult = {
  ok: true;
  items: LessonBundleItem[];
  tema: string;
  creditCost: number;
};

export class LessonBundleError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "LessonBundleError";
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function requestLessonBundleGeneration(
  payload: LessonBundlePayload,
): Promise<LessonBundleResult> {
  const response = await planifyAuthenticatedFetch("/api/aula-completa/gerar", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new LessonBundleError(
      data?.message || "Não foi possível gerar a aula completa.",
      { code: data?.code, status: response.status },
    );
  }

  window.dispatchEvent(new Event("planify:credits-changed"));

  return {
    ok: true,
    items: data.items as LessonBundleItem[],
    tema: String(data.tema || ""),
    creditCost: Number(data.creditCost || 0),
  };
}
