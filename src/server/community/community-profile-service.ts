import type { TablesUpdate } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveUserAvatarUrl } from "../auth/user-avatar";
import { resolveUserDisplayName } from "../auth/user-display-name";

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

  const [marketplace, documents] = await Promise.all([
    supabase
      .from("marketplace_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return (marketplace.count || 0) + (documents.count || 0);
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

  if (profileResult.error?.message?.includes("bio")) {
    const fallback = await supabase
      .from("profiles")
      .select("id,email,full_name,school_name,avatar_url")
      .eq("id", params.userId)
      .maybeSingle();
    row = (fallback.data || null) as ProfileRow | null;
  } else {
    row = (profileResult.data || null) as ProfileRow | null;
  }

  const [fullName, avatarUrl, materialsCount, classesCount] = await Promise.all([
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
  ]);

  return {
    userId: params.userId,
    fullName: row?.full_name?.trim() || fullName,
    email: row?.email || params.email,
    schoolName: row?.school_name?.trim() || null,
    bio: row?.bio?.trim() || null,
    avatarUrl,
    communityPublic: row?.community_public !== false,
    stats: {
      classesCount,
      materialsCount,
      followersCount: 0,
      followingCount: 0,
    },
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

  if (error?.message?.includes("bio") || error?.message?.includes("community_public")) {
    const { bio: _bio, community_public: _public, ...legacyUpdate } = update;

    if (Object.keys(legacyUpdate).length) {
      const retry = await supabase.from("profiles").update(legacyUpdate).eq("id", userId);
      if (retry.error) {
        throw new Error(retry.error.message || "Não foi possível atualizar o perfil.");
      }
    }

    return;
  }

  if (error) {
    throw new Error(error.message || "Não foi possível atualizar o perfil.");
  }
}
