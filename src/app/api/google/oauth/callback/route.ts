import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleAuthCode,
  getGoogleConfigStatus,
} from "../../../../../server/google/google-oauth";
import { verifyGoogleOAuthState } from "../../../../../server/google/google-auth";
import { saveGoogleTokensForUser } from "../../../../../server/google/google-token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWith(
  request: NextRequest,
  path: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL(path, request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getGoogleConfigStatus();

  if (!config.configured) {
    return redirectWith(request, "/editor", {
      google_error: "Google OAuth não configurado no servidor.",
    });
  }

  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return redirectWith(request, "/editor", {
      google_error: `Autorização cancelada ou negada (${error}).`,
    });
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateRaw = request.nextUrl.searchParams.get("state");
  const state = stateRaw ? verifyGoogleOAuthState(stateRaw) : null;

  if (!code || !state) {
    return redirectWith(request, "/editor", {
      google_error: "Resposta OAuth inválida. Tente conectar de novo.",
    });
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    await saveGoogleTokensForUser(state.userId, tokens);

    return redirectWith(request, state.returnTo || "/editor", {
      google: "connected",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao conectar conta Google.";

    return redirectWith(request, state.returnTo || "/editor", {
      google_error: message,
    });
  }
}
