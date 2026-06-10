import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { LessonBundlePayload, LessonBundleItem } from "@/lib/aula-completa/lesson-bundle-client";
import { LessonBundleError } from "@/lib/aula-completa/lesson-bundle-client";
import type { BundleStreamEvent } from "@/lib/aula-completa/lesson-bundle-stream-types";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

export type LessonBundleStreamCallbacks = {
  onProgress?: (payload: {
    index: number;
    total: number;
    toolId: PlanifyToolId;
    status: "started" | "done" | "failed";
  }) => void;
  onItem?: (item: LessonBundleItem) => void;
  onError?: (message: string, code?: string) => void;
  signal?: AbortSignal;
};

export type LessonBundleStreamResult = {
  items: LessonBundleItem[];
  tema: string;
  creditCost: number;
};

function parseNdjsonLine(line: string): BundleStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as BundleStreamEvent;
  } catch {
    return null;
  }
}

export async function requestLessonBundleGenerationStream(
  payload: LessonBundlePayload,
  callbacks: LessonBundleStreamCallbacks = {},
): Promise<LessonBundleStreamResult> {
  const response = await planifyAuthenticatedFetch("/api/aula-completa/gerar-stream", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: callbacks.signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new LessonBundleError(
      data?.message || "Não foi possível gerar a aula completa.",
      { code: data?.code, status: response.status },
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new LessonBundleError("Resposta de streaming indisponível.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let complete: LessonBundleStreamResult | null = null;

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
            index: event.index,
            total: event.total,
            toolId: event.toolId,
            status: event.status,
          });
        } else if (event.type === "item") {
          callbacks.onItem?.(event.item);
        } else if (event.type === "complete") {
          complete = {
            items: event.items,
            tema: event.tema,
            creditCost: event.creditCost,
          };
        } else if (event.type === "error") {
          callbacks.onError?.(event.message, event.code);
          throw new LessonBundleError(event.message, { code: event.code });
        }
      }
    }

    if (buffer.trim()) {
      const event = parseNdjsonLine(buffer);
      if (event?.type === "complete") {
        complete = {
          items: event.items,
          tema: event.tema,
          creditCost: event.creditCost,
        };
      } else if (event?.type === "error") {
        throw new LessonBundleError(event.message, { code: event.code });
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!complete) {
    throw new LessonBundleError("Geração interrompida antes da conclusão.");
  }

  window.dispatchEvent(new Event("planify:credits-changed"));
  return complete;
}
