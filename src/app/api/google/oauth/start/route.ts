import { NextRequest, NextResponse } from "next/server";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import {
  extractEmailDomain,
  isValidGoogleEmail,
  normalizeGoogleEmail,
} from "@/lib/google/classroom-google-account";
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

function resolveOAuthHintParams(body: {
  loginHint?: string;
  hostedDomain?: string;
}): { loginHint?: string; hostedDomain?: string } {
  const loginHint = normalizeGoogleEmail(body.loginHint);
  if (!loginHint || !isValidGoogleEmail(loginHint)) {
    return {};
  }

  const hostedDomain =
    normalizeGoogleEmail(body.hostedDomain) ||
    extractEmailDomain(loginHint) ||
    undefined;

  return {
    loginHint,
    ...(hostedDomain ? { hostedDomain } : {}),
  };
}

function buildOAuthUrlForUser(
  userId: string,
  returnTo: string,
  options: {
    selectAccount?: boolean;
    loginHint?: string;
    hostedDomain?: string;
  },
): string {
  const selectAccount = options.selectAccount !== false;
  const hintParams = resolveOAuthHintParams({
    loginHint: options.loginHint,
    hostedDomain: options.hostedDomain,
  });

  return buildGoogleAuthUrl(
    {
      userId,
      returnTo,
      exp: Date.now() + 15 * 60 * 1000,
    },
    {
      promptMode: selectAccount ? "select_account consent" : "consent",
      ...hintParams,
    },
  );
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

  const body = (await request.json().catch(() => ({}))) as {
    returnTo?: string;
    selectAccount?: boolean;
    loginHint?: string;
    hostedDomain?: string;
  };
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

  const url = buildOAuthUrlForUser(user.id, returnTo, {
    selectAccount: body.selectAccount,
    loginHint: body.loginHint,
    hostedDomain: body.hostedDomain,
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
  const loginHint = request.nextUrl.searchParams.get("loginHint") || undefined;
  const hostedDomain = request.nextUrl.searchParams.get("hostedDomain") || undefined;
  const url = buildOAuthUrlForUser(user.id, returnTo, {
    selectAccount: request.nextUrl.searchParams.get("selectAccount") !== "false",
    loginHint,
    hostedDomain,
  });

  return NextResponse.redirect(url);
}
