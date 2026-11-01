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

const PRODUCTION_SITE_OFFLINE =
  process.env.VERCEL_ENV === "production" && process.env.SITE_OFFLINE !== "0";

function productionMaintenanceResponse() {
  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Planify em manutenção</title>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; }
      body { display: grid; min-height: 100vh; place-items: center; margin: 0; background: #f8fafc; color: #0a192f; }
      main { max-width: 560px; padding: 32px; text-align: center; }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { color: #475569; line-height: 1.6; }
      a { color: #0a6b83; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>Planify em manutenção</h1>
      <p>O ambiente público está temporariamente indisponível enquanto finalizamos a configuração segura das integrações.</p>
      <p>O código-fonte e as instruções técnicas estão disponíveis no <a href="https://github.com/code-by-tiago/Planify">repositório GitHub</a>.</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "3600",
        "Cache-Control": "no-store",
      },
    },
  );
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
  if (PRODUCTION_SITE_OFFLINE) {
    return productionMaintenanceResponse();
  }

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
    "/((?!_next/static|_next/image|favicon.ico).*)",
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
