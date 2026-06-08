import { getSupabaseAdminClient } from "../supabase/admin-client";
import {
  extractAvatarFromUserMetadata,
  normalizeAvatarUrl,
} from "../auth/user-avatar";
import { resolveDisplayNameFromSources } from "../auth/user-display-name";

export type CommunityAuthorSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MaterialLikeSummary = {
  likesCount: number;
  likedByMe: boolean;
};

async function getAuthUserMetadata(
  userId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.auth.admin.getUserById(userId);
    return (data.user?.user_metadata as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}

async function resolveCommunityAuthorAvatar(params: {
  userId: string;
  profileAvatarUrl: string | null | undefined;
}): Promise<string | null> {
  const fromProfile = normalizeAvatarUrl(params.profileAvatarUrl);
  if (fromProfile) {
    return fromProfile;
  }

  const metadata = await getAuthUserMetadata(params.userId);
  return extractAvatarFromUserMetadata(metadata);
}

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
        Promise.resolve(
          resolveDisplayNameFromSources({
            profileFullName: profile?.full_name,
            email: profile?.email,
          }),
        ),
        resolveCommunityAuthorAvatar({
          userId,
          profileAvatarUrl: profile?.avatar_url,
        }),
      ]);

      result.set(userId, {
        userId,
        displayName,
        avatarUrl,
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

export type MaterialCommentSummary = {
  id: string;
  userId: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export async function getMaterialCommentsBatch(
  materialIds: string[],
): Promise<Map<string, MaterialCommentSummary[]>> {
  const result = new Map<string, MaterialCommentSummary[]>();
  const ids = [...new Set(materialIds.filter(Boolean))];

  for (const materialId of ids) {
    result.set(materialId, []);
  }

  if (!ids.length) {
    return result;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("marketplace_material_comments")
    .select("id,material_id,user_id,author_name,body,created_at")
    .in("material_id", ids)
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return result;
  }

  const commenterIds = [
    ...new Set(
      data
        .map((row) => String(row.user_id || "").trim())
        .filter(Boolean),
    ),
  ];
  const authors = await resolveCommunityAuthors(commenterIds);

  for (const row of data) {
    const materialId = String(row.material_id || "");
    const userId = row.user_id ? String(row.user_id) : null;
    const author = userId ? authors.get(userId) : null;
    const list = result.get(materialId) || [];

    list.push({
      id: String(row.id),
      userId,
      authorName: author?.displayName || String(row.author_name || "Professor"),
      authorAvatarUrl: author?.avatarUrl || null,
      body: String(row.body || ""),
      createdAt: String(row.created_at || ""),
    });

    result.set(materialId, list);
  }

  return result;
}

export async function getTopLikedMaterialIdsLast7Days(limit = 5): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from("marketplace_material_likes")
    .select("material_id,created_at")
    .gte("created_at", since.toISOString());

  if (error || !data?.length) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const row of data) {
    const materialId = String(row.material_id || "");
    if (!materialId) continue;
    counts.set(materialId, (counts.get(materialId) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([materialId]) => materialId);
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
