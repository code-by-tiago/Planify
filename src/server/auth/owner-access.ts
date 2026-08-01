import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOwnerEmails, isOwnerEmail } from "./owner-emails";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";

export type OwnerAccessResult = {
  authenticated: boolean;
  isOwner: boolean;
  email: string;
  userId: string | null;
  source: string;
};

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value: unknown) {
  return String(value || "").trim();
}

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
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

async function getTokenProfile(token: string | null): Promise<{
  email: string;
  userId: string | null;
  source: string;
}> {
  const decoded = decodeJwtPayload(token);
  const decodedEmail = normalizeEmail(decoded?.email);
  const decodedUserId = normalizeId(decoded?.sub);

  if (decodedEmail || decodedUserId) {
    return {
      email: decodedEmail,
      userId: decodedUserId || null,
      source: "jwt",
    };
  }

  if (!token) {
    return { email: "", userId: null, source: "empty" };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return { email: "", userId: null, source: "supabase-empty" };
    }

    return {
      email: normalizeEmail(data.user.email),
      userId: normalizeId(data.user.id) || null,
      source: "supabase-auth",
    };
  } catch {
    return { email: "", userId: null, source: "supabase-error" };
  }
}

export async function resolveOwnerAccess(
  token: string | null,
): Promise<OwnerAccessResult> {
  const profile = await getTokenProfile(token);
  const email = profile.email;
  const authenticated = Boolean(email || profile.userId);
  const isOwner = Boolean(authenticated && isOwnerEmail(email));

  return {
    authenticated,
    isOwner,
    email,
    userId: profile.userId,
    source: profile.source,
  };
}

async function resolveFromCookieTokens(
  tokens: Array<string | null | undefined>,
): Promise<OwnerAccessResult> {
  for (const token of tokens) {
    const trimmed = String(token || "").trim();
    if (!trimmed) continue;

    const access = await resolveOwnerAccess(trimmed);
    if (access.isOwner) {
      return access;
    }
  }

  const fallbackToken = tokens.find((token) => String(token || "").trim());
  return resolveOwnerAccess(fallbackToken || null);
}

export async function getOwnerPageAccess(): Promise<OwnerAccessResult> {
  const cookieStore = await cookies();

  return resolveFromCookieTokens([
    cookieStore.get(OWNER_COOKIE_NAME)?.value,
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    cookieStore.get(PREMIUM_COOKIE_NAME)?.value,
  ]);
}

export async function requireOwnerApi(request: NextRequest) {
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;

  const owner = await resolveFromCookieTokens([
    ownerToken,
    adminToken,
    premiumToken,
  ]);

  if (!owner.authenticated) {
    return {
      ok: false as const,
      owner,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "not_authenticated",
            message: "Faça login com a conta do proprietário e tente novamente.",
          },
        },
        { status: 401 },
      ),
    };
  }

  if (!owner.isOwner) {
    return {
      ok: false as const,
      owner,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "not_owner",
            message: "Esta conta não é o proprietário do Planify.",
            detectedEmail: owner.email,
            ownerEmailConfigured: getOwnerEmails()[0] || "",
            source: owner.source,
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    owner,
    response: null,
  };
}
