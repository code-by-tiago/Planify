import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";

function ownerEmails() {
  return [
    process.env.PLANIFY_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "ts162351@gmail.com",
  ]
    .join(",")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function decodeJwtEmail(token: string | null) {
  if (!token || !token.includes(".")) {
    return "";
  }

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));

    return String(json?.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

async function resolveOwnerByToken(token: string | null) {
  if (!token) {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
    };
  }

  const jwtEmail = decodeJwtEmail(token);

  if (jwtEmail && ownerEmails().includes(jwtEmail)) {
    return {
      authenticated: true,
      isOwner: true,
      email: jwtEmail,
    };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.auth.getUser(token);
    const email = String(data?.user?.email || "").trim().toLowerCase();

    return {
      authenticated: Boolean(email),
      isOwner: Boolean(email && ownerEmails().includes(email)),
      email,
    };
  } catch {
    return {
      authenticated: false,
      isOwner: false,
      email: "",
    };
  }
}

export async function GET(request: NextRequest) {
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;

  const access = await verifyPremiumAccess(premiumToken);
  const admin = await resolveAdminAccess(adminToken);
  const owner = await resolveOwnerByToken(ownerToken || premiumToken || adminToken);

  const tokenEmail = decodeJwtEmail(premiumToken);
  const email = String(
    access.user?.email ||
      owner.email ||
      tokenEmail ||
      admin.email ||
      "",
  )
    .trim()
    .toLowerCase();

  const isOwner = Boolean(owner.isOwner || (email && ownerEmails().includes(email)));
  const authenticated = Boolean(
    access.authenticated || admin.authenticated || owner.authenticated || email,
  );
  const premium = Boolean(access.premium || admin.isAdmin || isOwner);
  const reason = !authenticated
    ? "not_authenticated"
    : !premium
      ? "premium_required"
      : "ok";
  const message = !authenticated
    ? "Faça login para continuar."
    : !premium
      ? "Seu login está ativo, mas é necessário plano premium para continuar."
      : "Acesso premium confirmado.";

  return NextResponse.json(
    {
      authenticated,
      premium,
      reason,
      message,
      isOwner,
      isAdmin: Boolean(admin.isAdmin || isOwner),
      role: isOwner || admin.isAdmin ? "admin" : access.user?.role || "user",
      email,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
