import { getSupabaseAdminClient } from "../supabase/admin-client";

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

export async function listSavedPostIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("community_saved_posts")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) return [];
    return [];
  }

  return (data || []).map((row) => String(row.post_id));
}

export async function toggleSavedPost(params: {
  userId: string;
  postId: string;
}): Promise<{ saved: boolean }> {
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: readError } = await supabase
    .from("community_saved_posts")
    .select("post_id")
    .eq("user_id", params.userId)
    .eq("post_id", params.postId)
    .maybeSingle();

  if (readError && isMissingTableError(readError.message)) {
    throw new Error("Salvar discussões ainda não está disponível.");
  }

  if (existing) {
    const { error } = await supabase
      .from("community_saved_posts")
      .delete()
      .eq("user_id", params.userId)
      .eq("post_id", params.postId);
    if (error) throw new Error(error.message);
    return { saved: false };
  }

  const { error } = await supabase.from("community_saved_posts").insert({
    user_id: params.userId,
    post_id: params.postId,
  });
  if (error) throw new Error(error.message);
  return { saved: true };
}

export async function listSavedDiscussionsForUser(params: {
  userId: string;
  limit?: number;
}): Promise<string[]> {
  return listSavedPostIds(params.userId).then((ids) => ids.slice(0, params.limit || 20));
}
