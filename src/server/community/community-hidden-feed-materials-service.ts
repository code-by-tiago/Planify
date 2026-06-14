import { getSupabaseAdminClient } from "../supabase/admin-client";

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

export async function listHiddenFeedMaterialIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_hidden_feed_materials")
    .select("material_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    return [];
  }

  return (data || []).map((row: { material_id: string }) => String(row.material_id));
}

export async function hideCommunityFeedMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<void> {
  const materialId = String(params.materialId || "").trim();
  if (!materialId) {
    throw new Error("Material não informado.");
  }

  const supabase = getSupabaseAdminClient();

  const { data: material } = await supabase
    .from("marketplace_materials")
    .select("id")
    .eq("id", materialId)
    .eq("is_published", true)
    .maybeSingle();

  if (!material) {
    throw new Error("Material não encontrado.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("community_hidden_feed_materials").upsert(
    {
      user_id: params.userId,
      material_id: materialId,
    },
    { onConflict: "user_id,material_id" },
  );

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Preferências de feed em atualização. Tente novamente em instantes.");
    }
    if (!/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message || "Não foi possível ocultar o material.");
    }
  }
}

export async function unhideCommunityFeedMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<void> {
  const materialId = String(params.materialId || "").trim();
  if (!materialId) {
    throw new Error("Material não informado.");
  }

  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("community_hidden_feed_materials")
    .delete()
    .eq("user_id", params.userId)
    .eq("material_id", materialId);

  if (error && !isMissingTableError(error.message)) {
    throw new Error(error.message || "Não foi possível restaurar o material.");
  }
}

export async function syncHiddenFeedMaterialIds(params: {
  userId: string;
  materialIds: string[];
}): Promise<{ synced: number }> {
  const uniqueIds = [...new Set(params.materialIds.map((id) => String(id).trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { synced: 0 };
  }

  const supabase = getSupabaseAdminClient();
  const existing = new Set(await listHiddenFeedMaterialIds(params.userId));
  const toInsert = uniqueIds.filter((id) => !existing.has(id));

  if (toInsert.length === 0) {
    return { synced: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("community_hidden_feed_materials").upsert(
    toInsert.map((materialId) => ({
      user_id: params.userId,
      material_id: materialId,
    })),
    { onConflict: "user_id,material_id", ignoreDuplicates: true },
  );

  if (error && !isMissingTableError(error.message)) {
    throw new Error(error.message || "Não foi possível sincronizar preferências.");
  }

  return { synced: toInsert.length };
}
