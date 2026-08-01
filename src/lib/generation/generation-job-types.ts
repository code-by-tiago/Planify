export type GenerationJobSurface =
  | "material"
  | "planning"
  | "inclusao"
  | "bundle"
  | "correction";

export type GenerationJobStatus = "queued" | "running" | "completed" | "failed";

export type GenerationStageId =
  | "queued"
  | "prepare"
  | "context"
  | "bank"
  | "generate"
  | "quality"
  | "images"
  | "persist"
  | "done";

export type GenerationStageEvent = {
  stage: GenerationStageId;
  message: string;
  progress: number;
};

export type GenerationJobSnapshot = {
  id: string;
  surface: GenerationJobSurface;
  tipo: string;
  status: GenerationJobStatus;
  stage: GenerationStageId;
  progress: number;
  message: string;
  pipeline: string;
  errorMessage?: string | null;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};
