import { NextRequest, NextResponse } from "next/server";
import { isAuthOnlyRoute, isProtectedRoute } from "./config/protected-routes";
import {
  isAccessCookieGraceValid,
  parseAccessCookiePayload,
} from "./lib/auth/access-cookie-server";
import {
  getRequestAccessToken,
  isJwtNotExpired,
  looksLikeJwt,
} from "./server/auth/api-access";
import { verifyPremiumAccess } from "./server/auth/premium-access-service";

function debugProxyLog(payload: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3ed578",
    },
    body: JSON.stringify({
      sessionId: "3ed578",
      runId: "auth-session-debug",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
  // #endregion
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

function redirectToPlans(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/planos";
  url.search = "";
  url.searchParams.set("premium", "required");
  url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const authOnly = isAuthOnlyRoute(pathname);
  const premiumProtected = isProtectedRoute(pathname);

  if (!authOnly && !premiumProtected) {
    return NextResponse.next();
  }

  const token = getRequestAccessToken(request);
  const accessPayload = parseAccessCookiePayload(request);
  const graceOk = isAccessCookieGraceValid(accessPayload);
  const hasValidJwt =
    Boolean(token && looksLikeJwt(token) && isJwtNotExpired(token));

  debugProxyLog({
    hypothesisId: "H1-H2",
    location: "proxy.ts:authCheck",
    message: "protected route auth decision",
    data: {
      pathname,
      hasToken: Boolean(token),
      hasValidJwt,
      graceOk,
      gracePremium: Boolean(accessPayload?.premium),
    },
  });

  if (!hasValidJwt) {
    if (graceOk) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }

  let access;
  try {
    access = await verifyPremiumAccess(token);
  } catch {
    return NextResponse.json(
      { error: { message: "Serviço temporariamente indisponível. Tente novamente." } },
      { status: 503 },
    );
  }

  if (!access.authenticated) {
    if (graceOk) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }

  if (authOnly) {
    return NextResponse.next();
  }

  if (!access.premium) {
    if (graceOk && accessPayload?.premium) {
      return NextResponse.next();
    }
    return redirectToPlans(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/planejamentos",
    "/planejamentos/:path*",
    "/materiais",
    "/materiais/:path*",
    "/inclusao",
    "/inclusao/:path*",
    "/editor",
    "/editor/:path*",
    "/historico",
    "/historico/:path*",
    "/biblioteca",
    "/biblioteca/:path*",
    "/marketplace",
    "/marketplace/:path*",
    "/progresso-bncc",
    "/progresso-bncc/:path*",
    "/bncc",
    "/bncc/:path*",
    "/diretor",
    "/diretor/:path*",
    "/gestor",
    "/gestor/:path*",
  ],
};
