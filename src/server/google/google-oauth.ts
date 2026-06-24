import {
  GOOGLE_OAUTH_SCOPES,
  requireGoogleConfig,
  type GoogleConfigStatus,
  getGoogleConfigStatus,
} from "./google-config";
import type { GoogleOAuthStatePayload } from "./google-auth";
import { signGoogleOAuthState } from "./google-auth";

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
};

export type GoogleOAuthPromptMode = "consent" | "select_account consent" | "select_account";

export function buildGoogleAuthUrl(
  payload: GoogleOAuthStatePayload,
  options?: { promptMode?: GoogleOAuthPromptMode },
): string {
  const { clientId, redirectUri } = requireGoogleConfig();
  const state = signGoogleOAuthState(payload);
  const prompt = options?.promptMode ?? "select_account consent";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt,
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(
  code: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = requireGoogleConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await response.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Falha ao trocar código OAuth do Google.",
    );
  }

  return data;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireGoogleConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json()) as GoogleTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Não foi possível renovar o token Google.",
    );
  }

  return data;
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string | null> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { email?: string };
  return data.email ? String(data.email).trim().toLowerCase() : null;
}

export { getGoogleConfigStatus, type GoogleConfigStatus };
