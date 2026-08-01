import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";

export type SlideImagesRetryResult = {
  html: string;
  estrutura: MaterialEngineResponse;
  imagesResolved: number;
  creditCost?: number;
};

export async function requestSlideImagesRetry(
  payload: MaterialEngineInput & { estrutura: MaterialEngineResponse },
): Promise<SlideImagesRetryResult> {
  const response = await planifyAuthenticatedFetch("/api/materiais/regenerar-imagens", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | (SlideImagesRetryResult & { ok?: boolean; message?: string; code?: string })
    | null;

  if (!response.ok || !data?.ok) {
    const message = data?.message || "Não foi possível regenerar as imagens.";
    const error = new Error(message) as Error & { code?: string; status?: number };
    if (data?.code) error.code = data.code;
    error.status = response.status;
    throw error;
  }

  return {
    html: data.html,
    estrutura: data.estrutura,
    imagesResolved: data.imagesResolved,
    creditCost: data.creditCost,
  };
}
