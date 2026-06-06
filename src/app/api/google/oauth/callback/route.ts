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

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "920c67",
    },
    body: JSON.stringify({
      sessionId: "920c67",
      runId: "google-oauth-pre-fix",
      hypothesisId: "B",
      location: "oauth/callback/route.ts:GET",
      message: "oauth callback received",
      data: {
        hasCode: Boolean(code),
        hasStateRaw: Boolean(stateRaw),
        stateValid: Boolean(state),
        returnTo: state?.returnTo || null,
        oauthError: error || null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!code || !state) {
    return redirectWith(request, "/editor", {
      google_error: "Resposta OAuth inválida. Tente conectar de novo.",
    });
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    await saveGoogleTokensForUser(state.userId, tokens);

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "920c67",
      },
      body: JSON.stringify({
        sessionId: "920c67",
        runId: "google-oauth-pre-fix",
        hypothesisId: "D",
        location: "oauth/callback/route.ts:success",
        message: "oauth success redirect",
        data: {
          returnTo: state.returnTo || "/editor",
          userId: state.userId,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return redirectWith(request, "/google/retorno", {
      returnTo: state.returnTo || "/dashboard?secao=editor",
      google: "connected",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao conectar conta Google.";

    return redirectWith(request, "/google/retorno", {
      returnTo: state.returnTo || "/dashboard?secao=editor",
      google_error: message,
    });
  }
}
