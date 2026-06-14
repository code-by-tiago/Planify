import { getSupabaseAdminClient } from "../supabase/admin-client";

export type CommunityUserMetrics = {
  materialsCount: number;
  postsCount: number;
  commentsCount: number;
  maxMaterialLikes: number;
  reputation: number;
  completedChallenges: string[];
};

type BadgeCriteria = {
  minMaterials?: number;
  minComments?: number;
  minMaxMaterialLikes?: number;
  minReputation?: number;
  challengeSlug?: string;
};

type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  min_reputation: number;
  criteria: BadgeCriteria | null;
};

export type BadgeProgress = {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  minReputation: number;
  earned: boolean;
  awardedAt: string | null;
  progress: {
    current: number;
    target: number;
    label: string;
  }[];
};

const DEFAULT_CRITERIA: Record<string, BadgeCriteria> = {
  colaborador: { minMaterials: 5, minReputation: 100 },
  mentor: { minComments: 25, minReputation: 500 },
  "top-materiais": { minMaxMaterialLikes: 100, minReputation: 1000 },
  "desafio-bncc": { challengeSlug: "desafio-bncc", minReputation: 300 },
};

function criteriaForBadge(badge: BadgeRow): BadgeCriteria {
  const stored = badge.criteria && typeof badge.criteria === "object" ? badge.criteria : {};
  return { ...DEFAULT_CRITERIA[badge.slug], ...stored };
}

export function computeReputationFromMetrics(metrics: Omit<CommunityUserMetrics, "reputation" | "completedChallenges">) {
  return (
    metrics.materialsCount * 25 +
    metrics.postsCount * 20 +
    metrics.commentsCount * 15 +
    Math.min(metrics.maxMaterialLikes, 400)
  );
}

export async function getCommunityUserMetrics(userId: string): Promise<CommunityUserMetrics> {
  const supabase = getSupabaseAdminClient();

  const [
    materialsCount,
    postsCount,
    commentsCount,
    topMaterial,
    challenges,
  ] = await Promise.all([
    supabase
      .from("marketplace_materials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_published", true),
    supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .eq("is_published", true),
    supabase
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId),
    supabase
      .from("marketplace_materials")
      .select("id")
      .eq("user_id", userId)
      .eq("is_published", true)
      .order("downloads_count", { ascending: false })
      .limit(20),
    supabase
      .from("community_user_challenges")
      .select("challenge_slug")
      .eq("user_id", userId),
  ]);

  let maxMaterialLikes = 0;
  const materialIds = (topMaterial.data || []).map((row) => row.id as string);
  if (materialIds.length > 0) {
    const { data: likeRows } = await supabase
      .from("marketplace_material_likes")
      .select("material_id")
      .in("material_id", materialIds);

    const counts = new Map<string, number>();
    for (const row of likeRows || []) {
      const id = row.material_id as string;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    maxMaterialLikes = Math.max(0, ...Array.from(counts.values()));
  }

  const completedChallenges = (challenges.data || []).map((row) => String(row.challenge_slug));

  const baseMetrics = {
    materialsCount: materialsCount.count || 0,
    postsCount: postsCount.count || 0,
    commentsCount: commentsCount.count || 0,
    maxMaterialLikes,
  };

  const reputation = computeReputationFromMetrics(baseMetrics);

  return {
    ...baseMetrics,
    reputation,
    completedChallenges,
  };
}

export async function syncCommunityReputation(userId: string): Promise<number> {
  const metrics = await getCommunityUserMetrics(userId);
  const supabase = getSupabaseAdminClient();
  await supabase
    .from("profiles")
    .update({ community_reputation: metrics.reputation })
    .eq("id", userId);
  return metrics.reputation;
}

function badgeEligible(badge: BadgeRow, metrics: CommunityUserMetrics): boolean {
  const criteria = criteriaForBadge(badge);
  if ((criteria.minReputation || badge.min_reputation) > metrics.reputation) return false;

  if (criteria.minMaterials && metrics.materialsCount < criteria.minMaterials) return false;
  if (criteria.minComments && metrics.commentsCount < criteria.minComments) return false;
  if (criteria.minMaxMaterialLikes && metrics.maxMaterialLikes < criteria.minMaxMaterialLikes) {
    return false;
  }
  if (criteria.challengeSlug && !metrics.completedChallenges.includes(criteria.challengeSlug)) {
    return false;
  }

  return true;
}

function progressForBadge(badge: BadgeRow, metrics: CommunityUserMetrics, earned: boolean): BadgeProgress["progress"] {
  const criteria = criteriaForBadge(badge);
  const items: BadgeProgress["progress"] = [];

  if (criteria.minMaterials) {
    items.push({
      current: metrics.materialsCount,
      target: criteria.minMaterials,
      label: "materiais publicados",
    });
  }
  if (criteria.minComments) {
    items.push({
      current: metrics.commentsCount,
      target: criteria.minComments,
      label: "comentários de apoio",
    });
  }
  if (criteria.minMaxMaterialLikes) {
    items.push({
      current: metrics.maxMaterialLikes,
      target: criteria.minMaxMaterialLikes,
      label: "curtidas no melhor material",
    });
  }
  if (criteria.challengeSlug) {
    items.push({
      current: metrics.completedChallenges.includes(criteria.challengeSlug) ? 1 : 0,
      target: 1,
      label: "desafio BNCC concluído",
    });
  }

  const repTarget = criteria.minReputation || badge.min_reputation;
  items.push({
    current: metrics.reputation,
    target: repTarget,
    label: "reputação",
  });

  if (earned) {
    return items.map((item) => ({ ...item, current: item.target }));
  }

  return items;
}

export async function awardEligibleBadges(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const metrics = await getCommunityUserMetrics(userId);
  await syncCommunityReputation(userId);

  const { data: badges } = await supabase
    .from("community_badges")
    .select("id,slug,name,description,icon,color,min_reputation,criteria");

  const { data: existing } = await supabase
    .from("community_user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earnedIds = new Set((existing || []).map((row) => row.badge_id as string));
  const newlyAwarded: string[] = [];

  for (const badge of (badges || []) as BadgeRow[]) {
    if (earnedIds.has(badge.id)) continue;
    if (!badgeEligible(badge, metrics)) continue;

    const { error } = await supabase.from("community_user_badges").insert({
      user_id: userId,
      badge_id: badge.id,
    });

    if (!error) {
      newlyAwarded.push(badge.slug);
      earnedIds.add(badge.id);
    }
  }

  return newlyAwarded;
}

export async function getBadgeProgressForUser(userId: string): Promise<BadgeProgress[]> {
  const supabase = getSupabaseAdminClient();
  const metrics = await getCommunityUserMetrics(userId);

  const [{ data: badges }, { data: userBadges }] = await Promise.all([
    supabase
      .from("community_badges")
      .select("id,slug,name,description,icon,color,min_reputation,criteria")
      .order("min_reputation", { ascending: true }),
    supabase
      .from("community_user_badges")
      .select("badge_id,awarded_at")
      .eq("user_id", userId),
  ]);

  const awardedMap = new Map(
    (userBadges || []).map((row) => [row.badge_id as string, row.awarded_at as string]),
  );

  return ((badges || []) as BadgeRow[]).map((badge) => {
    const earned = awardedMap.has(badge.id) || badgeEligible(badge, metrics);
    return {
      id: badge.id,
      slug: badge.slug,
      name: badge.name,
      description: badge.description,
      color: badge.color,
      minReputation: badge.min_reputation,
      earned: awardedMap.has(badge.id),
      awardedAt: awardedMap.get(badge.id) || null,
      progress: progressForBadge(badge, metrics, awardedMap.has(badge.id)),
    };
  });
}

export async function completeCommunityChallenge(params: {
  userId: string;
  challengeSlug: string;
}): Promise<{ completed: boolean; newlyAwarded: string[] }> {
  const supabase = getSupabaseAdminClient();
  const slug = String(params.challengeSlug || "").trim();
  if (!slug) throw new Error("Desafio inválido.");

  const { data: existing } = await supabase
    .from("community_user_challenges")
    .select("id")
    .eq("user_id", params.userId)
    .eq("challenge_slug", slug)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("community_user_challenges").insert({
      user_id: params.userId,
      challenge_slug: slug,
    });
    if (error) throw new Error(error.message);
  }

  const newlyAwarded = await awardEligibleBadges(params.userId);
  return { completed: true, newlyAwarded };
}
