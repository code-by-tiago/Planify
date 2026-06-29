import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveMissingGoogleScopes } from "./google-config";
import {
  fetchGoogleUserEmail,
  refreshGoogleAccessToken,
  type GoogleTokenResponse,
} from "./google-oauth";

export type StoredGoogleTokens = {
  userId: string;
  googleEmail: string | null;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  scopes: string[];
};

type GoogleIntegrationRow = {
  user_id: string;
  google_email: string | null;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  scopes: string[] | null;
};

function expiresAtFromSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return Date.parse(expiresAt) <= Date.now() + 60_000;
}

function decodeBase64UrlJson(value: string): Record<string, unknown> | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function extractEmailFromGoogleIdToken(
  idToken: string | null | undefined,
): string | null {
  const payloadPart = String(idToken || "").split(".")[1];
  if (!payloadPart) return null;

  const payload = decodeBase64UrlJson(payloadPart);
  const email = typeof payload?.email === "string" ? payload.email : "";

  return email ? email.trim().toLowerCase() : null;
}

/** Tabela criada em supabase/migrations/20260604_google_integrations.sql */
function googleIntegrationsTable(supabase: SupabaseClient) {
  return supabase.from("google_integrations" as "profiles");
}

export async function saveGoogleTokensForUser(
  userId: string,
  tokenResponse: GoogleTokenResponse,
  options?: {
    existingRefreshToken?: string | null;
    preserveScopes?: string[];
    preserveGoogleEmail?: string | null;
  },
): Promise<StoredGoogleTokens> {
  const refreshToken =
    tokenResponse.refresh_token || options?.existingRefreshToken || null;

  if (!refreshToken) {
    throw new Error(
      "O Google não retornou refresh token. Revogue o acesso em myaccount.google.com/permissions e conecte de novo.",
    );
  }

  let googleEmail = options?.preserveGoogleEmail ?? null;
  try {
    const fetchedEmail = await fetchGoogleUserEmail(tokenResponse.access_token);
    if (fetchedEmail) {
      googleEmail = fetchedEmail;
    }
  } catch {
    // Mantém e-mail salvo quando a API userinfo falha após refresh.
  }

  if (!googleEmail) {
    googleEmail = extractEmailFromGoogleIdToken(tokenResponse.id_token);
  }

  const scopesFromResponse = String(tokenResponse.scope || "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
  const scopes = [
    ...new Set([...(options?.preserveScopes || []), ...scopesFromResponse]),
  ];

  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    google_email: googleEmail,
    refresh_token: refreshToken,
    access_token: tokenResponse.access_token,
    access_token_expires_at: expiresAtFromSeconds(tokenResponse.expires_in),
    scopes,
  };

  const { error } = await googleIntegrationsTable(supabase).upsert(
    row as never,
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(
      `Não foi possível salvar a integração Google. Execute a migration Supabase (google_integrations). Detalhe: ${error.message}`,
    );
  }

  return {
    userId,
    googleEmail,
    refreshToken,
    accessToken: row.access_token,
    accessTokenExpiresAt: row.access_token_expires_at,
    scopes,
  };
}

export async function getGoogleTokensForUser(
  userId: string,
): Promise<StoredGoogleTokens | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await googleIntegrationsTable(supabase)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao ler integração Google: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as GoogleIntegrationRow;

  return {
    userId: row.user_id,
    googleEmail: row.google_email,
    refreshToken: row.refresh_token,
    accessToken: row.access_token,
    accessTokenExpiresAt: row.access_token_expires_at,
    scopes: row.scopes || [],
  };
}

export async function deleteGoogleTokensForUser(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await googleIntegrationsTable(supabase)
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Erro ao remover integração Google: ${error.message}`);
  }
}

export async function getValidGoogleAccessToken(
  userId: string,
): Promise<{ accessToken: string; googleEmail: string | null }> {
  const stored = await getGoogleTokensForUser(userId);

  if (!stored) {
    throw new Error("Conta Google não conectada. Use “Conectar Google” no editor.");
  }

  if (stored.accessToken && !isExpired(stored.accessTokenExpiresAt)) {
    return {
      accessToken: stored.accessToken,
      googleEmail: stored.googleEmail,
    };
  }

  const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
  const updated = await saveGoogleTokensForUser(userId, refreshed, {
    existingRefreshToken: stored.refreshToken,
    preserveScopes: stored.scopes,
    preserveGoogleEmail: stored.googleEmail,
  });

  if (!updated.accessToken) {
    throw new Error("Token de acesso Google indisponível após renovação.");
  }

  return {
    accessToken: updated.accessToken,
    googleEmail: updated.googleEmail,
  };
}

export async function getValidGoogleAccessTokenForScopes(
  userId: string,
  requiredScopes: readonly string[],
  featureLabel = "Google",
): Promise<{ accessToken: string; googleEmail: string | null }> {
  const stored = await getGoogleTokensForUser(userId);

  if (!stored) {
    throw new Error("Conta Google nao conectada. Use Conectar Google no editor.");
  }

  const missingScopes = resolveMissingGoogleScopes(
    stored.scopes || [],
    requiredScopes,
  );

  if (missingScopes.length > 0) {
    throw new Error(
      `${featureLabel} precisa de nova autorizacao do Google. Clique em Autorizar Google Classroom e escolha a conta @educar.rs.gov.br.`,
    );
  }

  return getValidGoogleAccessToken(userId);
}
