import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getGoogleOAuthStateSecret } from "./google-config";

export type PlanifyGoogleUser = {
  id: string;
  email: string;
};

export type GoogleOAuthStatePayload = {
  userId: string;
  returnTo: string;
  exp: number;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signGoogleOAuthState(payload: GoogleOAuthStatePayload): string {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getGoogleOAuthStateSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyGoogleOAuthState(state: string): GoogleOAuthStatePayload | null {
  const [body, signature] = state.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getGoogleOAuthStateSecret())
    .update(body)
    .digest("base64url");

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as GoogleOAuthStatePayload;

    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function collectAuthTokens(request: NextRequest): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const candidate of [
    getBearerToken(request),
    request.cookies.get("planify_session")?.value || null,
    request.cookies.get("planify_access")?.value || null,
    request.cookies.get("planify_owner_access")?.value || null,
    request.cookies.get("planify_admin_access")?.value || null,
  ]) {
    const token = String(candidate || "").trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }

  return tokens;
}

export async function resolvePlanifyUserFromRequest(
  request: NextRequest,
): Promise<PlanifyGoogleUser | null> {
  const tokens = collectAuthTokens(request);

  if (!tokens.length) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  for (const token of tokens) {
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user?.id) {
      return {
        id: data.user.id,
        email: String(data.user.email || "").trim().toLowerCase(),
      };
    }
  }

  return null;
}
