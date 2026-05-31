import { NextRequest, NextResponse } from "next/server";
import type { AccessCookiePayload } from "../../../../types/access";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "planify_access";
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
  const access = await verifyPremiumAccess(token);

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
    },
    { status: access.authenticated ? 200 : 401 },
  );

  response.cookies.set(COOKIE_NAME, encodeCookie(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

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

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}
