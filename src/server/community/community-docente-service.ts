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
  isAdmin: boolean;
  featuredTeacher: DocenteAuthor | null;
  teachers: DocenteAuthor[];
};

async function buildAuthor(
  userId: string,
  authorMap: Map<string, { userId: string; displayName: string; avatarUrl: string | null }>,
  fallbackName?: string | null,
): Promise<DocenteAuthor> {
  const summary = authorMap.get(userId);
  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("community_reputation, bio")
    .eq("id", userId)
    .maybeSingle();

  const { count: materialsCount } = await supabase
    .from("marketplace_materials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_published", true);

  const { count: followersCount } = await supabase
    .from("community_followers")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId);

  return {
    id: userId,
    name: summary?.displayName || fallbackName || "Professor(a)",
    avatarUrl: summary?.avatarUrl || null,
    specialty: String(profile?.bio || "Educador(a) Planify").slice(0, 80),
    materialsCount: materialsCount || 0,
    followersCount: followersCount || 0,
    reputation: Number(profile?.community_reputation || 0),
    badges: [],
    isFollowing: false,
  };
}

function formatEventMonth(iso: string): { day: number; month: string } {
  const date = new Date(iso);
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return { day: date.getDate(), month: months[date.getMonth()] || "JUN" };
}

export async function getCommunityDocenteOverview(params: {
  viewerUserId?: string | null;
  search?: string;
  isAdmin?: boolean;
}): Promise<CommunityDocenteOverview> {
  const supabase = getSupabaseAdminClient();
  const search = String(params.search || "").trim().toLowerCase();

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
    supabase
      .from("community_posts")
      .select("id,author_id,title,body,disciplina,tags,likes_count,comments_count,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12),
    params.viewerUserId
      ? supabase
          .from("community_post_participants")
          .select("post_id")
          .eq("user_id", params.viewerUserId)
          .order("invited_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("marketplace_materials")
      .select(
        "id,user_id,author_name,title,description,componente,ano_serie,file_mime,downloads_count,created_at",
      )
      .eq("is_published", true)
      .order("downloads_count", { ascending: false })
      .limit(12),
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
      .order("members_count", { ascending: false })
      .limit(8),
    supabase
      .from("community_badges")
      .select("id,slug,name,description,icon,color,min_reputation")
      .order("min_reputation", { ascending: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
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
      .eq("is_public", true),
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
  let followingIds = new Set<string>();
  let joinedGroupIds = new Set<string>();
  let badgeProgress: BadgeProgress[] = [];

  if (params.viewerUserId) {
    const [likes, matLikes, savedIds, following, groupMemberships] = await Promise.all([
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
    followingIds = new Set((following.data || []).map((r) => r.following_id as string));
    joinedGroupIds = new Set((groupMemberships.data || []).map((r) => r.group_id as string));

    await awardEligibleBadges(params.viewerUserId);
    badgeProgress = await getBadgeProgressForUser(params.viewerUserId);
  }

  const discussionsFromPosts: DocenteDiscussion[] = await Promise.all(
    mergedPosts.map(async (post) => ({
      id: post.id,
      author: await buildAuthor(post.author_id, authorMap),
      title: post.title,
      disciplina: asDisciplina(post.disciplina),
      tags: post.tags || [],
      createdAt: post.created_at,
      commentsCount: post.comments_count,
      likesCount: post.likes_count,
      likedByMe: likedPostIds.has(post.id),
      savedByMe: false,
    })),
  );

  const materialIds = marketplaceRows.map((m) => m.id);
  const [likesSummary, commentsBatch] = await Promise.all([
    getMaterialLikesSummary({
      materialIds,
      viewerUserId: params.viewerUserId || null,
    }),
    getMaterialCommentsBatch(materialIds),
  ]);

  const discussionsFromMaterials: DocenteDiscussion[] = await Promise.all(
    marketplaceRows.slice(0, 4).map(async (row) => {
      const userId = row.user_id || "unknown";
      const comments = commentsBatch.get(row.id) || [];
      const likes = likesSummary.get(row.id);
      return {
        id: `mat-disc-${row.id}`,
        author: await buildAuthor(userId, authorMap, row.author_name),
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
    marketplaceRows.map(async (row) => {
      const userId = row.user_id || "unknown";
      const likes = likesSummary.get(row.id);
      return {
        id: row.id,
        title: row.title,
        disciplina: asDisciplina(row.componente),
        anoSerie: row.ano_serie || "Geral",
        author: await buildAuthor(userId, authorMap, row.author_name),
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

  let recentPublications: DocenteRecentPublication[] = marketplaceRows.slice(0, 4).map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: coverForComponente(row.componente || "Ciências"),
    authorName: row.author_name || "Professor(a)",
    createdAt: row.created_at || new Date().toISOString(),
    href: `/marketplace/material/${row.id}`,
  }));

  if (recentPublications.length === 0 && mergedPosts.length > 0) {
    recentPublications = await Promise.all(
      mergedPosts.slice(0, 4).map(async (post) => {
        const author = await buildAuthor(post.author_id, authorMap);
        return {
          id: post.id,
          title: post.title,
          thumbnailUrl: coverForComponente(post.disciplina),
          authorName: author.name,
          createdAt: post.created_at,
          href: `/comunidade?discussao=${post.id}`,
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

  const { data: profileTeachers } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,bio,community_reputation")
    .eq("community_public", true)
    .order("community_reputation", { ascending: false })
    .limit(8);

  const teacherIds = (profileTeachers || []).map((p) => p.id as string);
  const teacherAuthorMap = await resolveCommunityAuthors(teacherIds);

  const teachers: DocenteAuthor[] = await Promise.all(
    (profileTeachers || []).map(async (p) => {
      const author = await buildAuthor(p.id as string, teacherAuthorMap, p.full_name);
      author.specialty = String(p.bio || author.specialty).slice(0, 80);
      author.reputation = Number(p.community_reputation || 0);
      if (params.viewerUserId) {
        author.isFollowing = followingIds.has(author.id);
      }
      return author;
    }),
  );

  const topTeacherId = marketplaceRows[0]?.user_id;
  let featuredTeacher: DocenteAuthor | null = null;

  if (topTeacherId) {
    featuredTeacher = await buildAuthor(topTeacherId, authorMap, marketplaceRows[0]?.author_name);
  } else if (teachers.length > 0) {
    featuredTeacher = { ...teachers[0] };
  } else if (params.viewerUserId) {
    featuredTeacher = await buildAuthor(params.viewerUserId, authorMap);
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
    isAdmin: Boolean(params.isAdmin),
    featuredTeacher,
    teachers,
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
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: params.authorId,
      title: params.title,
      body: params.body,
      disciplina: params.disciplina,
      tags: params.tags,
    })
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
    const { count: memberCount } = await supabase
      .from("community_group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", params.groupId);

    if ((memberCount || 0) > 1) {
      throw new Error("Como dono(a) do grupo, transfira a liderança antes de sair.");
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
