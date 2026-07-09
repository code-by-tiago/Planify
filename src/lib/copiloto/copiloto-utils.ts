import type { CopilotoMaterialType } from "@/lib/copiloto/types";

export const COPILOTO_SOURCE = "copiloto" as const;

export function createCopilotoIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `copiloto-${crypto.randomUUID()}`;
  }
  return `copiloto-${Date.now()}`;
}

export function copilotoQuantityBounds(tipo: CopilotoMaterialType): {
  min: number;
  max: number;
} {
  switch (tipo) {
    case "redacao":
      return { min: 2, max: 5 };
    case "plano-aula":
    case "atividade":
      return { min: 1, max: 3 };
    case "lista":
    case "prova":
    default:
      return { min: 5, max: 15 };
  }
}

const ALLOWED_COPILOTO_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/webm;codecs=opus",
]);

export function isAllowedCopilotoAudioMime(raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return false;
  const base = normalized.split(";")[0]?.trim() || "";
  if (base === "audio/x-wav") return true;
  if (base === "audio/m4a") return true;
  return (
    ALLOWED_COPILOTO_AUDIO_MIME.has(normalized) ||
    ALLOWED_COPILOTO_AUDIO_MIME.has(base)
  );
}
