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
  reason?: string;
  role?: string;
  displayName?: string;
  avatarUrl?: string | null;
  planKey?: string | null;
  tier?: string;
  profileRole?: string;
  schoolId?: string | null;
  schoolMembershipRole?: string | null;
  hasSchoolMembership?: boolean;
  isSchoolManager?: boolean;
  isDirector?: boolean;
  canViewBnccProgress?: boolean;
  isSiteAdmin?: boolean;
  checkedAt?: string;
};

type FetchAccessStatusOptions = {
  forceRefresh?: boolean;
};

type AccessStatusCacheEntry = {
  expiresAt: number;
  promise: Promise<PlanifyFullAccessStatus>;
};

const ACCESS_STATUS_DEDUPE_MS = 2500;
const accessStatusCache = new Map<string, AccessStatusCacheEntry>();

function buildAccessStatusCacheKey(accessToken?: string | null) {
  return accessToken ? `bearer:${accessToken}` : "cookie";
}

function normalizeFullAccessStatus(
  data: PlanifyFullAccessStatus | null,
): PlanifyFullAccessStatus {
  return {
    authenticated: Boolean(data?.authenticated),
    premium: Boolean(data?.premium),
    email: data?.email,
    message: data?.message,
    reason: data?.reason,
    isOwner: Boolean(data?.isOwner),
    isAdmin: Boolean(data?.isAdmin),
    isManagerView: Boolean(data?.isManagerView),
    canViewDirectorPanel: Boolean(data?.canViewDirectorPanel),
    role: data?.role,
    displayName: data?.displayName,
    avatarUrl:
      typeof data?.avatarUrl === "string" && data.avatarUrl.trim()
        ? data.avatarUrl
        : null,
    planKey: data?.planKey ?? null,
    tier: data?.tier,
    profileRole: data?.profileRole,
    schoolId: data?.schoolId ?? null,
    schoolMembershipRole: data?.schoolMembershipRole ?? null,
    hasSchoolMembership: Boolean(data?.hasSchoolMembership),
    isSchoolManager: Boolean(data?.isSchoolManager),
    isDirector: Boolean(data?.isDirector),
    canViewBnccProgress: Boolean(data?.canViewBnccProgress),
    isSiteAdmin: Boolean(data?.isSiteAdmin),
    checkedAt: data?.checkedAt,
  };
}

export function clearPlanifyAccessStatusCache() {
  accessStatusCache.clear();
}

export async function fetchPlanifyAccessStatus(
  accessToken?: string | null,
  options?: FetchAccessStatusOptions,
): Promise<PlanifyAccessStatus> {
  const full = await fetchFullPlanifyAccessStatus(accessToken, options);
  return {
    authenticated: full.authenticated,
    premium: full.premium,
    email: full.email,
    message: full.message,
  };
}

export async function fetchFullPlanifyAccessStatus(
  accessToken?: string | null,
  options: FetchAccessStatusOptions = {},
): Promise<PlanifyFullAccessStatus> {
  const key = buildAccessStatusCacheKey(accessToken);
  const now = Date.now();
  const cached = accessStatusCache.get(key);

  if (!options.forceRefresh && cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const promise = fetch("/api/access/status", {
    cache: "no-store",
    credentials: "include",
    headers,
  })
    .then(async (response) => {
      const data = (await response.json().catch(() => null)) as
        | PlanifyFullAccessStatus
        | null;

      return normalizeFullAccessStatus(data);
    })
    .catch((error) => {
      accessStatusCache.delete(key);
      throw error;
    });

  accessStatusCache.set(key, {
    expiresAt: now + ACCESS_STATUS_DEDUPE_MS,
    promise,
  });

  return promise;
}
