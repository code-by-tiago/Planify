import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  MaterialStreamEvent,
  MaterialStreamPayload,
} from "@/lib/materiais/material-stream-types";
import {
  createGenerationTimeoutError,
  GENERATION_CLIENT_TIMEOUT_MS,
  isFetchTimeoutError,
  withGenerationTimeoutSignal,
} from "@/lib/pro/generation-timeout";

export type MaterialStreamCallbacks = {
  onProgress?: (payload: {
    phase: "content" | "images";
    message: string;
    index?: number;
    total?: number;
  }) => void;
  onError?: (message: string, code?: string) => void;
  signal?: AbortSignal;
};

export type MaterialStreamResult = {
  html: string;
  tipoMaterial: string;
  estrutura?: unknown;
  alertas?: string[];
  pipeline?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  creditCost: number;
  materialId?: string | null;
  persistWarning?: string | null;
};

function parseNdjsonLine(line: string): MaterialStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as MaterialStreamEvent;
  } catch {
    return null;
  }
}

export async function requestMaterialGenerationStream(
  payload: MaterialStreamPayload,
  callbacks: MaterialStreamCallbacks = {},
): Promise<MaterialStreamResult> {
  const signal = withGenerationTimeoutSignal(
    callbacks.signal,
    GENERATION_CLIENT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await planifyAuthenticatedFetch("/api/materiais/gerar-stream", {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw createGenerationTimeoutError("material");
    }
    throw error;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error = new Error(
      data?.message || "Não foi possível gerar o material.",
    ) as Error & { code?: string; status?: number };
    error.code = data?.code;
    error.status = response.status;
    if (response.status === 504) error.code = "timeout";
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Resposta de streaming indisponível.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let complete: MaterialStreamResult | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const event = parseNdjsonLine(line);
        if (!event) continue;

        if (event.type === "progress") {
          callbacks.onProgress?.({
            phase: event.phase,
            message: event.message,
            index: event.index,
            total: event.total,
          });
        } else if (event.type === "error") {
          callbacks.onError?.(event.message, event.code);
          const error = new Error(event.message) as Error & { code?: string };
          error.code = event.code;
          throw error;
        } else if (event.type === "complete") {
          complete = {
            html: event.html,
            tipoMaterial: event.tipoMaterial,
            estrutura: event.estrutura,
            alertas: event.alertas,
            pipeline: event.pipeline,
            qualityScore: event.qualityScore,
            qualityIssues: event.qualityIssues,
            creditCost: event.creditCost,
            materialId: event.materialId,
            persistWarning: event.persistWarning,
          };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!complete) {
    throw new Error("Geração interrompida antes da conclusão.");
  }

  return complete;
}
