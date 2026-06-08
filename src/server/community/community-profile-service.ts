import type { TablesUpdate } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveUserAvatarUrl } from "../auth/user-avatar";
import { resolveUserDisplayName } from "../auth/user-display-name";
import { getCommunityFriendshipCounts } from "./community-friends-service";
import { getUserTopComponentes } from "./community-profile-search-service";

export type CommunityProfileStats = {
  classesCount: number;
  materialsCount: number;
  followersCount: number;
  followingCount: number;
};

export type CommunityProfile = {
  userId: string;
  fullName: string;
  email: string;
  schoolName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  communityPublic: boolean;
  topComponentes: string[];
  stats: CommunityProfileStats;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  school_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  community_public?: boolean | null;
};

async function countUserMaterials(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from("marketplace_materials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_published", true);

  if (error) {
    return 0;
  }

  return count || 0;
}

async function countUserClasses(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from("school_classes")
    .select("id", { count: "exact", head: true })
    .eq("teacher_user_id", userId);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function getCommunityProfileForUser(params: {
  userId: string;
  email: string;
  userMetadata?: Record<string, unknown> | null;
}): Promise<CommunityProfile> {
  const supabase = getSupabaseAdminClient();

  let row = null as ProfileRow | null;

  const profileResult = await supabase
    .from("profiles")
    .select("id,email,full_name,school_name,avatar_url,bio,community_public")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileResult.error) {
    const fallback = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("id", params.userId)
      .maybeSingle();
    row = (fallback.data || null) as ProfileRow | null;
  } else {
    row = (profileResult.data || null) as ProfileRow | null;
  }

  const [fullName, avatarUrl, materialsCount, classesCount, friendCounts, topComponentes] =
    await Promise.all([
    resolveUserDisplayName({
      userId: params.userId,
      userMetadata: params.userMetadata,
      email: params.email,
    }),
    resolveUserAvatarUrl({
      userId: params.userId,
      userMetadata: params.userMetadata,
    }),
    countUserMaterials(params.userId),
    countUserClasses(params.userId),
    getCommunityFriendshipCounts(params.userId),
    getUserTopComponentes(params.userId),
  ]);

  return {
    userId: params.userId,
    fullName: row?.full_name?.trim() || fullName,
    email: row?.email || params.email,
    schoolName: row?.school_name?.trim() || null,
    bio: row?.bio?.trim() || null,
    avatarUrl: row?.avatar_url || avatarUrl,
    communityPublic: row?.community_public !== false,
    topComponentes,
    stats: {
      classesCount,
      materialsCount,
      followersCount: friendCounts.friendsCount,
      followingCount: friendCounts.pendingIncomingCount,
    },
  };
}

export type PublicCommunityProfile = {
  userId: string;
  fullName: string;
  schoolName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  communityPublic: boolean;
  isOwnProfile: boolean;
  topComponentes: string[];
  stats: CommunityProfileStats;
  materials: Array<{
    id: string;
    title: string;
    description: string;
    tipoMaterial: string;
    componente: string;
    etapa: string;
    anoSerie: string;
    downloadsCount: number;
    createdAt: string | null;
  }>;
};

type MarketplaceMaterialRow = {
  id: string;
  title: string;
  description: string | null;
  tipo_material: string | null;
  componente: string | null;
  etapa: string | null;
  ano_serie: string | null;
  downloads_count: number | null;
  created_at: string | null;
  is_published: boolean | null;
};

export async function getPublicCommunityProfile(params: {
  targetUserId: string;
  viewerUserId?: string | null;
}): Promise<PublicCommunityProfile | null> {
  const supabase = getSupabaseAdminClient();

  let row = null as ProfileRow | null;

  const profileResult = await supabase
    .from("profiles")
    .select("id,email,full_name,school_name,avatar_url,bio,community_public")
    .eq("id", params.targetUserId)
    .maybeSingle();

  if (profileResult.error) {
    const fallback = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("id", params.targetUserId)
      .maybeSingle();
    row = (fallback.data || null) as ProfileRow | null;
  } else {
    row = (profileResult.data || null) as ProfileRow | null;
  }

  if (!row) {
    return null;
  }

  const isOwnProfile = params.viewerUserId === params.targetUserId;
  const communityPublic = row.community_public !== false;

  if (!communityPublic && !isOwnProfile) {
    return {
      userId: params.targetUserId,
      fullName: "Perfil privado",
      schoolName: null,
      bio: null,
      avatarUrl: null,
      communityPublic: false,
      isOwnProfile: false,
      topComponentes: [],
      stats: {
        classesCount: 0,
        materialsCount: 0,
        followersCount: 0,
        followingCount: 0,
      },
      materials: [],
    };
  }

  const [fullName, avatarUrl, materialsCount, classesCount, friendCounts, topComponentes, materialsResult] =
    await Promise.all([
      resolveUserDisplayName({
        userId: params.targetUserId,
        email: row.email,
      }),
      resolveUserAvatarUrl({ userId: params.targetUserId }),
      countUserMaterials(params.targetUserId),
      countUserClasses(params.targetUserId),
      getCommunityFriendshipCounts(params.targetUserId),
      getUserTopComponentes(params.targetUserId),
      supabase
        .from("marketplace_materials")
        .select(
          "id,title,description,tipo_material,componente,etapa,ano_serie,downloads_count,created_at,is_published",
        )
        .eq("user_id", params.targetUserId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const materials = ((materialsResult.data || []) as MarketplaceMaterialRow[]).map(
    (material) => ({
      id: material.id,
      title: material.title,
      description: material.description || "",
      tipoMaterial: material.tipo_material || "Material de apoio",
      componente: material.componente || "Multicomponente",
      etapa: material.etapa || "Ensino Fundamental",
      anoSerie: material.ano_serie || "Geral",
      downloadsCount: material.downloads_count || 0,
      createdAt: material.created_at,
    }),
  );

  return {
    userId: params.targetUserId,
    fullName: row.full_name?.trim() || fullName,
    schoolName: row.school_name?.trim() || null,
    bio: row.bio?.trim() || null,
    avatarUrl: row.avatar_url || avatarUrl,
    communityPublic,
    isOwnProfile,
    topComponentes,
    stats: {
      classesCount,
      materialsCount,
      followersCount: friendCounts.friendsCount,
      followingCount: friendCounts.pendingIncomingCount,
    },
    materials,
  };
}

export async function updateCommunityProfile(
  userId: string,
  input: {
    fullName?: string;
    schoolName?: string | null;
    bio?: string | null;
    communityPublic?: boolean;
    avatarUrl?: string | null;
  },
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const update: TablesUpdate<"profiles"> = {};

  if (input.fullName !== undefined) {
    update.full_name = input.fullName.trim() || null;
  }

  if (input.schoolName !== undefined) {
    update.school_name = input.schoolName?.trim() || null;
  }

  if (input.bio !== undefined) {
    update.bio = input.bio?.trim().slice(0, 500) || null;
  }

  if (input.communityPublic !== undefined) {
    update.community_public = input.communityPublic;
  }

  if (input.avatarUrl !== undefined) {
    update.avatar_url = input.avatarUrl;
  }

  if (!Object.keys(update).length) {
    return;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);

  if (
    error?.message?.includes("schema cache") ||
    error?.message?.includes("avatar_url") ||
    error?.message?.includes("school_name") ||
    error?.message?.includes("bio") ||
    error?.message?.includes("community_public")
  ) {
    throw new Error(
      error.message.includes("avatar_url")
        ? "Perfil em atualização no servidor. Aguarde um minuto e tente novamente."
        : error.message || "Não foi possível atualizar o perfil.",
    );
  }

  if (error) {
    throw new Error(error.message || "Não foi possível atualizar o perfil.");
  }
}
