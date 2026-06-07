import { NextRequest, NextResponse } from "next/server";
import type { AccessCookiePayload } from "../../../../types/access";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import { acceptPendingSchoolInvites } from "../../../../server/schools/accept-pending-school-invites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "planify_access";
const SESSION_COOKIE_NAME = "planify_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieRole = AccessCookiePayload["role"];

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function normalizeCookieRole(role: string | null | undefined): CookieRole {
  if (role === "admin") {
    return "admin" as CookieRole;
  }

  return "teacher" as CookieRole;
}

function encodeCookie(payload: AccessCookiePayload): string {
  return encodeURIComponent(JSON.stringify(payload));
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  let access = await verifyPremiumAccess(token);

  let inviteSyncWarning: string | null = null;

  if (access.authenticated && access.user?.id && access.user.email) {
    try {
      const inviteResult = await acceptPendingSchoolInvites(
        access.user.id,
        access.user.email,
      );

      if (inviteResult.acceptedCount > 0 || inviteResult.proGranted) {
        access = await verifyPremiumAccess(token);
      }
    } catch (error) {
      console.error("planify:school-invite-sync-failed", {
        userId: access.user?.id,
        message: error instanceof Error ? error.message : "unknown",
      });
      inviteSyncWarning =
        "Não foi possível aplicar convites escolares pendentes. Tente entrar novamente em alguns instantes.";
    }
  }

  const payload: AccessCookiePayload = {
    authenticated: access.authenticated,
    premium: access.premium,
    role: normalizeCookieRole(access.user?.role),
    checkedAt: new Date().toISOString(),
  };

  const response = NextResponse.json(
    {
      success: access.premium,
      access,
      cookiePayload: payload,
      inviteSyncWarning,
    },
    { status: access.authenticated ? 200 : 401 },
  );

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  };

  response.cookies.set(COOKIE_NAME, encodeCookie(payload), cookieOptions);

  if (token) {
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Cookie de acesso removido.",
    },
    { status: 200 },
  );

  const clearOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  };

  response.cookies.set(COOKIE_NAME, "", clearOptions);
  response.cookies.set(SESSION_COOKIE_NAME, "", clearOptions);

  return response;
}
