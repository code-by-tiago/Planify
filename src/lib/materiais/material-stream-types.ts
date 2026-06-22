import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import type { MaterialAIOutput } from "@/types/ai";

export type MaterialStreamProgressEvent = {
  type: "progress";
  phase: "content" | "images";
  message: string;
  /** Progresso real do pipeline (0–100), quando disponível */
  progress?: number;
  stage?: string;
  jobId?: string;
  index?: number;
  total?: number;
};

export type MaterialStreamCompleteEvent = {
  type: "complete";
  html: string;
  jobId?: string;
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
  qualityScore?: number;
  qualityIssues?: string[];
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
  "cruzadinha",
]);

export function isMaterialStreamType(tipo: string): boolean {
  return MATERIAL_STREAM_TYPES.has(String(tipo || "").trim());
}

export type MaterialStreamPayload = MaterialEngineInput;
