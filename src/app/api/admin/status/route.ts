import { NextRequest, NextResponse } from "next/server";
import { resolveOwnerAccess } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";
const OWNER_COOKIE_NAME = "planify_owner_access";

export async function GET(request: NextRequest) {
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value || null;
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;

  const tokens = [ownerToken, adminToken, premiumToken];
  let owner = await resolveOwnerAccess(null);

  for (const token of tokens) {
    if (!token) continue;
    const access = await resolveOwnerAccess(token);
    if (access.isOwner) {
      owner = access;
      break;
    }
    if (!owner.authenticated && access.authenticated) {
      owner = access;
    }
  }

  return NextResponse.json(
    {
      authenticated: owner.authenticated,
      isOwner: owner.isOwner,
      isAdmin: owner.isOwner,
      email: owner.email,
      userId: owner.userId,
      source: owner.source,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
