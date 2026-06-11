import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import type { MaterialAIOutput } from "@/types/ai";

export type MaterialStreamProgressEvent = {
  type: "progress";
  phase: "content" | "images";
  message: string;
  index?: number;
  total?: number;
};

export type MaterialStreamCompleteEvent = {
  type: "complete";
  html: string;
  tipoMaterial: string;
  estrutura?: MaterialAIOutput;
  alertas?: string[];
  pipeline?: string;
  qualityScore?: number;
  qualityIssues?: string[];
  creditCost: number;
  materialId?: string | null;
  persistWarning?: string | null;
};

export type MaterialStreamErrorEvent = {
  type: "error";
  message: string;
  code?: string;
};

export type MaterialStreamEvent =
  | MaterialStreamProgressEvent
  | MaterialStreamCompleteEvent
  | MaterialStreamErrorEvent;

/** Todos os 13 geradores do Material Engine — streaming NDJSON em /gerar-stream. */
export const MATERIAL_STREAM_TYPES = new Set([
  "apostila",
  "atividade",
  "prova",
  "slides",
  "projeto",
  "jogo",
  "sequencia",
  "resumo",
  "lista",
  "plano-aula",
  "flashcards",
  "redacao",
  "mapa-mental",
]);

export function isMaterialStreamType(tipo: string): boolean {
  return MATERIAL_STREAM_TYPES.has(String(tipo || "").trim());
}

export type MaterialStreamPayload = MaterialEngineInput;
