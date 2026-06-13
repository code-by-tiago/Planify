import type { NextRequest } from "next/server";
import type { AccessCookiePayload } from "@/types/access";

/** Matches planify_access httpOnly cookie maxAge (7 days). */
export const ACCESS_COOKIE_GRACE_MS = 60 * 60 * 24 * 7 * 1000;

export function parseAccessCookiePayload(
  request: NextRequest,
): AccessCookiePayload | null {
  const raw = request.cookies.get("planify_access")?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(raw)) as AccessCookiePayload;
  } catch {
    try {
      return JSON.parse(raw) as AccessCookiePayload;
    } catch {
      return null;
    }
  }
}

export function isAccessCookieGraceValid(
  payload: AccessCookiePayload | null,
): boolean {
  if (!payload?.authenticated) {
    return false;
  }

  const checkedAt = Date.parse(payload.checkedAt);
  if (!Number.isFinite(checkedAt)) {
    return false;
  }

  return Date.now() - checkedAt < ACCESS_COOKIE_GRACE_MS;
}
