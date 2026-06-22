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

function allowGracePass(params: {
  authOnly: boolean;
  premiumProtected: boolean;
  accessPayload: ReturnType<typeof parseAccessCookiePayload>;
}): boolean {
  if (params.authOnly) {
    return true;
  }
  if (params.premiumProtected) {
    return Boolean(params.accessPayload?.premium);
  }
  return true;
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

  if (!hasValidJwt) {
    if (graceOk) {
      if (allowGracePass({ authOnly, premiumProtected, accessPayload })) {
        return NextResponse.next();
      }
      return redirectToPlans(request);
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
    if (graceOk && allowGracePass({ authOnly, premiumProtected, accessPayload })) {
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
    "/aula-completa",
    "/aula-completa/:path*",
    "/correcao",
    "/correcao/:path*",
    "/editor",
    "/editor/:path*",
    "/historico",
    "/historico/:path*",
    "/biblioteca",
    "/biblioteca/:path*",
    "/marketplace",
    "/marketplace/:path*",
    "/comunidade",
    "/comunidade/:path*",
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
