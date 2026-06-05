import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../supabase/admin-client";
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

/** Tabela criada em supabase/migrations/20260604_google_integrations.sql */
function googleIntegrationsTable(supabase: SupabaseClient) {
  return supabase.from("google_integrations" as "profiles");
}

export async function saveGoogleTokensForUser(
  userId: string,
  tokenResponse: GoogleTokenResponse,
  existingRefreshToken?: string | null,
): Promise<StoredGoogleTokens> {
  const refreshToken =
    tokenResponse.refresh_token || existingRefreshToken || null;

  if (!refreshToken) {
    throw new Error(
      "O Google não retornou refresh token. Revogue o acesso em myaccount.google.com/permissions e conecte de novo.",
    );
  }

  const googleEmail = await fetchGoogleUserEmail(tokenResponse.access_token);
  const scopes = String(tokenResponse.scope || "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

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
  const updated = await saveGoogleTokensForUser(userId, refreshed, stored.refreshToken);

  if (!updated.accessToken) {
    throw new Error("Token de acesso Google indisponível após renovação.");
  }

  return {
    accessToken: updated.accessToken,
    googleEmail: updated.googleEmail,
  };
}
