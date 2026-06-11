import type {
  GenerationJobSnapshot,
  GenerationJobStatus,
  GenerationJobSurface,
  GenerationStageEvent,
  GenerationStageId,
} from "@/lib/generation/generation-job-types";
import type { Json } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type GenerationJobRow = {
  id: string;
  user_id: string | null;
  surface: GenerationJobSurface;
  tipo: string;
  status: GenerationJobStatus;
  stage: string;
  progress: number;
  message: string;
  pipeline: string;
  payload: unknown;
  result: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

function mapRow(row: GenerationJobRow): GenerationJobSnapshot {
  return {
    id: row.id,
    surface: row.surface,
    tipo: row.tipo,
    status: row.status,
    stage: row.stage as GenerationStageId,
    progress: row.progress,
    message: row.message,
    pipeline: row.pipeline,
    errorMessage: row.error_message,
    result: row.result ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function createGenerationJob(input: {
  userId?: string | null;
  surface: GenerationJobSurface;
  tipo: string;
  payload: Record<string, unknown>;
}): Promise<GenerationJobSnapshot> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .insert({
      user_id: input.userId ?? null,
      surface: input.surface,
      tipo: input.tipo,
      status: "running",
      stage: "prepare",
      progress: 10,
      message: "Preparando geração…",
      payload: input.payload as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível iniciar o job de geração.");
  }

  return mapRow(data as GenerationJobRow);
}

export async function updateGenerationJobStage(
  jobId: string,
  stage: GenerationStageEvent,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status: "running",
      stage: stage.stage,
      progress: stage.progress,
      message: stage.message,
    })
    .eq("id", jobId);

  if (error) {
    console.warn("[generation_jobs] stage update failed:", error.message);
  }
}

export async function completeGenerationJob(
  jobId: string,
  input: {
    pipeline: string;
    result: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status: "completed",
      stage: "done",
      progress: 100,
      message: "Pronto!",
      pipeline: input.pipeline,
      result: input.result as Json,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.warn("[generation_jobs] complete failed:", error.message);
  }
}

export async function failGenerationJob(
  jobId: string,
  message: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("generation_jobs")
    .update({
      status: "failed",
      message,
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.warn("[generation_jobs] fail update failed:", error.message);
  }
}

export async function getGenerationJobForUser(
  jobId: string,
  userId: string,
): Promise<GenerationJobSnapshot | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as GenerationJobRow);
}
