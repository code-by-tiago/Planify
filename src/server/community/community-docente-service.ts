import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createCommunityNotification } from "./community-notifications-service";
import {
  awardEligibleBadges,
  getBadgeProgressForUser,
  type BadgeProgress,
} from "./community-badge-service";
import {
  getMaterialLikesSummary,
  resolveCommunityAuthors,
} from "./marketplace-social-service";
import { listSavedMaterialIds } from "./community-saved-materials-service";
import { listPostAttachments, type CommunityPostAttachment } from "./community-post-attachments-service";
import { listSavedPostIds } from "./community-saved-posts-service";
import { listHiddenFeedMaterialIds } from "./community-hidden-feed-materials-service";
import { listFeaturedCommunityMaterials } from "./community-featured-service";
import { normalizeDocenteDisciplina } from "@/lib/community/docente-utils";
import type {
  DocenteAchievementBadge,
  DocenteAuthor,
  DocenteComment,
  DocenteDiscussion,
  DocenteDisciplina,
  DocenteMaterial,
  DocenteRecentPublication,
  DocenteStats,
} from "@/lib/community/docente-types";

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
  post_kind?: string | null;
  metadata?: Record<string, unknown> | null;
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
  trendingMaterials: DocenteMaterial[];
  recentPublications: DocenteRecentPublication[];
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

/** Últimos N comentários por post (para o feed, evita N+1). */
async function fetchCommentsPreviewByPostIds(
  postIds: string[],
  limitPerPost = 2,
): Promise<Map<string, DocenteComment[]>> {
  const result = new Map<string, DocenteComment[]>();
  if (!postIds.length) return result;

  const supabase = getSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("community_comments")
    .select("id,post_id,author_id,body,created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: false })
    .limit(Math.max(postIds.length * limitPerPost, limitPerPost));

  if (error || !rows?.length) return result;

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const postId = String(row.post_id || "");
    if (!postId) continue;
    const list = grouped.get(postId) || [];
    if (list.length >= limitPerPost) continue;
    list.push(row);
    grouped.set(postId, list);
  }

  const authorIds = [
    ...new Set(rows.map((row) => String(row.author_id || "")).filter(Boolean)),
  ];
  const authorMap = await resolveCommunityAuthors(authorIds);
  const authorStatsCache = await resolveAuthorStatsBatch(authorIds);

  for (const [postId, commentRows] of grouped) {
    const chronological = [...commentRows].reverse();
    const comments: DocenteComment[] = await Promise.all(
      chronological.map(async (row) => ({
        id: String(row.id),
        body: String(row.body || ""),
        createdAt: String(row.created_at || ""),
        author: await buildAuthor(
          String(row.author_id),
          authorMap,
          undefined,
          authorStatsCache,
        ),
      })),
    );
    result.set(postId, comments);
  }

  return result;
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
  anoSerie?: string | null;
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
  const anoSerieFilter = String(params.anoSerie || "").trim();
  const hiddenFeedMode = params.hiddenFeedMode || "exclude";

  let hiddenMaterialIds = new Set<string>();
  if (params.viewerUserId) {
    const hiddenIds = await listHiddenFeedMaterialIds(params.viewerUserId);
    hiddenMaterialIds = new Set(hiddenIds);
  }

  let postsQuery = supabase
    .from("community_posts")
    .select(
      "id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at,post_kind,metadata",
    )
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
  if (anoSerieFilter) {
    materialsQuery = materialsQuery.ilike("ano_serie", `%${anoSerieFilter}%`);
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
    badgesResult,
    teachersCount,
    materialsCount,
    postsCount,
    trendingMaterials,
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
    listFeaturedCommunityMaterials(12),
  ]);

  const posts = (postsResult.data || []) as PostRow[];
  const invitedPostIds = (invitedPostsResult.data || [])
    .map((row) => String((row as { post_id?: string }).post_id || ""))
    .filter(Boolean);

  let invitedPosts: PostRow[] = [];
  if (invitedPostIds.length > 0) {
    const { data: invitedPostRows } = await supabase
      .from("community_posts")
      .select(
        "id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at,post_kind,metadata",
      )
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
  let badgeProgress: BadgeProgress[] = [];

  if (params.viewerUserId) {
    const [likes, matLikes, savedIds, savedPosts, following] = await Promise.all([
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
    ]);
    likedPostIds = new Set((likes.data || []).map((r) => r.post_id as string));
    likedMaterialIds = new Set((matLikes.data || []).map((r) => r.material_id as string));
    savedMaterialIds = new Set(savedIds);
    savedPostIds = new Set(savedPosts);
    followingIds = new Set((following.data || []).map((r) => r.following_id as string));

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
    feedPosts = feedPosts.filter((post) => savedPostIds.has(post.id));
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

  const previewPostIds = feedPosts.slice(0, 12).map((post) => post.id);
  const commentsPreviewMap = await fetchCommentsPreviewByPostIds(previewPostIds, 2);

  const discussionsFromPosts: DocenteDiscussion[] = await Promise.all(
    feedPosts.slice(0, 12).map(async (post) => {
      const isAchievement = post.post_kind === "achievement";
      const meta = (post.metadata || {}) as Record<string, unknown>;
      const attachments = isAchievement ? [] : await listPostAttachments(post.id);
      return {
        id: post.id,
        author: await buildAuthor(post.author_id, authorMap, undefined, authorStatsCache),
        title: post.title,
        body: post.body || "",
        disciplina: normalizeDocenteDisciplina(post.disciplina),
        tags: post.tags || [],
        createdAt: post.created_at,
        commentsCount: post.comments_count,
        likesCount: post.likes_count,
        likedByMe: likedPostIds.has(post.id),
        savedByMe: savedPostIds.has(post.id),
        kind: isAchievement ? ("achievement" as const) : ("text" as const),
        achievementBadge: isAchievement
          ? {
              name: String(meta.badgeName || post.title),
              color: String(meta.badgeColor || "#0891B2"),
              icon: String(meta.badgeIcon || "trophy"),
            }
          : undefined,
        commentsPreview: commentsPreviewMap.get(post.id) || [],
        attachments: attachments.map((a) => ({
          id: a.id,
          materialId: a.materialId,
          title: a.title,
          fileName: a.fileName,
          fileType: a.fileType,
          fileMime: a.fileMime,
          previewUrl: a.previewUrl,
        })),
      };
    }),
  );

  const materialIds = feedMaterials.map((m) => m.id);
  const likesSummary = await getMaterialLikesSummary({
    materialIds,
    viewerUserId: params.viewerUserId || null,
  });

  const discussions = discussionsFromPosts
    .filter((d) => {
      if (!search) return true;
      const hay = `${d.title} ${d.author.name} ${d.disciplina} ${d.tags.join(" ")}`.toLowerCase();
      return hay.includes(search);
    })
    .slice(0, 12);

  const materials: DocenteMaterial[] = await Promise.all(
    feedMaterials.map(async (row) => {
      const userId = row.user_id || "unknown";
      const likes = likesSummary.get(row.id);
      const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
      const downloadsCount = row.downloads_count || 0;
      return {
        id: row.id,
        title: row.title,
        disciplina: normalizeDocenteDisciplina(row.componente),
        anoSerie: row.ano_serie || "Geral",
        author: await buildAuthor(userId, authorMap, row.author_name, authorStatsCache),
        tipoMaterial: row.tipo_material || row.title,
        componenteRaw: row.componente || undefined,
        tags,
        viewsCount: downloadsCount,
        downloadsCount,
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
      const hay = `${m.title} ${m.author.name} ${m.disciplina} ${m.anoSerie} ${m.tipoMaterial} ${m.tags.join(" ")}`.toLowerCase();
      return hay.includes(search);
    })
    .slice(0, 8);

  let recentPublications: DocenteRecentPublication[] = feedMaterials.slice(0, 4).map((row) => ({
    id: row.id,
    title: row.title,
    tipoMaterial: row.tipo_material || row.title,
    disciplina: normalizeDocenteDisciplina(row.componente),
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
          tipoMaterial: "Discussão",
          disciplina: normalizeDocenteDisciplina(post.disciplina),
          authorName: author.name,
          createdAt: post.created_at,
          href: `/comunidade/discussao/${post.id}`,
        };
      }),
    );
  }

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

  if (params.viewerUserId) {
    if (featuredTeacher) {
      featuredTeacher.isFollowing = followingIds.has(featuredTeacher.id);
    }
    for (const discussion of discussions) {
      discussion.author.isFollowing = followingIds.has(discussion.author.id);
    }
    for (const material of filteredMaterials) {
      material.author.isFollowing = followingIds.has(material.author.id);
    }
    for (const material of trendingMaterials) {
      material.author.isFollowing = followingIds.has(material.author.id);
    }
  }

  return {
    stats: {
      activeTeachers: teachersCount.count || 0,
      sharedMaterials: materialsCount.count || 0,
      openDiscussions: postsCount.count || discussions.length,
    },
    discussions,
    materials: filteredMaterials,
    trendingMaterials,
    recentPublications,
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
}) {
  const supabase = getSupabaseAdminClient();

  const insertPayload = {
    author_id: params.authorId,
    title: params.title,
    body: params.body,
    disciplina: params.disciplina,
    tags: params.tags,
  };

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
          type: "mention",
          actorUserId: params.authorId,
          bodyPreview: `Você foi adicionado(a) na publicação "${params.title}".`,
          targetType: "post",
          targetId: data.id,
          href: `/comunidade/discussao/${data.id}`,
        }),
      ),
    );
  }

  // Notifica seguidores sobre nova publicação no feed
  const { data: followers } = await supabase
    .from("community_followers")
    .select("follower_id")
    .eq("following_id", params.authorId)
    .limit(200);

  const followerIds = [
    ...new Set(
      (followers || [])
        .map((row) => String(row.follower_id || ""))
        .filter((id) => id && id !== params.authorId && !uniqueParticipants.includes(id)),
    ),
  ];

  if (followerIds.length > 0) {
    await Promise.all(
      followerIds.map((userId) =>
        createCommunityNotification({
          userId,
          type: "post",
          actorUserId: params.authorId,
          bodyPreview: params.title.slice(0, 120) || "Nova publicação no feed",
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

/** Cria post e vincula anexos; se o link falhar, remove o post. */
export async function createCommunityPostWithAttachments(params: {
  authorId: string;
  title: string;
  body: string;
  disciplina: string;
  tags: string[];
  participantUserIds?: string[];
  attachments: Array<{
    materialId: string;
    fileName: string;
    fileMime?: string | null;
    sortOrder?: number;
  }>;
}): Promise<{ postId: string; linked: number }> {
  const post = await createCommunityPost({
    authorId: params.authorId,
    title: params.title,
    body: params.body,
    disciplina: params.disciplina,
    tags: params.tags,
    participantUserIds: params.participantUserIds,
  });

  if (!params.attachments.length) {
    return { postId: post.id, linked: 0 };
  }

  try {
    const { linkPostAttachments } = await import(
      "@/server/community/community-post-attachments-service"
    );
    const result = await linkPostAttachments({
      authorId: params.authorId,
      postId: post.id,
      attachments: params.attachments,
    });
    return { postId: post.id, linked: result.linked };
  } catch (error) {
    await deleteCommunityPost({
      authorId: params.authorId,
      postId: post.id,
    }).catch(() => undefined);
    throw error;
  }
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
    type: "follow",
    actorUserId: params.followerId,
    bodyPreview: "começou a seguir você.",
    targetType: "professor",
    targetId: params.followerId,
    href: `/comunidade/professor/${params.followerId}`,
  });

  return { following: true };
}

export type CommunityDiscussionComment = {
  id: string;
  body: string;
  createdAt: string;
  author: DocenteAuthor;
};

export type { CommunityPostAttachment } from "./community-post-attachments-service";

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
  viewerUserId: string | null;
  kind?: "text" | "achievement";
  achievementBadge?: DocenteAchievementBadge;
  comments: CommunityDiscussionComment[];
  participants: DocenteAuthor[];
  relatedDiscussions: DocenteDiscussion[];
  attachments: CommunityPostAttachment[];
};

export type CommunityTeacherDetail = {
  profile: DocenteAuthor;
  schoolName: string | null;
  bio: string | null;
  coverUrl: string | null;
  topComponentes: string[];
  badges: Array<{ slug: string; name: string; color: string; awardedAt: string | null }>;
  materials: Array<{ id: string; title: string; disciplina: string; downloadsCount: number }>;
  discussions: DocenteDiscussion[];
  isFollowing: boolean;
  isOwnProfile: boolean;
  stats: {
    classesCount: number;
    materialsCount: number;
    followersCount: number;
    followingCount: number;
  };
};

export async function getCommunityDiscussionDetail(params: {
  postId: string;
  viewerUserId?: string | null;
}): Promise<CommunityDiscussionDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select(
      "id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at,post_kind,metadata",
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

  const relatedRowsQuery = supabase
    .from("community_posts")
    .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
    .eq("is_published", true)
    .neq("id", params.postId)
    .eq("disciplina", postRow.disciplina)
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: relatedRows } = await relatedRowsQuery;

  const relatedDiscussions: DocenteDiscussion[] = await Promise.all(
    (relatedRows || []).map(async (row) => ({
      id: row.id as string,
      author: await buildAuthor(row.author_id as string, authorMap),
      title: row.title as string,
      disciplina: normalizeDocenteDisciplina(row.disciplina as string),
      tags: (row.tags as string[]) || [],
      createdAt: row.created_at as string,
      commentsCount: row.comments_count as number,
      likesCount: row.likes_count as number,
      likedByMe: false,
      savedByMe: false,
    })),
  );

  const attachments = await listPostAttachments(params.postId);

  const isAchievement = postRow.post_kind === "achievement";
  const meta = (postRow.metadata || {}) as Record<string, unknown>;

  return {
    id: postRow.id,
    title: postRow.title,
    body: postRow.body,
    disciplina: normalizeDocenteDisciplina(postRow.disciplina),
    tags: postRow.tags || [],
    createdAt: postRow.created_at,
    author: await buildAuthor(postRow.author_id, authorMap),
    likesCount: postRow.likes_count,
    commentsCount: postRow.comments_count,
    likedByMe,
    savedByMe,
    isAuthor: params.viewerUserId === postRow.author_id,
    viewerUserId: params.viewerUserId || null,
    kind: isAchievement ? ("achievement" as const) : ("text" as const),
    achievementBadge: isAchievement
      ? {
          name: String(meta.badgeName || postRow.title),
          color: String(meta.badgeColor || "#0891B2"),
          icon: String(meta.badgeIcon || "trophy"),
        }
      : undefined,
    comments,
    participants,
    relatedDiscussions,
    attachments,
  };
}

export async function getCommunityTeacherDetail(params: {
  userId: string;
  viewerUserId?: string | null;
}): Promise<CommunityTeacherDetail | null> {
  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,bio,school_name,community_public,community_reputation,teaching_areas,cover_url,avatar_url")
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
    { count: followingCount },
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
      .from("community_followers")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", params.userId),
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
      disciplina: normalizeDocenteDisciplina(post.disciplina as string),
      tags: (post.tags as string[]) || [],
      createdAt: post.created_at as string,
      commentsCount: post.comments_count as number,
      likesCount: post.likes_count as number,
      likedByMe: false,
      savedByMe: false,
    })),
  );

  const teachingAreas = Array.isArray(profile.teaching_areas)
    ? (profile.teaching_areas as string[]).map((item) => String(item).trim()).filter(Boolean)
    : [];
  const inferredComponentes = [
    ...new Set(
      (materials || [])
        .map((m) => String(m.componente || "").trim())
        .filter((comp) => comp && comp.toLowerCase() !== "multicomponente"),
    ),
  ].slice(0, 3);
  const topComponentes = teachingAreas.length > 0 ? teachingAreas : inferredComponentes;

  return {
    profile: profileAuthor,
    schoolName: (profile.school_name as string | null) || null,
    bio: (profile.bio as string | null) || null,
    coverUrl: (profile.cover_url as string | null) || null,
    topComponentes,
    badges,
    materials: (materials || []).map((m) => ({
      id: m.id as string,
      title: m.title as string,
      disciplina: normalizeDocenteDisciplina(m.componente as string),
      downloadsCount: (m.downloads_count as number) || 0,
    })),
    discussions,
    isFollowing,
    isOwnProfile,
    stats: {
      classesCount: 0,
      materialsCount: profileAuthor.materialsCount,
      followersCount: profileAuthor.followersCount,
      followingCount: followingCount || 0,
    },
  };
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
        type: "mention",
        actorUserId: params.authorId,
        bodyPreview: `Você foi adicionado(a) na publicação "${post.title}".`,
        targetType: "post",
        targetId: params.postId,
        href: `/comunidade/discussao/${params.postId}`,
      }),
    ),
  );

  return { invited: toInvite.length };
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
    .select(
      "id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at,post_kind,metadata",
    )
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
    ordered.map(async (post) => {
      const isAchievement = post.post_kind === "achievement";
      const meta = (post.metadata || {}) as Record<string, unknown>;
      return {
        id: post.id,
        author: await buildAuthor(post.author_id, authorMap),
        title: post.title,
        body: post.body || "",
        disciplina: normalizeDocenteDisciplina(post.disciplina),
        tags: post.tags || [],
        createdAt: post.created_at,
        commentsCount: post.comments_count,
        likesCount: post.likes_count,
        likedByMe: false,
        savedByMe: true,
        kind: isAchievement ? ("achievement" as const) : ("text" as const),
        achievementBadge: isAchievement
          ? {
              name: String(meta.badgeName || post.title),
              color: String(meta.badgeColor || "#0891B2"),
              icon: String(meta.badgeIcon || "trophy"),
            }
          : undefined,
      };
    }),
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
