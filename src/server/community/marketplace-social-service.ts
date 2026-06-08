import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveUserAvatarUrl } from "../auth/user-avatar";
import { resolveUserDisplayName } from "../auth/user-display-name";

export type CommunityAuthorSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MaterialLikeSummary = {
  likesCount: number;
  likedByMe: boolean;
};

export async function resolveCommunityAuthors(
  userIds: string[],
): Promise<Map<string, CommunityAuthorSummary>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, CommunityAuthorSummary>();

  if (!uniqueIds.length) {
    return result;
  }

  const supabase = getSupabaseAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url")
    .in("id", uniqueIds);

  const profileById = new Map(
    (profiles || []).map((row) => [
      row.id as string,
      row as {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
      },
    ]),
  );

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const profile = profileById.get(userId);
      const [displayName, avatarUrl] = await Promise.all([
        resolveUserDisplayName({
          userId,
          email: profile?.email || null,
        }),
        resolveUserAvatarUrl({ userId }),
      ]);

      result.set(userId, {
        userId,
        displayName: profile?.full_name?.trim() || displayName,
        avatarUrl: profile?.avatar_url || avatarUrl,
      });
    }),
  );

  return result;
}

export async function getMaterialLikesSummary(params: {
  materialIds: string[];
  viewerUserId?: string | null;
}): Promise<Map<string, MaterialLikeSummary>> {
  const result = new Map<string, MaterialLikeSummary>();
  const materialIds = [...new Set(params.materialIds.filter(Boolean))];

  for (const materialId of materialIds) {
    result.set(materialId, { likesCount: 0, likedByMe: false });
  }

  if (!materialIds.length) {
    return result;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("marketplace_material_likes")
    .select("material_id,user_id")
    .in("material_id", materialIds);

  if (error) {
    return result;
  }

  for (const row of data || []) {
    const materialId = String(row.material_id || "");
    const current = result.get(materialId) || { likesCount: 0, likedByMe: false };

    current.likesCount += 1;

    if (params.viewerUserId && row.user_id === params.viewerUserId) {
      current.likedByMe = true;
    }

    result.set(materialId, current);
  }

  return result;
}

export async function getMaterialLikeSummary(params: {
  materialId: string;
  viewerUserId?: string | null;
}): Promise<MaterialLikeSummary> {
  const map = await getMaterialLikesSummary({
    materialIds: [params.materialId],
    viewerUserId: params.viewerUserId,
  });

  return map.get(params.materialId) || { likesCount: 0, likedByMe: false };
}

export async function likeMarketplaceMaterial(params: {
  materialId: string;
  userId: string;
}): Promise<MaterialLikeSummary> {
  const supabase = getSupabaseAdminClient();

  const existing = await supabase
    .from("marketplace_material_likes")
    .select("id")
    .eq("material_id", params.materialId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!existing.data) {
    const { error } = await supabase.from("marketplace_material_likes").insert({
      material_id: params.materialId,
      user_id: params.userId,
    });

    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message || "Não foi possível curtir o material.");
    }
  }

  return getMaterialLikeSummary({
    materialId: params.materialId,
    viewerUserId: params.userId,
  });
}

export async function unlikeMarketplaceMaterial(params: {
  materialId: string;
  userId: string;
}): Promise<MaterialLikeSummary> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("marketplace_material_likes")
    .delete()
    .eq("material_id", params.materialId)
    .eq("user_id", params.userId);

  if (error) {
    throw new Error(error.message || "Não foi possível remover a curtida.");
  }

  return getMaterialLikeSummary({
    materialId: params.materialId,
    viewerUserId: params.userId,
  });
}
