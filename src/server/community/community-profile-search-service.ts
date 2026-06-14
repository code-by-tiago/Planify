import type { CommunityProfileSearchMatchHint } from "@/lib/community/types";
import { formatDisplayNameFromEmail } from "@/lib/auth/format-plan-label";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveCommunityAuthors } from "./marketplace-social-service";

export type CommunityProfileSearchResult = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  schoolName: string | null;
  bio: string | null;
  topComponente: string | null;
  materialsCount: number;
  matchHint?: CommunityProfileSearchMatchHint | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  school_name: string | null;
  bio: string | null;
  community_public: boolean | null;
};

type ScoredResult = CommunityProfileSearchResult & {
  relevanceScore: number;
};

function sanitizeIlikeTerm(value: string): string {
  return value
    .replace(/[%_(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function extractSearchTokens(q: string, school: string): string[] {
  return (q || school)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function profileTextSearchOrFilter(term: string): string {
  return `full_name.ilike.%${term}%,school_name.ilike.%${term}%,bio.ilike.%${term}%,email.ilike.%${term}%`;
}

function buildProfileSearchHaystack(params: {
  displayName: string;
  schoolName: string | null;
  bio: string | null;
  email: string | null;
}): string {
  const emailLabel = params.email ? formatDisplayNameFromEmail(params.email) : "";
  return `${params.displayName} ${params.schoolName || ""} ${params.bio || ""} ${params.email || ""} ${emailLabel}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function scoreProfileMatch(
  item: Pick<CommunityProfileSearchResult, "displayName" | "schoolName" | "bio">,
  tokens: string[],
): { score: number; matchHint: CommunityProfileSearchMatchHint | null } {
  const name = item.displayName.toLowerCase();
  const school = (item.schoolName || "").toLowerCase();
  const bio = (item.bio || "").toLowerCase();

  let score = 0;
  let nameHits = 0;
  let schoolHits = 0;
  let bioHits = 0;

  for (const token of tokens) {
    if (name.includes(token)) {
      nameHits += 1;
      score += name.startsWith(token) ? 40 : 25;
    }
    if (school.includes(token)) {
      schoolHits += 1;
      score += school.startsWith(token) ? 35 : 22;
    }
    if (bio.includes(token)) {
      bioHits += 1;
      score += 8;
    }
  }

  let matchHint: CommunityProfileSearchMatchHint | null = null;
  if (nameHits >= schoolHits && nameHits >= bioHits && nameHits > 0) {
    matchHint = "nome";
  } else if (schoolHits >= bioHits && schoolHits > 0) {
    matchHint = "escola";
  } else if (bioHits > 0) {
    matchHint = "bio";
  }

  return { score, matchHint };
}

export async function searchCommunityProfiles(params: {
  query?: string;
  school?: string;
  component?: string;
  limit?: number;
  excludeUserId?: string;
}): Promise<CommunityProfileSearchResult[]> {
  const supabase = getSupabaseAdminClient();
  const q = sanitizeIlikeTerm((params.query || "").trim().toLowerCase());
  const school = sanitizeIlikeTerm((params.school || "").trim().toLowerCase());
  const component = (params.component || "").trim();
  const limit = Math.min(params.limit || 30, 40);
  const searchTerm = q || school;

  if (searchTerm.length > 0 && searchTerm.length < 2) {
    return [];
  }

  let profileQuery = supabase
    .from("profiles")
    .select("id,email,full_name,school_name,bio,community_public")
    .eq("community_public", true)
    .order("full_name", { ascending: true })
    .limit(200);

  if (params.excludeUserId) {
    profileQuery = profileQuery.neq("id", params.excludeUserId);
  }

  if (school && q && school !== q) {
    profileQuery = profileQuery
      .ilike("school_name", `%${school}%`)
      .or(profileTextSearchOrFilter(q));
  } else if (searchTerm.length >= 2) {
    profileQuery = profileQuery.or(profileTextSearchOrFilter(searchTerm));
  } else if (!component) {
    return [];
  }

  const { data: profiles, error } = await profileQuery;

  if (error || !profiles?.length) {
    return [];
  }

  const profileRows = profiles as ProfileRow[];
  const userIds = profileRows.map((row) => row.id);
  const emailByUserId = new Map(
    profileRows.map((row) => [row.id, row.email?.trim().toLowerCase() || ""]),
  );

  const { data: materials } = await supabase
    .from("marketplace_materials")
    .select("user_id,componente")
    .in("user_id", userIds)
    .eq("is_published", true);

  const componentCountByUser = new Map<string, Map<string, number>>();
  const materialsCountByUser = new Map<string, number>();

  for (const row of materials || []) {
    const userId = String(row.user_id || "");
    if (!userId) continue;

    materialsCountByUser.set(userId, (materialsCountByUser.get(userId) || 0) + 1);

    const comp = String(row.componente || "").trim();
    if (!comp) continue;

    if (!componentCountByUser.has(userId)) {
      componentCountByUser.set(userId, new Map());
    }
    const compMap = componentCountByUser.get(userId)!;
    compMap.set(comp, (compMap.get(comp) || 0) + 1);
  }

  const authors = await resolveCommunityAuthors(userIds);

  let results: ScoredResult[] = profileRows.map((row) => {
    const compMap = componentCountByUser.get(row.id);
    let topComponente: string | null = null;
    let topCount = 0;

    if (compMap) {
      for (const [comp, count] of compMap.entries()) {
        if (count > topCount) {
          topCount = count;
          topComponente = comp;
        }
      }
    }

    const author = authors.get(row.id);

    return {
      userId: row.id,
      displayName: author?.displayName || row.full_name?.trim() || "Professor",
      avatarUrl: author?.avatarUrl || null,
      schoolName: row.school_name?.trim() || null,
      bio: row.bio?.trim() || null,
      topComponente,
      materialsCount: materialsCountByUser.get(row.id) || 0,
      relevanceScore: 0,
      matchHint: null,
    };
  });

  if (component) {
    results = results.filter((item) => item.topComponente === component);
  }

  const tokens = extractSearchTokens(q, school);

  if (tokens.length) {
    results = results
      .filter((item) => {
        const haystack = buildProfileSearchHaystack({
          displayName: item.displayName,
          schoolName: item.schoolName,
          bio: item.bio,
          email: emailByUserId.get(item.userId) || null,
        });
        return tokens.every((token) => haystack.includes(token));
      })
      .map((item) => {
        const { score, matchHint } = scoreProfileMatch(item, tokens);
        return { ...item, relevanceScore: score, matchHint };
      });
  }

  return results
    .sort(
      (a, b) =>
        b.relevanceScore - a.relevanceScore ||
        b.materialsCount - a.materialsCount ||
        a.displayName.localeCompare(b.displayName),
    )
    .slice(0, limit)
    .map(({ relevanceScore: _relevanceScore, ...item }) => item);
}

export async function getUserTopComponentes(userId: string, limit = 3): Promise<string[]> {
  const supabase = getSupabaseAdminClient();

  const { data } = await supabase
    .from("marketplace_materials")
    .select("componente")
    .eq("user_id", userId)
    .eq("is_published", true);

  const counts = new Map<string, number>();

  for (const row of data || []) {
    const comp = String(row.componente || "").trim();
    if (!comp) continue;
    counts.set(comp, (counts.get(comp) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([comp]) => comp);
}
