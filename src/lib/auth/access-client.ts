import type { PremiumAccessResult } from "../../types/access";

export type AccessCookieResponse = {
  success: boolean;
  access: PremiumAccessResult;
  inviteSyncWarning?: string | null;
};

export async function checkPremiumAccess(accessToken: string): Promise<PremiumAccessResult> {
  const response = await fetch("/api/auth/access", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = (await response.json()) as {
    success: boolean;
    access: PremiumAccessResult;
  };

  return json.access;
}

export async function syncPremiumAccessCookie(
  accessToken: string,
): Promise<AccessCookieResponse> {
  const response = await fetch("/api/auth/access-cookie", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return (await response.json()) as AccessCookieResponse;
}

export async function clearPremiumAccessCookie(): Promise<void> {
  await fetch("/api/auth/access-cookie", {
    method: "DELETE",
    credentials: "include",
  });
}

export type PlanifyAccessStatus = {
  authenticated: boolean;
  premium: boolean;
  email?: string;
  message?: string;
};

export type PlanifyFullAccessStatus = PlanifyAccessStatus & {
  isOwner?: boolean;
  isAdmin?: boolean;
  isManagerView?: boolean;
  canViewDirectorPanel?: boolean;
};

export async function fetchPlanifyAccessStatus(
  accessToken?: string | null,
): Promise<PlanifyAccessStatus> {
  const full = await fetchFullPlanifyAccessStatus(accessToken);
  return {
    authenticated: full.authenticated,
    premium: full.premium,
    email: full.email,
    message: full.message,
  };
}

export async function fetchFullPlanifyAccessStatus(
  accessToken?: string | null,
): Promise<PlanifyFullAccessStatus> {
  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const response = await fetch("/api/access/status", {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  const data = (await response.json().catch(() => null)) as
    | PlanifyFullAccessStatus
    | null;

  return {
    authenticated: Boolean(data?.authenticated),
    premium: Boolean(data?.premium),
    email: data?.email,
    message: data?.message,
    isOwner: Boolean(data?.isOwner),
    isAdmin: Boolean(data?.isAdmin),
    isManagerView: Boolean(data?.isManagerView),
    canViewDirectorPanel: Boolean(data?.canViewDirectorPanel),
  };
}
