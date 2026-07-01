import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

const INFLIGHT_WINDOW_MS = 180_000;
const IDEMPOTENCY_DEDUP_MS = 5 * 60_000;
const INFLIGHT_EXPIRE_MESSAGE =
  "Geração anterior expirada automaticamente por inatividade.";

export class GenerationInflightError extends Error {
  readonly code = "generation_in_progress";
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "GenerationInflightError";
  }
}

export async function assertGenerationSlotAvailable(params: {
  userId: string;
  idempotencyKey?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const inflightCutoff = new Date(Date.now() - INFLIGHT_WINDOW_MS).toISOString();

  const { error: pruneError } = await supabase
    .from("generation_jobs")
    .update({
      status: "failed",
      stage: "failed",
      progress: 100,
      message: INFLIGHT_EXPIRE_MESSAGE,
      error_message: INFLIGHT_EXPIRE_MESSAGE,
      completed_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId)
    .eq("status", "running")
    .lt("updated_at", inflightCutoff);

  if (pruneError) {
    console.warn("[generation-inflight] prune failed:", pruneError.message);
  }

  const { count, error: inflightError } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("status", "running")
    .gte("updated_at", inflightCutoff);

  if (inflightError) {
    console.warn("[generation-inflight] check failed:", inflightError.message);
    return;
  }

  if (count && count > 0) {
    throw new GenerationInflightError(
      "Já existe uma geração em andamento. Aguarde a conclusão antes de iniciar outra.",
    );
  }

  const key = String(params.idempotencyKey || "").trim();
  if (!key) return;

  const dedupCutoff = new Date(Date.now() - IDEMPOTENCY_DEDUP_MS).toISOString();
  const { data: existing, error: dedupError } = await supabase
    .from("generated_materials")
    .select("id")
    .eq("user_id", params.userId)
    .eq("idempotency_key", key)
    .gte("created_at", dedupCutoff)
    .maybeSingle();

  if (dedupError) {
    console.warn("[generation-inflight] idempotency check failed:", dedupError.message);
    return;
  }

  if (existing) {
    throw new GenerationInflightError(
      "Este material já foi gerado nesta sessão. Confira o histórico ou altere o tema para gerar de novo.",
    );
  }
}
