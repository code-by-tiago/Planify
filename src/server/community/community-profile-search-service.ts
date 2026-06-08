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
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  school_name: string | null;
  bio: string | null;
  community_public: boolean | null;
};

export async function searchCommunityProfiles(params: {
  query?: string;
  school?: string;
  component?: string;
  limit?: number;
}): Promise<CommunityProfileSearchResult[]> {
  const supabase = getSupabaseAdminClient();
  const q = (params.query || "").trim().toLowerCase();
  const school = (params.school || "").trim().toLowerCase();
  const component = (params.component || "").trim();
  const limit = Math.min(params.limit || 20, 40);

  let profileQuery = supabase
    .from("profiles")
    .select("id,full_name,school_name,bio,community_public")
    .eq("community_public", true)
    .limit(100);

  if (school) {
    profileQuery = profileQuery.ilike("school_name", `%${school}%`);
  }

  if (q) {
    profileQuery = profileQuery.or(`full_name.ilike.%${q}%,bio.ilike.%${q}%`);
  }

  const { data: profiles, error } = await profileQuery;

  if (error || !profiles?.length) {
    return [];
  }

  const profileRows = profiles as ProfileRow[];
  const userIds = profileRows.map((row) => row.id);

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

  let results: CommunityProfileSearchResult[] = profileRows.map((row) => {
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
    };
  });

  if (component) {
    results = results.filter((item) => item.topComponente === component);
  }

  if (q) {
    results = results.filter((item) => {
      const haystack = `${item.displayName} ${item.schoolName || ""} ${item.bio || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  return results
    .sort((a, b) => b.materialsCount - a.materialsCount || a.displayName.localeCompare(b.displayName))
    .slice(0, limit);
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
