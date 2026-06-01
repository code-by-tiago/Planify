import { NextRequest, NextResponse } from "next/server";
import { isAdminRoute, isProtectedRoute } from "./src/config/protected-routes";
import type { AccessCookiePayload } from "./src/types/access";

const COOKIE_NAME = "planify_access";

function tryParseJSON(value: string): AccessCookiePayload | null {
  try {
    const parsed = JSON.parse(value) as AccessCookiePayload;

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string | null {
  try {
    let normalized = value.replace(/-/g, "+").replace(/_/g, "/");

    while (normalized.length % 4 !== 0) {
      normalized += "=";
    }

    return atob(normalized);
  } catch {
    return null;
  }
}

function decodeAccessCookie(value: string | undefined): AccessCookiePayload | null {
  if (!value) {
    return null;
  }

  const direct = tryParseJSON(value);

  if (direct) {
    return direct;
  }

  try {
    const decodedUri = decodeURIComponent(value);
    const fromUri = tryParseJSON(decodedUri);

    if (fromUri) {
      return fromUri;
    }
  } catch {
    // Continua para compatibilidade com cookies antigos.
  }

  const decodedBase64 = decodeBase64Url(value);

  if (decodedBase64) {
    const fromBase64 = tryParseJSON(decodedBase64);

    if (fromBase64) {
      return fromBase64;
    }
  }

  return null;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

function redirectToPlans(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/planos";
  url.search = "";
  url.searchParams.set("premium", "required");
  url.searchParams.set("redirect", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

function redirectToDenied(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/acesso-negado";
  url.search = "";
  url.searchParams.set("redirect", request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  // PLANIFY_ADMIN_GATE_PUBLIC_OPTIONS_9154
  // Admin tem guarda própria e não deve cair no fluxo de professor premium.
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const access = decodeAccessCookie(cookie);

  if (!access?.authenticated) {
    return redirectToLogin(request);
  }

  if (!access.premium) {
    return redirectToPlans(request);
  }

  if (isAdminRoute(pathname) && access.role !== "admin") {
    return redirectToDenied(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planejamentos/:path*",
    "/materiais/:path*",
    "/editor/:path*",
    "/historico/:path*",
    "/biblioteca/:path*",
    "/marketplace/:path*",
    "/admin/:path*",
  ],
};
