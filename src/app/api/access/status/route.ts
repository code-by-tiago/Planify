import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "../../../../server/auth/api-access";
import { verifyPremiumAccess } from "../../../../server/auth/premium-access-service";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";
import { isOwnerEmail } from "../../../../server/auth/owner-emails";
import { resolveUserAvatarFromToken } from "../../../../server/auth/user-avatar";
import { getSupabaseAdminClient } from "../../../../server/supabase/admin-client";
import { buildPlanifyAccessContext } from "@/lib/bncc/access";
import { resolveUserAccessProfile } from "../../../../server/auth/user-access-profile";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";

function looksLikeJwt(token: string | null) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
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

  if (isOwnerEmail(jwtEmail)) {
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
      isOwner: isOwnerEmail(email),
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
  const bearerToken = getRequestAccessToken(request);
  const sessionToken = request.cookies.get("planify_session")?.value || null;
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;

  const accessJwtToken =
    (bearerToken && looksLikeJwt(bearerToken) ? bearerToken : null) ||
    (sessionToken && looksLikeJwt(sessionToken) ? sessionToken : null) ||
    (looksLikeJwt(ownerToken) ? ownerToken : null) ||
    (looksLikeJwt(adminToken) ? adminToken : null);
  const access = await verifyPremiumAccess(accessJwtToken);
  const admin = await resolveAdminAccess(adminToken);
  const owner = await resolveOwnerByToken(ownerToken || accessJwtToken || adminToken);

  const tokenEmail = decodeJwtEmail(accessJwtToken);
  const email = String(
    access.user?.email ||
      owner.email ||
      tokenEmail ||
      admin.email ||
      "",
  )
    .trim()
    .toLowerCase();

  const isOwner = Boolean(owner.isOwner || isOwnerEmail(email));
  const authenticated = Boolean(
    access.authenticated || admin.authenticated || owner.authenticated,
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

  const planKey =
    access.subscription?.planKey ||
    access.subscription?.planId ||
    null;

  const userId = access.user?.id || null;
  const accessProfile = userId
    ? await resolveUserAccessProfile(userId)
    : {
        profileRole: access.user?.role || "teacher",
        schoolId: null as string | null,
        schoolMembershipRole: null,
      };

  const isSiteAdmin = Boolean(
    admin.isAdmin || isOwner || accessProfile.profileRole === "admin",
  );

  const accessContext = buildPlanifyAccessContext({
    premium,
    planKey,
    isAdmin: Boolean(admin.isAdmin || isOwner),
    isSiteAdmin,
    profileRole: accessProfile.profileRole,
    schoolId: accessProfile.schoolId,
    schoolMembershipRole: accessProfile.schoolMembershipRole,
  });

  const avatarUrl = authenticated
    ? await resolveUserAvatarFromToken(accessJwtToken)
    : null;

  return NextResponse.json(
    {
      authenticated,
      premium,
      reason,
      message,
      isOwner,
      isAdmin: Boolean(admin.isAdmin || isOwner),
      role: isOwner || admin.isAdmin ? "admin" : accessProfile.profileRole || access.user?.role || "teacher",
      email,
      avatarUrl,
      planKey,
      tier: accessContext.tier,
      profileRole: accessContext.profileRole,
      schoolId: accessContext.schoolId,
      schoolMembershipRole: accessContext.schoolMembershipRole,
      hasSchoolMembership: accessContext.hasSchoolMembership,
      isSchoolManager: accessContext.isSchoolManager,
      isDirector: accessContext.isDirector,
      isManagerView: accessContext.isManagerView,
      canViewBnccProgress: accessContext.canViewBnccProgress,
      canViewDirectorPanel: accessContext.canViewDirectorPanel,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
