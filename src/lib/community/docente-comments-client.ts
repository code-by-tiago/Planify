import type { DocenteComment } from "@/lib/community/docente-types";

/** Carrega os comentários de uma publicação da comunidade. */
export async function loadDiscussionComments(discussionId: string): Promise<DocenteComment[]> {
  try {
    const response = await fetch(`/api/community/docente/discussao/${discussionId}`, {
      credentials: "include",
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok || !data?.ok) return [];
    return (data.discussion?.comments as DocenteComment[]) || [];
  } catch {
    return [];
  }
}
