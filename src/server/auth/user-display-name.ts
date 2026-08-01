import type { User } from "@supabase/supabase-js";
import { formatDisplayNameFromEmail } from "@/lib/auth/format-plan-label";
import { getSupabaseAdminClient } from "../supabase/admin-client";

function normalizeDisplayName(value: unknown): string {
  return String(value || "").trim();
}

export function extractDisplayNameFromUserMetadata(
  metadata: Record<string, unknown> | undefined | null,
): string {
  if (!metadata) {
    return "";
  }

  const fullName = normalizeDisplayName(metadata.full_name);
  if (fullName) {
    return fullName;
  }

  return normalizeDisplayName(metadata.name);
}

async function getProfileDisplayName(userId: string): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const row = data as { full_name?: string | null } | null;
  return normalizeDisplayName(row?.full_name);
}

export function resolveDisplayNameFromSources(params: {
  profileFullName?: string | null;
  userMetadata?: Record<string, unknown> | null;
  email?: string | null;
  fallback?: string;
}): string {
  const profileName = normalizeDisplayName(params.profileFullName);
  if (profileName) {
    return profileName;
  }

  const metadataName = extractDisplayNameFromUserMetadata(params.userMetadata);
  if (metadataName) {
    return metadataName;
  }

  const email = normalizeDisplayName(params.email);
  if (email) {
    return formatDisplayNameFromEmail(email);
  }

  return params.fallback || "Professora";
}

export async function resolveUserDisplayName(params: {
  userId: string;
  userMetadata?: Record<string, unknown> | null;
  email?: string | null;
}): Promise<string> {
  const profileFullName = await getProfileDisplayName(params.userId);

  return resolveDisplayNameFromSources({
    profileFullName,
    userMetadata: params.userMetadata,
    email: params.email,
  });
}

export async function resolveUserDisplayNameFromToken(
  accessToken: string | null,
  fallbackEmail?: string | null,
): Promise<string> {
  if (!accessToken) {
    const email = normalizeDisplayName(fallbackEmail);
    return email ? formatDisplayNameFromEmail(email) : "Professora";
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    const email = normalizeDisplayName(fallbackEmail);
    return email ? formatDisplayNameFromEmail(email) : "Professora";
  }

  return resolveUserDisplayName({
    userId: data.user.id,
    userMetadata: data.user.user_metadata,
    email: data.user.email || fallbackEmail,
  });
}

export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return "Professor";
  }

  return resolveDisplayNameFromSources({
    userMetadata: user.user_metadata,
    email: user.email,
    fallback: "Professor",
  });
}
