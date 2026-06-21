import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { TeacherTeachingContext } from "@/types/teaching-context";

export async function fetchTeachingContextFromServer(): Promise<TeacherTeachingContext | null> {
  const response = await planifyAuthenticatedFetch("/api/me/teaching-context", {
    method: "GET",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !data.context) return null;

  return data.context as TeacherTeachingContext;
}

export async function saveTeachingContextToServer(
  context: TeacherTeachingContext,
): Promise<TeacherTeachingContext | null> {
  const response = await planifyAuthenticatedFetch("/api/me/teaching-context", {
    method: "PUT",
    body: JSON.stringify(context),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !data.context) return null;

  return data.context as TeacherTeachingContext;
}
