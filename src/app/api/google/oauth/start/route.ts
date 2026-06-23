import { NextRequest, NextResponse } from "next/server";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { buildGoogleAuthUrl, getGoogleConfigStatus } from "../../../../../server/google/google-oauth";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeReturnTo(value: unknown): string {
  const raw = String(value || "/dashboard?secao=editor").trim();

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard?secao=editor";
  }

  return normalizeGoogleOAuthReturnTo(raw);
}

export async function POST(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Google OAuth não configurado no servidor. Siga docs/google/CONFIGURAR-GOOGLE-CLOUD.md",
          missingEnv: config.missing,
        },
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { returnTo?: string };
  const returnTo = sanitizeReturnTo(body.returnTo);
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Faça login no Planify antes de conectar o Google.",
        },
      },
      { status: 401 },
    );
  }

  const url = buildGoogleAuthUrl({
    userId: user.id,
    returnTo,
    exp: Date.now() + 15 * 60 * 1000,
  });

  return NextResponse.json({ success: true, url });
}

export async function GET(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return NextResponse.redirect(
      new URL(
        `/dashboard?secao=editor&google_error=${encodeURIComponent("Google OAuth não configurado no servidor.")}`,
        request.url,
      ),
    );
  }

  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const url = buildGoogleAuthUrl({
    userId: user.id,
    returnTo,
    exp: Date.now() + 15 * 60 * 1000,
  });

  return NextResponse.redirect(url);
}
