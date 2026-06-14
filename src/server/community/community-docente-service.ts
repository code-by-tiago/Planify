import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createCommunityNotification } from "./community-notifications-service";
import {
  awardEligibleBadges,
  getBadgeProgressForUser,
  type BadgeProgress,
} from "./community-badge-service";
import {
  getMaterialCommentsBatch,
  getMaterialLikesSummary,
  resolveCommunityAuthors,
} from "./marketplace-social-service";
import { listSavedMaterialIds } from "./community-saved-materials-service";
import { listSavedPostIds } from "./community-saved-posts-service";
import { listHiddenFeedMaterialIds } from "./community-hidden-feed-materials-service";
import {
  formatEventMonth,
  formatEventDateTime,
} from "@/lib/community/docente-utils";
import type {
  DocenteAuthor,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteEvent,
  DocenteMaterial,
  DocenteRecentPublication,
  DocenteStats,
} from "@/lib/community/docente-types";

const VALID_DISCIPLINAS: DocenteDisciplina[] = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Artes",
  "Educação Física",
];

function asDisciplina(value: string | null | undefined): DocenteDisciplina {
  const normalized = String(value || "").trim();
  if (VALID_DISCIPLINAS.includes(normalized as DocenteDisciplina)) {
    return normalized as DocenteDisciplina;
  }
  return "Ciências";
}

function coverForComponente(componente: string): string {
  const map: Record<string, string> = {
    Ciências:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=280&fit=crop",
    Matemática:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=280&fit=crop",
    "Língua Portuguesa":
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=280&fit=crop",
    História:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&h=280&fit=crop",
    Geografia:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=280&fit=crop",
  };
  return map[componente] || map.Ciências;
}

function fileTypeFromMime(mime: string | null): DocenteMaterial["fileType"] {
  const m = String(mime || "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("presentation") || m.includes("powerpoint")) return "pptx";
  if (m.includes("word") || m.includes("document")) return "docx";
  if (m.startsWith("image/")) return "image";
  return "pdf";
}

type MarketplaceRow = {
  id: string;
  user_id: string | null;
  author_name: string | null;
  title: string;
  description: string | null;
  componente: string | null;
  ano_serie: string | null;
  etapa: string | null;
  tipo_material: string | null;
  tags: string[] | null;
  file_mime: string | null;
  downloads_count: number | null;
  created_at: string | null;
};

type PostRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  disciplina: string;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  group_id?: string | null;
};

type EventRow = {
  id: string;
  title: string;
  presenter_name: string;
  starts_at: string;
  is_online: boolean;
};

type GroupRow = {
  id: string;
  name: string;
  description: string;
  disciplina: string;
  members_count: number;
  joinedByMe?: boolean;
};

type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  min_reputation: number;
};

export type CommunityDocenteOverview = {
  stats: DocenteStats;
  discussions: DocenteDiscussion[];
  materials: DocenteMaterial[];
  recentPublications: DocenteRecentPublication[];
  events: DocenteEvent[];
  groups: GroupRow[];
  badges: BadgeRow[];
  badgeProgress: BadgeProgress[];
  hiddenMaterialIds: string[];
  isAdmin: boolean;
  featuredTeacher: DocenteAuthor | null;
};

async function resolveAuthorStatsBatch(userIds: string[]): Promise<
  Map<
    string,
    {
      reputation: number;
      bio: string;
      materialsCount: number;
      followersCount: number;
    }
  >
> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const stats = new Map<
    string,
    { reputation: number; bio: string; materialsCount: number; followersCount: number }
  >();
  if (!unique.length) return stats;

  const supabase = getSupabaseAdminClient();
  const [{ data: profiles }, { data: materials }, { data: followers }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,community_reputation,bio")
      .in("id", unique),
    supabase
      .from("marketplace_materials")
      .select("user_id")
      .in("user_id", unique)
      .eq("is_published", true),
    supabase.from("community_followers").select("following_id").in("following_id", unique),
  ]);

  for (const id of unique) {
    stats.set(id, { reputation: 0, bio: "", materialsCount: 0, followersCount: 0 });
  }

  for (const row of profiles || []) {
    const id = row.id as string;
    const entry = stats.get(id);
    if (entry) {
      entry.reputation = Number(row.community_reputation || 0);
      entry.bio = String(row.bio || "");
    }
  }

  for (const row of materials || []) {
    const id = row.user_id as string;
    const entry = stats.get(id);
    if (entry) entry.materialsCount += 1;
  }

  for (const row of followers || []) {
    const id = row.following_id as string;
    const entry = stats.get(id);
    if (entry) entry.followersCount += 1;
  }

  return stats;
}

async function buildAuthor(
  userId: string,
  authorMap: Map<string, { userId: string; displayName: string; avatarUrl: string | null }>,
  fallbackName?: string | null,
  statsCache?: Map<
    string,
    { reputation: number; bio: string; materialsCount: number; followersCount: number }
  >,
): Promise<DocenteAuthor> {
  const summary = authorMap.get(userId);
  let stats = statsCache?.get(userId);

  if (!stats) {
    const batch = await resolveAuthorStatsBatch([userId]);
    stats = batch.get(userId) || {
      reputation: 0,
      bio: "",
      materialsCount: 0,
      followersCount: 0,
    };
  }

  return {
    id: userId,
    name: summary?.displayName || fallbackName || "Professor(a)",
    avatarUrl: summary?.avatarUrl || null,
    specialty: String(stats.bio || "Educador(a) Planify").slice(0, 80),
    materialsCount: stats.materialsCount,
    followersCount: stats.followersCount,
    reputation: stats.reputation,
    badges: [],
    isFollowing: false,
  };
}

export async function getCommunityDocenteOverview(params: {
  viewerUserId?: string | null;
  search?: string;
  disciplina?: string | null;
  componente?: string | null;
  mineOnly?: boolean;
  friendsOnly?: boolean;
  savedOnly?: boolean;
  etapa?: string | null;
  tipoMaterial?: string | null;
  tag?: string | null;
  hiddenFeedMode?: "exclude" | "only";
  isAdmin?: boolean;
}): Promise<CommunityDocenteOverview> {
  const supabase = getSupabaseAdminClient();
  const search = String(params.search || "").trim().toLowerCase();
  const disciplinaFilter = String(params.disciplina || "").trim();
  const componenteFilter = String(params.componente || "").trim();
  const etapaFilter = String(params.etapa || "").trim();
  const tipoMaterialFilter = String(params.tipoMaterial || "").trim();
  const tagFilter = String(params.tag || "").trim().toLowerCase();
  const hiddenFeedMode = params.hiddenFeedMode || "exclude";

  let hiddenMaterialIds = new Set<string>();
  if (params.viewerUserId) {
    const hiddenIds = await listHiddenFeedMaterialIds(params.viewerUserId);
    hiddenMaterialIds = new Set(hiddenIds);
  }

  let postsQuery = supabase
    .from("community_posts")
    .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (params.mineOnly && params.viewerUserId) {
    postsQuery = postsQuery.eq("author_id", params.viewerUserId);
  }
  if (disciplinaFilter) {
    postsQuery = postsQuery.eq("disciplina", disciplinaFilter);
  }

  let materialsQuery = supabase
    .from("marketplace_materials")
    .select(
      "id,user_id,author_name,title,description,componente,ano_serie,etapa,tipo_material,tags,file_mime,downloads_count,created_at",
    )
    .eq("is_published", true)
    .order("downloads_count", { ascending: false })
    .limit(24);

  if (params.mineOnly && params.viewerUserId) {
    materialsQuery = materialsQuery.eq("user_id", params.viewerUserId);
  }
  if (componenteFilter) {
    materialsQuery = materialsQuery.ilike("componente", `%${componenteFilter}%`);
  } else if (disciplinaFilter) {
    materialsQuery = materialsQuery.ilike("componente", `%${disciplinaFilter}%`);
  }
  if (etapaFilter) {
    materialsQuery = materialsQuery.eq("etapa", etapaFilter);
  }
  if (tipoMaterialFilter) {
    materialsQuery = materialsQuery.ilike("tipo_material", `%${tipoMaterialFilter}%`);
  }

  if (params.viewerUserId) {
    const hiddenList = [...hiddenMaterialIds];
    if (hiddenFeedMode === "only") {
      materialsQuery = materialsQuery.in(
        "id",
        hiddenList.length > 0 ? hiddenList : ["00000000-0000-0000-0000-000000000000"],
      );
    } else if (hiddenList.length > 0) {
      materialsQuery = materialsQuery.not("id", "in", `(${hiddenList.join(",")})`);
    }
  }

  const [
    postsResult,
    invitedPostsResult,
    materialsResult,
    eventsResult,
    groupsResult,
    badgesResult,
    teachersCount,
    materialsCount,
    postsCount,
    groupsCount,
  ] = await Promise.all([
    postsQuery,
    params.viewerUserId
      ? supabase
          .from("community_post_participants")
          .select("post_id")
          .eq("user_id", params.viewerUserId)
          .order("invited_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    materialsQuery,
    supabase
      .from("community_events")
      .select("id,title,presenter_name,starts_at,is_online")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
      .from("community_groups")
      .select("id,name,description,disciplina,members_count")
      .eq("is_public", true)
      .gt("members_count", 0)
      .order("members_count", { ascending: false })
      .limit(8),
    supabase
      .from("community_badges")
      .select("id,slug,name,description,icon,color,min_reputation")
      .order("min_reputation", { ascending: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("community_public", true),
    supabase
      .from("marketplace_materials")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("community_groups")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .gt("members_count", 0),
  ]);

  const posts = (postsResult.data || []) as PostRow[];
  const invitedPostIds = (invitedPostsResult.data || [])
    .map((row) => String((row as { post_id?: string }).post_id || ""))
    .filter(Boolean);

  let invitedPosts: PostRow[] = [];
  if (invitedPostIds.length > 0) {
    const { data: invitedPostRows } = await supabase
      .from("community_posts")
      .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
      .in("id", invitedPostIds)
      .eq("is_published", true);
    invitedPosts = (invitedPostRows || []) as PostRow[];
  }

  const postById = new Map<string, PostRow>();
  for (const post of [...posts, ...invitedPosts]) {
    postById.set(post.id, post);
  }
  const mergedPosts = [...postById.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const marketplaceRows = (materialsResult.data || []) as MarketplaceRow[];

  const userIds = [
    ...mergedPosts.map((p) => p.author_id),
    ...marketplaceRows.map((m) => m.user_id).filter(Boolean) as string[],
  ];
  const authorMap = await resolveCommunityAuthors(userIds);

  let likedPostIds = new Set<string>();
  let likedMaterialIds = new Set<string>();
  let savedMaterialIds = new Set<string>();
  let savedPostIds = new Set<string>();
  let followingIds = new Set<string>();
  let joinedGroupIds = new Set<string>();
  let badgeProgress: BadgeProgress[] = [];

  if (params.viewerUserId) {
    const [likes, matLikes, savedIds, savedPosts, following, groupMemberships] =
      await Promise.all([
      supabase
        .from("community_likes")
        .select("post_id")
        .eq("user_id", params.viewerUserId)
        .not("post_id", "is", null),
      supabase
        .from("community_likes")
        .select("material_id")
        .eq("user_id", params.viewerUserId)
        .not("material_id", "is", null),
      listSavedMaterialIds(params.viewerUserId),
      listSavedPostIds(params.viewerUserId),
      supabase
        .from("community_followers")
        .select("following_id")
        .eq("follower_id", params.viewerUserId),
      supabase
        .from("community_group_members")
        .select("group_id")
        .eq("user_id", params.viewerUserId),
    ]);
    likedPostIds = new Set((likes.data || []).map((r) => r.post_id as string));
    likedMaterialIds = new Set((matLikes.data || []).map((r) => r.material_id as string));
    savedMaterialIds = new Set(savedIds);
    savedPostIds = new Set(savedPosts);
    followingIds = new Set((following.data || []).map((r) => r.following_id as string));
    joinedGroupIds = new Set((groupMemberships.data || []).map((r) => r.group_id as string));

    await awardEligibleBadges(params.viewerUserId);
    badgeProgress = await getBadgeProgressForUser(params.viewerUserId);
  }

  let feedPosts = mergedPosts;
  let feedMaterials = marketplaceRows;

  if (params.friendsOnly && params.viewerUserId) {
    const allowedAuthors = new Set([...followingIds, params.viewerUserId]);
    feedPosts = feedPosts.filter((post) => allowedAuthors.has(post.author_id));
    feedMaterials = feedMaterials.filter(
      (row) => row.user_id && allowedAuthors.has(row.user_id as string),
    );
  }

  if (params.savedOnly && params.viewerUserId) {
    feedMaterials = feedMaterials.filter((row) => savedMaterialIds.has(row.id));
  }

  if (tagFilter) {
    feedMaterials = feedMaterials.filter((row) => {
      const tags = Array.isArray(row.tags) ? row.tags : [];
      const hay = `${row.title} ${row.description || ""} ${tags.join(" ")}`.toLowerCase();
      return hay.includes(tagFilter);
    });
    feedPosts = feedPosts.filter((post) => {
      const tags = post.tags || [];
      const hay = `${post.title} ${post.body || ""} ${tags.join(" ")}`.toLowerCase();
      return hay.includes(tagFilter);
    });
  }

  const allAuthorIds = [
    ...feedPosts.map((p) => p.author_id),
    ...feedMaterials.map((m) => m.user_id).filter(Boolean) as string[],
  ];
  const authorStatsCache = await resolveAuthorStatsBatch(allAuthorIds);

  const discussionsFromPosts: DocenteDiscussion[] = await Promise.all(
    feedPosts.map(async (post) => ({
      id: post.id,
      author: await buildAuthor(post.author_id, authorMap, undefined, authorStatsCache),
      title: post.title,
      disciplina: asDisciplina(post.disciplina),
      tags: post.tags || [],
      createdAt: post.created_at,
      commentsCount: post.comments_count,
      likesCount: post.likes_count,
      likedByMe: likedPostIds.has(post.id),
      savedByMe: savedPostIds.has(post.id),
    })),
  );

  const materialIds = feedMaterials.map((m) => m.id);
  const [likesSummary, commentsBatch] = await Promise.all([
    getMaterialLikesSummary({
      materialIds,
      viewerUserId: params.viewerUserId || null,
    }),
    getMaterialCommentsBatch(materialIds),
  ]);

  const discussionsFromMaterials: DocenteDiscussion[] = await Promise.all(
    feedMaterials.slice(0, 4).map(async (row) => {
      const userId = row.user_id || "unknown";
      const comments = commentsBatch.get(row.id) || [];
      const likes = likesSummary.get(row.id);
      return {
        id: `mat-disc-${row.id}`,
        author: await buildAuthor(userId, authorMap, row.author_name, authorStatsCache),
        title: row.title,
        disciplina: asDisciplina(row.componente),
        tags: [],
        createdAt: row.created_at || new Date().toISOString(),
        commentsCount: comments.length,
        likesCount: likes?.likesCount || 0,
        likedByMe: likes?.likedByMe || false,
        savedByMe: savedMaterialIds.has(row.id),
      };
    }),
  );

  const discussions = [...discussionsFromPosts, ...discussionsFromMaterials]
    .filter((d) => {
      if (!search) return true;
      const hay = `${d.title} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase();
      return hay.includes(search);
    })
    .slice(0, 8);

  const materials: DocenteMaterial[] = await Promise.all(
    feedMaterials.map(async (row) => {
      const userId = row.user_id || "unknown";
      const likes = likesSummary.get(row.id);
      return {
        id: row.id,
        title: row.title,
        disciplina: asDisciplina(row.componente),
        anoSerie: row.ano_serie || "Geral",
        author: await buildAuthor(userId, authorMap, row.author_name, authorStatsCache),
        coverUrl: coverForComponente(row.componente || "Ciências"),
        viewsCount: row.downloads_count || 0,
        likesCount: likes?.likesCount || 0,
        likedByMe: likes?.likedByMe || false,
        savedByMe: savedMaterialIds.has(row.id),
        fileType: fileTypeFromMime(row.file_mime),
      };
    }),
  );

  const filteredMaterials = materials
    .filter((m) => {
      if (!search) return true;
      const hay = `${m.title} ${m.author.name} ${m.disciplina}`.toLowerCase();
      return hay.includes(search);
    })
    .slice(0, 8);

  let recentPublications: DocenteRecentPublication[] = feedMaterials.slice(0, 4).map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: coverForComponente(row.componente || "Ciências"),
    authorName: row.author_name || "Professor(a)",
    createdAt: row.created_at || new Date().toISOString(),
    href: `/comunidade/material/${row.id}`,
  }));

  if (recentPublications.length === 0 && feedPosts.length > 0) {
    recentPublications = await Promise.all(
      feedPosts.slice(0, 4).map(async (post) => {
        const author = await buildAuthor(post.author_id, authorMap, undefined, authorStatsCache);
        return {
          id: post.id,
          title: post.title,
          thumbnailUrl: coverForComponente(post.disciplina),
          authorName: author.name,
          createdAt: post.created_at,
          href: `/comunidade/discussao/${post.id}`,
        };
      }),
    );
  }

  const events: DocenteEvent[] = ((eventsResult.data || []) as EventRow[]).map((e) => {
    const { day, month } = formatEventMonth(e.starts_at);
    return {
      id: e.id,
      title: e.title,
      presenterName: e.presenter_name,
      startsAt: e.starts_at,
      isOnline: e.is_online,
      day,
      month,
    };
  });

  const groups = ((groupsResult.data || []) as GroupRow[]).map((group) => ({
    ...group,
    joinedByMe: joinedGroupIds.has(group.id),
  }));
  const badges = (badgesResult.data || []) as BadgeRow[];

  const topTeacherId = marketplaceRows[0]?.user_id;
  let featuredTeacher: DocenteAuthor | null = null;

  if (topTeacherId) {
    featuredTeacher = await buildAuthor(topTeacherId, authorMap, marketplaceRows[0]?.author_name, authorStatsCache);
  } else if (params.viewerUserId) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,bio,community_reputation,community_public")
      .eq("id", params.viewerUserId)
      .maybeSingle();
    if (viewerProfile?.community_public) {
      featuredTeacher = await buildAuthor(
        params.viewerUserId,
        authorMap,
        viewerProfile.full_name as string | undefined,
        authorStatsCache,
      );
      featuredTeacher.specialty = String(viewerProfile.bio || featuredTeacher.specialty).slice(0, 80);
      featuredTeacher.reputation = Number(viewerProfile.community_reputation || 0);
    }
  }

  if (!featuredTeacher) {
    const { data: topProfile } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,bio,community_reputation")
      .eq("community_public", true)
      .order("community_reputation", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (topProfile?.id) {
      const featuredMap = await resolveCommunityAuthors([topProfile.id as string]);
      const featuredStats = await resolveAuthorStatsBatch([topProfile.id as string]);
      featuredTeacher = await buildAuthor(
        topProfile.id as string,
        featuredMap,
        topProfile.full_name as string | undefined,
        featuredStats,
      );
      featuredTeacher.specialty = String(topProfile.bio || featuredTeacher.specialty).slice(0, 80);
      featuredTeacher.reputation = Number(topProfile.community_reputation || 0);
    }
  }

  if (featuredTeacher && params.viewerUserId) {
    featuredTeacher.isFollowing = followingIds.has(featuredTeacher.id);
  }

  return {
    stats: {
      activeTeachers: teachersCount.count || 0,
      sharedMaterials: materialsCount.count || 0,
      openDiscussions: postsCount.count || discussions.length,
      studyGroups: groupsCount.count || 0,
    },
    discussions,
    materials: filteredMaterials,
    recentPublications,
    events,
    groups,
    badges,
    badgeProgress,
    hiddenMaterialIds: [...hiddenMaterialIds],
    isAdmin: Boolean(params.isAdmin),
    featuredTeacher,
  };
}

export async function createCommunityPost(params: {
  authorId: string;
  title: string;
  body: string;
  disciplina: string;
  tags: string[];
  participantUserIds?: string[];
  groupId?: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  if (params.groupId) {
    const { data: membership } = await supabase
      .from("community_group_members")
      .select("id")
      .eq("group_id", params.groupId)
      .eq("user_id", params.authorId)
      .maybeSingle();
    if (!membership) {
      throw new Error("Entre no grupo antes de publicar uma discussão.");
    }
  }

  const insertPayload: {
    author_id: string;
    title: string;
    body: string;
    disciplina: string;
    tags: string[];
    group_id?: string;
  } = {
    author_id: params.authorId,
    title: params.title,
    body: params.body,
    disciplina: params.disciplina,
    tags: params.tags,
  };
  if (params.groupId) insertPayload.group_id = params.groupId;

  const { data, error } = await supabase
    .from("community_posts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const uniqueParticipants = [
    ...new Set(
      (params.participantUserIds || []).filter(
        (userId) => userId && userId !== params.authorId,
      ),
    ),
  ];

  if (uniqueParticipants.length > 0) {
    const { error: participantError } = await supabase
      .from("community_post_participants")
      .insert(
        uniqueParticipants.map((userId) => ({
          post_id: data.id,
          user_id: userId,
        })),
      );

    if (participantError && !/does not exist|schema cache/i.test(participantError.message)) {
      throw new Error(participantError.message);
    }

    await Promise.all(
      uniqueParticipants.map((userId) =>
        createCommunityNotification({
          userId,
          type: "message",
          actorUserId: params.authorId,
          bodyPreview: `Você foi convidado(a) para a discussão "${params.title}".`,
          targetType: "post",
          targetId: data.id,
          href: `/comunidade/discussao/${data.id}`,
        }),
      ),
    );
  }

  await awardEligibleBadges(params.authorId);
  return data;
}

export async function toggleCommunityPostLike(params: {
  userId: string;
  postId: string;
}): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("community_likes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("post_id", params.postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("community_likes").insert({
      user_id: params.userId,
      post_id: params.postId,
    });
  }

  const { count } = await supabase
    .from("community_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", params.postId);

  await supabase
    .from("community_posts")
    .update({ likes_count: count || 0 })
    .eq("id", params.postId);

  if (!existing) {
    const { data: post } = await supabase
      .from("community_posts")
      .select("author_id,title")
      .eq("id", params.postId)
      .maybeSingle();

    if (post?.author_id && post.author_id !== params.userId) {
      void createCommunityNotification({
        userId: String(post.author_id),
        type: "like",
        actorUserId: params.userId,
        bodyPreview: `Curtiu "${String(post.title || "sua discussão").slice(0, 80)}"`,
        targetType: "post",
        targetId: params.postId,
        href: `/comunidade/discussao/${params.postId}`,
      });
    }
  }

  return { liked: !existing, likesCount: count || 0 };
}

export async function addCommunityPostComment(params: {
  authorId: string;
  postId: string;
  body: string;
}): Promise<{ commentsCount: number }> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("community_comments").insert({
    author_id: params.authorId,
    post_id: params.postId,
    body: params.body,
  });
  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from("community_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", params.postId);

  await supabase
    .from("community_posts")
    .update({ comments_count: count || 0 })
    .eq("id", params.postId);

  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id,title")
    .eq("id", params.postId)
    .maybeSingle();

  if (post?.author_id && post.author_id !== params.authorId) {
    void createCommunityNotification({
      userId: String(post.author_id),
      type: "comment",
      actorUserId: params.authorId,
      bodyPreview: params.body.slice(0, 200),
      targetType: "post",
      targetId: params.postId,
      href: `/comunidade/discussao/${params.postId}`,
    });
  }

  await awardEligibleBadges(params.authorId);
  return { commentsCount: count || 0 };
}

export async function toggleCommunityFollow(params: {
  followerId: string;
  followingId: string;
}): Promise<{ following: boolean }> {
  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("community_followers")
    .select("id")
    .eq("follower_id", params.followerId)
    .eq("following_id", params.followingId)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_followers").delete().eq("id", existing.id);
    return { following: false };
  }

  await supabase.from("community_followers").insert({
    follower_id: params.followerId,
    following_id: params.followingId,
  });

  void createCommunityNotification({
    userId: params.followingId,
    type: "message",
    actorUserId: params.followerId,
    bodyPreview: "começou a seguir você.",
    targetType: "professor",
    targetId: params.followerId,
    href: `/comunidade/professor/${params.followerId}`,
  });

  return { following: true };
}

export async function createCommunityGroup(params: {
  ownerId: string;
  name: string;
  description: string;
  disciplina: string;
  memberUserIds?: string[];
}) {
  const supabase = getSupabaseAdminClient();
  const uniqueMemberIds = [
    ...new Set(
      (params.memberUserIds || []).filter((userId) => userId && userId !== params.ownerId),
    ),
  ];
  const membersCount = 1 + uniqueMemberIds.length;

  const { data, error } = await supabase
    .from("community_groups")
    .insert({
      owner_id: params.ownerId,
      name: params.name,
      description: params.description,
      disciplina: params.disciplina,
      members_count: membersCount,
      is_public: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("community_group_members").insert({
    group_id: data.id,
    user_id: params.ownerId,
  });

  if (uniqueMemberIds.length > 0) {
    const { error: membersError } = await supabase.from("community_group_members").insert(
      uniqueMemberIds.map((userId) => ({
        group_id: data.id,
        user_id: userId,
      })),
    );

    if (membersError) throw new Error(membersError.message);

    await Promise.all(
      uniqueMemberIds.map((userId) =>
        createCommunityNotification({
          userId,
          type: "message",
          actorUserId: params.ownerId,
          bodyPreview: `Você foi adicionado(a) ao grupo "${params.name}".`,
          targetType: "group",
          targetId: data.id,
          href: `/comunidade/grupo/${data.id}`,
        }),
      ),
    );
  }

  await awardEligibleBadges(params.ownerId);
  return data;
}

export async function joinCommunityGroup(params: {
  userId: string;
  groupId: string;
}): Promise<{ joined: boolean; membersCount: number }> {
  const supabase = getSupabaseAdminClient();
  const { data: group } = await supabase
    .from("community_groups")
    .select("id,members_count,is_public")
    .eq("id", params.groupId)
    .maybeSingle();

  if (!group) throw new Error("Grupo não encontrado.");

  const { data: existing } = await supabase
    .from("community_group_members")
    .select("id")
    .eq("group_id", params.groupId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing) {
    return { joined: true, membersCount: group.members_count || 0 };
  }

  const { error: joinError } = await supabase.from("community_group_members").insert({
    group_id: params.groupId,
    user_id: params.userId,
  });
  if (joinError) throw new Error(joinError.message);

  const nextCount = (group.members_count || 0) + 1;
  await supabase
    .from("community_groups")
    .update({ members_count: nextCount })
    .eq("id", params.groupId);

  await awardEligibleBadges(params.userId);
  return { joined: true, membersCount: nextCount };
}

export async function leaveCommunityGroup(params: {
  userId: string;
  groupId: string;
}): Promise<{ left: boolean; membersCount: number }> {
  const supabase = getSupabaseAdminClient();
  const { data: group } = await supabase
    .from("community_groups")
    .select("id,members_count,owner_id")
    .eq("id", params.groupId)
    .maybeSingle();

  if (!group) throw new Error("Grupo não encontrado.");

  const { data: existing } = await supabase
    .from("community_group_members")
    .select("id")
    .eq("group_id", params.groupId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!existing) {
    return { left: false, membersCount: group.members_count || 0 };
  }

  if (group.owner_id === params.userId) {
    const { data: otherMembers } = await supabase
      .from("community_group_members")
      .select("user_id,joined_at")
      .eq("group_id", params.groupId)
      .neq("user_id", params.userId)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (otherMembers?.length) {
      const nextOwnerId = otherMembers[0].user_id as string;
      await supabase
        .from("community_groups")
        .update({ owner_id: nextOwnerId })
        .eq("id", params.groupId);
      await createCommunityNotification({
        userId: nextOwnerId,
        type: "message",
        actorUserId: params.userId,
        bodyPreview: `Você agora é o(a) responsável pelo grupo.`,
        targetType: "group",
        targetId: params.groupId,
        href: `/comunidade/grupo/${params.groupId}`,
      });
    }
  }

  const { error: leaveError } = await supabase
    .from("community_group_members")
    .delete()
    .eq("id", existing.id);
  if (leaveError) throw new Error(leaveError.message);

  const nextCount = Math.max(0, (group.members_count || 1) - 1);
  await supabase
    .from("community_groups")
    .update({ members_count: nextCount })
    .eq("id", params.groupId);

  return { left: true, membersCount: nextCount };
}

export async function transferCommunityGroupOwnership(params: {
  ownerId: string;
  groupId: string;
  newOwnerId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data: group } = await supabase
    .from("community_groups")
    .select("id,owner_id,name")
    .eq("id", params.groupId)
    .maybeSingle();

  if (!group || group.owner_id !== params.ownerId) {
    throw new Error("Apenas o(a) responsável atual pode transferir a liderança.");
  }

  const { data: membership } = await supabase
    .from("community_group_members")
    .select("id")
    .eq("group_id", params.groupId)
    .eq("user_id", params.newOwnerId)
    .maybeSingle();

  if (!membership) {
    throw new Error("O novo responsável precisa ser membro do grupo.");
  }

  await supabase
    .from("community_groups")
    .update({ owner_id: params.newOwnerId })
    .eq("id", params.groupId);

  await createCommunityNotification({
    userId: params.newOwnerId,
    type: "message",
    actorUserId: params.ownerId,
    bodyPreview: `Você foi definido(a) como responsável do grupo "${group.name}".`,
    targetType: "group",
    targetId: params.groupId,
    href: `/comunidade/grupo/${params.groupId}`,
  });
}

export async function createCommunityEvent(params: {
  hostId: string;
  title: string;
  description: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  location?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_events")
    .insert({
      host_id: params.hostId,
      title: params.title,
      description: params.description,
      presenter_name: params.presenterName,
      starts_at: params.startsAt,
      is_online: params.isOnline,
      location: params.location || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCommunityEvent(params: {
  adminId: string;
  eventId: string;
  title: string;
  description: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  location?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("community_events")
    .update({
      title: params.title,
      description: params.description,
      presenter_name: params.presenterName,
      starts_at: params.startsAt,
      is_online: params.isOnline,
      location: params.location || null,
    })
    .eq("id", params.eventId);

  if (error) throw new Error(error.message);
}

export async function deleteCommunityEvent(params: { adminId: string; eventId: string }) {
  const supabase = getSupabaseAdminClient();
  await supabase.from("community_event_participants").delete().eq("event_id", params.eventId);
  const { error } = await supabase.from("community_events").delete().eq("id", params.eventId);
  if (error) throw new Error(error.message);
}

export type CommunityDiscussionComment = {
  id: string;
  body: string;
  createdAt: string;
  author: DocenteAuthor;
};

export type CommunityDiscussionDetail = {
  id: string;
  title: string;
  body: string;
  disciplina: DocenteDisciplina;
  tags: string[];
  createdAt: string;
  author: DocenteAuthor;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  isAuthor: boolean;
  groupId: string | null;
  comments: CommunityDiscussionComment[];
  participants: DocenteAuthor[];
  relatedDiscussions: DocenteDiscussion[];
};

export type CommunityGroupDetail = {
  id: string;
  name: string;
  description: string;
  disciplina: string;
  membersCount: number;
  joinedByMe: boolean;
  isOwner: boolean;
  owner: DocenteAuthor;
  members: DocenteAuthor[];
  discussions: DocenteDiscussion[];
};

export type CommunityEventDetail = {
  id: string;
  title: string;
  description: string;
  presenterName: string;
  startsAt: string;
  isOnline: boolean;
  location: string | null;
  day: number;
  month: string;
  dateLabel: string;
  timeLabel: string;
  host: DocenteAuthor | null;
  goingCount: number;
  interestedCount: number;
  userRsvpStatus: "going" | "interested" | null;
  isHost: boolean;
  isAdmin?: boolean;
  participantsGoing: DocenteAuthor[];
  participantsInterested: DocenteAuthor[];
};

export type CommunityTeacherDetail = {
  profile: DocenteAuthor;
  schoolName: string | null;
  bio: string | null;
  topComponentes: string[];
  badges: Array<{ slug: string; name: string; color: string; awardedAt: string | null }>;
  materials: Array<{ id: string; title: string; disciplina: string; downloadsCount: number }>;
  discussions: DocenteDiscussion[];
  groups: Array<{ id: string; name: string; disciplina: string; membersCount: number }>;
  isFollowing: boolean;
  isOwnProfile: boolean;
};

export async function getCommunityDiscussionDetail(params: {
  postId: string;
  viewerUserId?: string | null;
}): Promise<CommunityDiscussionDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select(
      "id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at,group_id",
    )
    .eq("id", params.postId)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) return null;

  const postRow = post as PostRow;

  const [{ data: commentRows }, { data: participantRows }] = await Promise.all([
    supabase
      .from("community_comments")
      .select("id,author_id,body,created_at")
      .eq("post_id", params.postId)
      .order("created_at", { ascending: true }),
    supabase
      .from("community_post_participants")
      .select("user_id")
      .eq("post_id", params.postId),
  ]);

  const userIds = [
    postRow.author_id,
    ...(commentRows || []).map((c) => c.author_id as string),
    ...(participantRows || []).map((p) => p.user_id as string),
  ];
  const authorMap = await resolveCommunityAuthors(userIds);

  let likedByMe = false;
  let savedByMe = false;
  if (params.viewerUserId) {
    const [likeResult, savedIds] = await Promise.all([
      supabase
        .from("community_likes")
        .select("id")
        .eq("user_id", params.viewerUserId)
        .eq("post_id", params.postId)
        .maybeSingle(),
      listSavedPostIds(params.viewerUserId),
    ]);
    likedByMe = Boolean(likeResult.data);
    savedByMe = savedIds.includes(params.postId);
  }

  const comments: CommunityDiscussionComment[] = await Promise.all(
    (commentRows || []).map(async (row) => ({
      id: row.id as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      author: await buildAuthor(row.author_id as string, authorMap),
    })),
  );

  const participants: DocenteAuthor[] = await Promise.all(
    (participantRows || []).map(async (row) =>
      buildAuthor(row.user_id as string, authorMap),
    ),
  );

  let relatedRowsQuery = supabase
    .from("community_posts")
    .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
    .eq("is_published", true)
    .neq("id", params.postId)
    .order("created_at", { ascending: false })
    .limit(4);

  if (postRow.group_id) {
    relatedRowsQuery = relatedRowsQuery.eq("group_id", postRow.group_id);
  } else {
    relatedRowsQuery = relatedRowsQuery.eq("disciplina", postRow.disciplina);
  }

  const { data: relatedRows } = await relatedRowsQuery;

  const relatedDiscussions: DocenteDiscussion[] = await Promise.all(
    (relatedRows || []).map(async (row) => ({
      id: row.id as string,
      author: await buildAuthor(row.author_id as string, authorMap),
      title: row.title as string,
      disciplina: asDisciplina(row.disciplina as string),
      tags: (row.tags as string[]) || [],
      createdAt: row.created_at as string,
      commentsCount: row.comments_count as number,
      likesCount: row.likes_count as number,
      likedByMe: false,
      savedByMe: false,
    })),
  );

  return {
    id: postRow.id,
    title: postRow.title,
    body: postRow.body,
    disciplina: asDisciplina(postRow.disciplina),
    tags: postRow.tags || [],
    createdAt: postRow.created_at,
    author: await buildAuthor(postRow.author_id, authorMap),
    likesCount: postRow.likes_count,
    commentsCount: postRow.comments_count,
    likedByMe,
    savedByMe,
    isAuthor: params.viewerUserId === postRow.author_id,
    groupId: (postRow.group_id as string | null) || null,
    comments,
    participants,
    relatedDiscussions,
  };
}

export async function getCommunityGroupDetail(params: {
  groupId: string;
  viewerUserId?: string | null;
}): Promise<CommunityGroupDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: group } = await supabase
    .from("community_groups")
    .select("id,owner_id,name,description,disciplina,members_count,is_public")
    .eq("id", params.groupId)
    .maybeSingle();

  if (!group || !group.is_public) return null;

  const { data: memberRows } = await supabase
    .from("community_group_members")
    .select("user_id")
    .eq("group_id", params.groupId);

  const memberIds = (memberRows || []).map((r) => r.user_id as string);
  if (memberIds.length === 0) return null;

  const authorMap = await resolveCommunityAuthors([group.owner_id as string, ...memberIds]);

  let joinedByMe = false;
  if (params.viewerUserId) {
    joinedByMe = memberIds.includes(params.viewerUserId);
  }

  const members: DocenteAuthor[] = await Promise.all(
    memberIds.map((userId) => buildAuthor(userId, authorMap)),
  );

  const { data: postRows } = await supabase
    .from("community_posts")
    .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
    .eq("group_id", params.groupId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);

  let likedPostIds = new Set<string>();
  if (params.viewerUserId && (postRows || []).length > 0) {
    const { data: likes } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", params.viewerUserId)
      .in(
        "post_id",
        (postRows || []).map((p) => p.id as string),
      );
    likedPostIds = new Set((likes || []).map((l) => l.post_id as string));
  }

  const discussions: DocenteDiscussion[] = await Promise.all(
    (postRows || []).map(async (post) => ({
      id: post.id as string,
      author: await buildAuthor(post.author_id as string, authorMap),
      title: post.title as string,
      disciplina: asDisciplina(post.disciplina as string),
      tags: (post.tags as string[]) || [],
      createdAt: post.created_at as string,
      commentsCount: post.comments_count as number,
      likesCount: post.likes_count as number,
      likedByMe: likedPostIds.has(post.id as string),
      savedByMe: false,
    })),
  );

  return {
    id: group.id as string,
    name: group.name as string,
    description: group.description as string,
    disciplina: group.disciplina as string,
    membersCount: group.members_count as number,
    joinedByMe,
    isOwner: params.viewerUserId === group.owner_id,
    owner: await buildAuthor(group.owner_id as string, authorMap),
    members,
    discussions,
  };
}

export async function getCommunityEventDetail(params: {
  eventId: string;
  viewerUserId?: string | null;
  isAdmin?: boolean;
}): Promise<CommunityEventDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: event } = await supabase
    .from("community_events")
    .select("id,host_id,title,description,presenter_name,starts_at,is_online,location")
    .eq("id", params.eventId)
    .maybeSingle();

  if (!event) return null;

  const { day, month } = formatEventMonth(event.starts_at as string);
  const { dateLabel, timeLabel } = formatEventDateTime(event.starts_at as string);

  let host: DocenteAuthor | null = null;
  if (event.host_id) {
    const authorMap = await resolveCommunityAuthors([event.host_id as string]);
    host = await buildAuthor(event.host_id as string, authorMap);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: participantRows } = await supabase
    .from("community_event_participants")
    .select("user_id,status")
    .eq("event_id", params.eventId);

  const rows = (participantRows || []) as Array<{ user_id: string; status: string }>;
  const goingCount = rows.filter((r) => r.status === "going").length;
  const interestedCount = rows.filter((r) => r.status === "interested").length;

  let userRsvpStatus: "going" | "interested" | null = null;
  if (params.viewerUserId) {
    const mine = rows.find((r) => r.user_id === params.viewerUserId);
    if (mine?.status === "going" || mine?.status === "interested") {
      userRsvpStatus = mine.status;
    }
  }

  const goingIds = rows.filter((r) => r.status === "going").map((r) => r.user_id);
  const interestedIds = rows.filter((r) => r.status === "interested").map((r) => r.user_id);
  const participantAuthorMap = await resolveCommunityAuthors([...goingIds, ...interestedIds]);
  const participantStats = await resolveAuthorStatsBatch([...goingIds, ...interestedIds]);
  const participantsGoing = await Promise.all(
    goingIds.map((userId) => buildAuthor(userId, participantAuthorMap, undefined, participantStats)),
  );
  const participantsInterested = await Promise.all(
    interestedIds.map((userId) => buildAuthor(userId, participantAuthorMap, undefined, participantStats)),
  );

  return {
    id: event.id as string,
    title: event.title as string,
    description: event.description as string,
    presenterName: event.presenter_name as string,
    startsAt: event.starts_at as string,
    isOnline: Boolean(event.is_online),
    location: (event.location as string | null) || null,
    day,
    month,
    dateLabel,
    timeLabel,
    host,
    goingCount,
    interestedCount,
    userRsvpStatus,
    isHost: params.viewerUserId === event.host_id,
    isAdmin: Boolean(params.isAdmin),
    participantsGoing,
    participantsInterested,
  };
}

export async function getCommunityTeacherDetail(params: {
  userId: string;
  viewerUserId?: string | null;
}): Promise<CommunityTeacherDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,bio,school_name,community_public,community_reputation")
    .eq("id", params.userId)
    .maybeSingle();

  if (!profile) return null;

  const isOwnProfile = params.viewerUserId === params.userId;
  if (!profile.community_public && !isOwnProfile) return null;

  const authorMap = await resolveCommunityAuthors([params.userId]);

  const [
    { data: materials },
    { data: posts },
    { data: userBadges },
    { data: groupMemberships },
  ] = await Promise.all([
    supabase
      .from("marketplace_materials")
      .select("id,title,componente,downloads_count")
      .eq("user_id", params.userId)
      .eq("is_published", true)
      .order("downloads_count", { ascending: false })
      .limit(12),
    supabase
      .from("community_posts")
      .select("id,author_id,title,disciplina,tags,likes_count,comments_count,created_at")
      .eq("author_id", params.userId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("community_user_badges")
      .select("awarded_at,badge:community_badges(slug,name,color)")
      .eq("user_id", params.userId),
    supabase
      .from("community_group_members")
      .select("group_id,group:community_groups(id,name,disciplina,members_count,is_public)")
      .eq("user_id", params.userId),
  ]);

  let isFollowing = false;
  if (params.viewerUserId && !isOwnProfile) {
    const { data: follow } = await supabase
      .from("community_followers")
      .select("id")
      .eq("follower_id", params.viewerUserId)
      .eq("following_id", params.userId)
      .maybeSingle();
    isFollowing = Boolean(follow);
  }

  const profileAuthor = await buildAuthor(params.userId, authorMap, profile.full_name);
  profileAuthor.specialty = String(profile.bio || profileAuthor.specialty).slice(0, 120);
  profileAuthor.reputation = Number(profile.community_reputation || 0);
  profileAuthor.isFollowing = isFollowing;

  const badges = (userBadges || [])
    .map((row) => {
      const badge = row.badge as { slug?: string; name?: string; color?: string } | null;
      if (!badge?.slug) return null;
      return {
        slug: badge.slug,
        name: badge.name || badge.slug,
        color: badge.color || "#06B6D4",
        awardedAt: (row.awarded_at as string | null) || null,
      };
    })
    .filter(Boolean) as CommunityTeacherDetail["badges"];

  profileAuthor.badges = badges.map((b) => b.name);

  const discussions: DocenteDiscussion[] = await Promise.all(
    (posts || []).map(async (post) => ({
      id: post.id as string,
      author: profileAuthor,
      title: post.title as string,
      disciplina: asDisciplina(post.disciplina as string),
      tags: (post.tags as string[]) || [],
      createdAt: post.created_at as string,
      commentsCount: post.comments_count as number,
      likesCount: post.likes_count as number,
      likedByMe: false,
      savedByMe: false,
    })),
  );

  const topComponentes = [
    ...new Set(
      (materials || [])
        .map((m) => String(m.componente || "").trim())
        .filter(Boolean),
    ),
  ].slice(0, 3);

  const groups = (groupMemberships || [])
    .map((row) => {
      const group = row.group as {
        id?: string;
        name?: string;
        disciplina?: string;
        members_count?: number;
        is_public?: boolean;
      } | null;
      if (!group?.id || !group.is_public) return null;
      return {
        id: group.id,
        name: group.name || "Grupo",
        disciplina: group.disciplina || "Multicomponente",
        membersCount: group.members_count || 0,
      };
    })
    .filter(Boolean) as CommunityTeacherDetail["groups"];

  return {
    profile: profileAuthor,
    schoolName: (profile.school_name as string | null) || null,
    bio: (profile.bio as string | null) || null,
    topComponentes,
    badges,
    materials: (materials || []).map((m) => ({
      id: m.id as string,
      title: m.title as string,
      disciplina: asDisciplina(m.componente as string),
      downloadsCount: (m.downloads_count as number) || 0,
    })),
    discussions,
    groups,
    isFollowing,
    isOwnProfile,
  };
}

export async function inviteCommunityGroupMembers(params: {
  ownerId: string;
  groupId: string;
  memberUserIds: string[];
}): Promise<{ invited: number }> {
  const supabase = getSupabaseAdminClient();

  const { data: group } = await supabase
    .from("community_groups")
    .select("id,owner_id,name,members_count")
    .eq("id", params.groupId)
    .maybeSingle();

  if (!group) throw new Error("Grupo não encontrado.");
  if (group.owner_id !== params.ownerId) {
    throw new Error("Apenas o(a) dono(a) do grupo pode convidar membros.");
  }

  const uniqueIds = [
    ...new Set(
      params.memberUserIds.filter((id) => id && id !== params.ownerId),
    ),
  ];

  if (uniqueIds.length === 0) return { invited: 0 };

  const { data: existing } = await supabase
    .from("community_group_members")
    .select("user_id")
    .eq("group_id", params.groupId)
    .in("user_id", uniqueIds);

  const existingIds = new Set((existing || []).map((r) => r.user_id as string));
  const toInvite = uniqueIds.filter((id) => !existingIds.has(id));

  if (toInvite.length === 0) return { invited: 0 };

  const { error } = await supabase.from("community_group_members").insert(
    toInvite.map((userId) => ({
      group_id: params.groupId,
      user_id: userId,
    })),
  );

  if (error) throw new Error(error.message);

  const nextCount = (group.members_count || 0) + toInvite.length;
  await supabase
    .from("community_groups")
    .update({ members_count: nextCount })
    .eq("id", params.groupId);

  await Promise.all(
    toInvite.map((userId) =>
      createCommunityNotification({
        userId,
        type: "message",
        actorUserId: params.ownerId,
        bodyPreview: `Você foi convidado(a) para o grupo "${group.name}".`,
        targetType: "group",
        targetId: params.groupId,
        href: `/comunidade/grupo/${params.groupId}`,
      }),
    ),
  );

  return { invited: toInvite.length };
}

export async function updateCommunityPost(params: {
  authorId: string;
  postId: string;
  title: string;
  body: string;
  disciplina: string;
  tags: string[];
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id")
    .eq("id", params.postId)
    .maybeSingle();

  if (!post) throw new Error("Discussão não encontrada.");
  if (post.author_id !== params.authorId) {
    throw new Error("Apenas o(a) autor(a) pode editar esta discussão.");
  }

  const { error } = await supabase
    .from("community_posts")
    .update({
      title: params.title,
      body: params.body,
      disciplina: params.disciplina,
      tags: params.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.postId);

  if (error) throw new Error(error.message);
}

export async function deleteCommunityPost(params: {
  authorId: string;
  postId: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: post } = await supabase
    .from("community_posts")
    .select("author_id")
    .eq("id", params.postId)
    .maybeSingle();

  if (!post) throw new Error("Discussão não encontrada.");
  if (post.author_id !== params.authorId) {
    throw new Error("Apenas o(a) autor(a) pode excluir esta discussão.");
  }

  const { error } = await supabase.from("community_posts").delete().eq("id", params.postId);
  if (error) throw new Error(error.message);
}

export async function inviteCommunityPostParticipants(params: {
  authorId: string;
  postId: string;
  participantUserIds: string[];
}): Promise<{ invited: number }> {
  const supabase = getSupabaseAdminClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select("id,author_id,title")
    .eq("id", params.postId)
    .maybeSingle();

  if (!post) throw new Error("Discussão não encontrada.");
  if (post.author_id !== params.authorId) {
    throw new Error("Apenas o(a) autor(a) pode convidar participantes.");
  }

  const uniqueIds = [
    ...new Set(
      params.participantUserIds.filter((id) => id && id !== params.authorId),
    ),
  ];
  if (uniqueIds.length === 0) return { invited: 0 };

  const { data: existing } = await supabase
    .from("community_post_participants")
    .select("user_id")
    .eq("post_id", params.postId)
    .in("user_id", uniqueIds);

  const existingIds = new Set((existing || []).map((r) => r.user_id as string));
  const toInvite = uniqueIds.filter((id) => !existingIds.has(id));
  if (toInvite.length === 0) return { invited: 0 };

  const { error } = await supabase.from("community_post_participants").insert(
    toInvite.map((userId) => ({
      post_id: params.postId,
      user_id: userId,
    })),
  );
  if (error) throw new Error(error.message);

  await Promise.all(
    toInvite.map((userId) =>
      createCommunityNotification({
        userId,
        type: "message",
        actorUserId: params.authorId,
        bodyPreview: `Você foi convidado(a) para a discussão "${post.title}".`,
        targetType: "post",
        targetId: params.postId,
        href: `/comunidade/discussao/${params.postId}`,
      }),
    ),
  );

  return { invited: toInvite.length };
}

export async function toggleCommunityEventRsvp(params: {
  userId: string;
  eventId: string;
  status: "going" | "interested" | "none";
}): Promise<{ status: "going" | "interested" | null; goingCount: number; interestedCount: number }> {
  const supabase = getSupabaseAdminClient();

  const { data: event } = await supabase
    .from("community_events")
    .select("id")
    .eq("id", params.eventId)
    .maybeSingle();
  if (!event) throw new Error("Evento não encontrado.");

  const participantsTable = supabase.from("community_event_participants");

  const { data: existing } = await participantsTable
    .select("status")
    .eq("event_id", params.eventId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (params.status === "none") {
    if (existing) {
      await participantsTable
        .delete()
        .eq("event_id", params.eventId)
        .eq("user_id", params.userId);
    }
  } else if (existing) {
    if (existing.status === params.status) {
      await participantsTable
        .delete()
        .eq("event_id", params.eventId)
        .eq("user_id", params.userId);
    } else {
      await participantsTable
        .update({ status: params.status })
        .eq("event_id", params.eventId)
        .eq("user_id", params.userId);
    }
  } else {
    await participantsTable.insert({
      event_id: params.eventId,
      user_id: params.userId,
      status: params.status,
    });
  }

  const { data: allRows } = await supabase
    .from("community_event_participants")
    .select("status")
    .eq("event_id", params.eventId);

  const rows = (allRows || []) as Array<{ status: string }>;
  const goingCount = rows.filter((r) => r.status === "going").length;
  const interestedCount = rows.filter((r) => r.status === "interested").length;

  let finalStatus: "going" | "interested" | null = null;
  if (params.status !== "none") {
    const { data: mine } = await participantsTable
      .select("status")
      .eq("event_id", params.eventId)
      .eq("user_id", params.userId)
      .maybeSingle();
    if (mine?.status === "going" || mine?.status === "interested") {
      finalStatus = mine.status;
    }
  }

  return { status: finalStatus, goingCount, interestedCount };
}

export async function getSavedDiscussionsForUser(params: {
  userId: string;
  limit?: number;
}): Promise<DocenteDiscussion[]> {
  const supabase = getSupabaseAdminClient();
  const savedIds = await listSavedPostIds(params.userId);
  if (savedIds.length === 0) return [];

  const ids = savedIds.slice(0, params.limit || 20);
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
    .in("id", ids)
    .eq("is_published", true);

  if (!posts?.length) return [];

  const authorMap = await resolveCommunityAuthors(
    (posts as PostRow[]).map((p) => p.author_id),
  );

  const ordered = ids
    .map((id) => (posts as PostRow[]).find((p) => p.id === id))
    .filter(Boolean) as PostRow[];

  return Promise.all(
    ordered.map(async (post) => ({
      id: post.id,
      author: await buildAuthor(post.author_id, authorMap),
      title: post.title,
      disciplina: asDisciplina(post.disciplina),
      tags: post.tags || [],
      createdAt: post.created_at,
      commentsCount: post.comments_count,
      likesCount: post.likes_count,
      likedByMe: false,
      savedByMe: true,
    })),
  );
}

export async function getCommunityMaterialMeta(materialId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("marketplace_materials")
    .select("title,componente,description")
    .eq("id", materialId)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return null;

  return {
    title: data.title as string,
    componente: (data.componente as string | null) || null,
    description: (data.description as string | null) || null,
  };
}

export { toggleSavedPost } from "./community-saved-posts-service";
