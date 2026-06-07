import { NextRequest, NextResponse } from "next/server";
import { isAuthOnlyRoute, isProtectedRoute } from "./config/protected-routes";
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

  if (!token || !looksLikeJwt(token) || !isJwtNotExpired(token)) {
    return redirectToLogin(request);
  }

  const access = await verifyPremiumAccess(token);

  if (!access.authenticated) {
    return redirectToLogin(request);
  }

  if (authOnly) {
    return NextResponse.next();
  }

  if (!access.premium) {
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
