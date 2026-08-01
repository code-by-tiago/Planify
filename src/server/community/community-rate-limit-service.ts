import { getSupabaseAdminClient } from "../supabase/admin-client";

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

export async function consumeCommunityRateLimit(params: {
  userId: string;
  bucketKey: string;
  limit: number;
  windowSec: number;
}): Promise<void> {
  const userId = String(params.userId || "").trim();
  const bucketKey = String(params.bucketKey || "").trim();
  if (!userId || !bucketKey) return;

  const windowEpoch = Math.floor(Date.now() / 1000 / Math.max(params.windowSec, 1));
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("community_rate_limit_buckets");

  const { data: existing, error: readError } = await table
    .select("hit_count")
    .eq("user_id", userId)
    .eq("bucket_key", bucketKey)
    .eq("window_epoch", windowEpoch)
    .maybeSingle();

  if (readError && !isMissingTableError(readError.message)) {
    return;
  }

  const current = Number(existing?.hit_count || 0);
  if (current >= params.limit) {
    throw new Error("Muitas ações em pouco tempo. Aguarde um instante e tente novamente.");
  }

  if (existing) {
    const { error } = await table
      .update({ hit_count: current + 1, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("bucket_key", bucketKey)
      .eq("window_epoch", windowEpoch);
    if (error && !isMissingTableError(error.message)) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await table.insert({
    user_id: userId,
    bucket_key: bucketKey,
    window_epoch: windowEpoch,
    hit_count: 1,
  });

  if (error && !/duplicate|unique/i.test(error.message) && !isMissingTableError(error.message)) {
    throw new Error(error.message);
  }
}
