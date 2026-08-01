import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyPremiumAccess } from "./premium-access-service";
import { getOwnerEmails } from "./owner-emails";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";

export type AdminAccessResult = {
  authenticated: boolean;
  isAdmin: boolean;
  email: string;
  userId: string | null;
  access: any;
  source: string;
};

type TokenProfile = {
  email: string;
  userId: string | null;
  source: string;
};

function ownerUserIds() {
  return [process.env.PLANIFY_ADMIN_USER_ID, process.env.ADMIN_USER_ID]
    .join(",")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value: unknown) {
  return String(value || "").trim();
}

function getEmailFromAccess(access: any) {
  return normalizeEmail(
    access?.user?.email ||
      access?.email ||
      access?.profile?.email ||
      access?.session?.user?.email ||
      access?.data?.user?.email ||
      access?.user_metadata?.email,
  );
}

function getUserIdFromAccess(access: any) {
  return normalizeId(
    access?.user?.id ||
      access?.userId ||
      access?.id ||
      access?.sub ||
      access?.session?.user?.id ||
      access?.data?.user?.id,
  );
}

function decodeJwtPayload(token: string | null): any | null {
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

    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function getTokenProfile(token: string | null): Promise<TokenProfile> {
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
    return {
      email: "",
      userId: null,
      source: "empty",
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return {
        email: "",
        userId: null,
        source: "supabase-empty",
      };
    }

    return {
      email: normalizeEmail(data.user.email),
      userId: normalizeId(data.user.id) || null,
      source: "supabase-auth",
    };
  } catch {
    return {
      email: "",
      userId: null,
      source: "supabase-error",
    };
  }
}

function detectAdmin(access: any, profile: TokenProfile) {
  const email = getEmailFromAccess(access) || profile.email;
  const userId = getUserIdFromAccess(access) || profile.userId || "";
  const emails = getOwnerEmails();
  const ids = ownerUserIds();

  return Boolean(
    access?.user?.isAdmin ||
      access?.user?.admin ||
      access?.user?.role === "admin" ||
      access?.user?.role === "owner" ||
      access?.role === "admin" ||
      access?.role === "owner" ||
      access?.isAdmin ||
      access?.admin ||
      (email && emails.includes(email)) ||
      (userId && ids.includes(userId)),
  );
}

export async function resolveAdminAccess(
  token: string | null,
): Promise<AdminAccessResult> {
  const access = (await verifyPremiumAccess(token)) as any;
  const profile = await getTokenProfile(token);

  const email = getEmailFromAccess(access) || profile.email;
  const userId = getUserIdFromAccess(access) || profile.userId;

  const authenticated = Boolean(
    access?.authenticated || profile.email || profile.userId,
  );

  return {
    authenticated,
    isAdmin: Boolean(authenticated && detectAdmin(access, profile)),
    email,
    userId: userId || null,
    access,
    source: profile.source,
  };
}

export async function getAdminPageAccess() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value || null;
  const premiumToken = cookieStore.get(PREMIUM_COOKIE_NAME)?.value || null;

  const adminAccess = await resolveAdminAccess(adminToken);

  if (adminAccess.isAdmin) {
    return adminAccess;
  }

  return resolveAdminAccess(premiumToken);
}

export async function requireAdminApi(request: NextRequest) {
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;

  const adminFromDedicatedCookie = await resolveAdminAccess(adminToken);
  const admin = adminFromDedicatedCookie.isAdmin
    ? adminFromDedicatedCookie
    : await resolveAdminAccess(premiumToken);

  if (!admin.authenticated) {
    return {
      ok: false as const,
      admin,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "not_authenticated",
            message: "Faça login com a conta administradora e tente novamente.",
          },
        },
        { status: 401 },
      ),
    };
  }

  if (!admin.isAdmin) {
    return {
      ok: false as const,
      admin,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: "not_admin",
            message:
              "Este usuário está logado, mas não é o administrador do Planify.",
            detectedEmail: admin.email,
            adminEmailConfigured: getOwnerEmails()[0] || "",
            source: admin.source,
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    admin,
    response: null,
  };
}
