import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getValidGoogleAccessToken } from "../google/google-token-store";

export function normalizeAvatarUrl(value: unknown): string | null {
  const url = String(value || "").trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return null;
  }

  return url;
}

export function extractAvatarFromUserMetadata(
  metadata: Record<string, unknown> | undefined | null,
): string | null {
  if (!metadata) {
    return null;
  }

  return (
    normalizeAvatarUrl(metadata.avatar_url) ||
    normalizeAvatarUrl(metadata.picture) ||
    normalizeAvatarUrl(metadata.photo_url)
  );
}

async function getProfileAvatarUrl(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const row = data as { avatar_url?: string | null } | null;
  return normalizeAvatarUrl(row?.avatar_url);
}

async function getGoogleAvatarUrl(userId: string): Promise<string | null> {
  try {
    const { accessToken } = await getValidGoogleAccessToken(userId);
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { picture?: string };
    return normalizeAvatarUrl(data.picture);
  } catch {
    return null;
  }
}

export async function resolveUserAvatarUrl(params: {
  userId: string;
  userMetadata?: Record<string, unknown> | null;
  /** When true, return null instead of fetching Google OAuth picture (initials fallback in UI). */
  skipGoogleFallback?: boolean;
}): Promise<string | null> {
  const fromProfile = await getProfileAvatarUrl(params.userId);

  if (fromProfile) {
    return fromProfile;
  }

  const fromMetadata = extractAvatarFromUserMetadata(params.userMetadata);

  if (fromMetadata) {
    return fromMetadata;
  }

  if (params.skipGoogleFallback) {
    return null;
  }

  return getGoogleAvatarUrl(params.userId);
}

export async function resolveUserAvatarFromToken(
  accessToken: string | null,
): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return resolveUserAvatarUrl({
    userId: data.user.id,
    userMetadata: data.user.user_metadata,
  });
}
