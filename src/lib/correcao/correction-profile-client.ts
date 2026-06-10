import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { TeacherCorrectionProfile } from "@/types/correction";

export async function fetchCorrectionProfileFromServer(): Promise<TeacherCorrectionProfile | null> {
  const response = await planifyAuthenticatedFetch("/api/correcao/perfil", {
    method: "GET",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !data.profile) return null;

  return data.profile as TeacherCorrectionProfile;
}

export async function saveCorrectionProfileToServer(
  profile: TeacherCorrectionProfile,
): Promise<TeacherCorrectionProfile | null> {
  const response = await planifyAuthenticatedFetch("/api/correcao/perfil", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !data.profile) return null;

  return data.profile as TeacherCorrectionProfile;
}
