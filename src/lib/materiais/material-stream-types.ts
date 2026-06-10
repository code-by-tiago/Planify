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

export const MATERIAL_STREAM_TYPES = new Set(["slides", "prova", "apostila"]);

export function isMaterialStreamType(tipo: string): boolean {
  return MATERIAL_STREAM_TYPES.has(tipo);
}

export type MaterialStreamPayload = MaterialEngineInput;
