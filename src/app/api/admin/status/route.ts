import { NextRequest, NextResponse } from "next/server";
import { resolveAdminAccess } from "../../../../server/auth/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREMIUM_COOKIE_NAME = "planify_access";
const ADMIN_COOKIE_NAME = "planify_admin_access";

export async function GET(request: NextRequest) {
  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value || null;
  const premiumToken = request.cookies.get(PREMIUM_COOKIE_NAME)?.value || null;

  const adminDedicated = await resolveAdminAccess(adminToken);
  const admin = adminDedicated.isAdmin
    ? adminDedicated
    : await resolveAdminAccess(premiumToken);

  return NextResponse.json(
    {
      authenticated: admin.authenticated,
      isAdmin: admin.isAdmin,
      email: admin.email,
      userId: admin.userId,
      source: admin.source,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
