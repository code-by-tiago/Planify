import { getSupabaseAdminClient } from "../supabase/admin-client";

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

export async function getSavedMaterialIds(params: {
  userId: string;
  materialIds?: string[];
}): Promise<Set<string>> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("community_saved_materials")
    .select("material_id")
    .eq("user_id", params.userId);

  if (params.materialIds?.length) {
    query = query.in("material_id", params.materialIds);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return new Set();
    }
    return new Set();
  }

  return new Set(
    (data || []).map((row: { material_id: string }) => String(row.material_id)),
  );
}

export async function saveCommunityMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<{ saved: boolean }> {
  const supabase = getSupabaseAdminClient();

  const { data: material } = await supabase
    .from("marketplace_materials")
    .select("id")
    .eq("id", params.materialId)
    .eq("is_published", true)
    .maybeSingle();

  if (!material) {
    throw new Error("Material não encontrado.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("community_saved_materials").insert({
    user_id: params.userId,
    material_id: params.materialId,
  });

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Biblioteca da Comunidade em atualização. Tente novamente em instantes.");
    }
    if (!/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message || "Não foi possível salvar o material.");
    }
  }

  return { saved: true };
}

export async function unsaveCommunityMaterial(params: {
  userId: string;
  materialId: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("community_saved_materials")
    .delete()
    .eq("user_id", params.userId)
    .eq("material_id", params.materialId);

  if (error && !isMissingTableError(error.message)) {
    throw new Error(error.message || "Não foi possível remover da biblioteca.");
  }
}

export async function listSavedMaterialIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_saved_materials")
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
