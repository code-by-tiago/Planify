import { NextRequest, NextResponse } from "next/server";
import { resolveAdminAccess } from "@/server/auth/admin-access";
import {
  getRequestAccessToken,
  requireApiPremiumAccess,
} from "@/server/auth/api-access";
import { getCommunityDocenteOverview } from "@/server/community/community-docente-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const search = request.nextUrl.searchParams.get("q") || "";
  const token = getRequestAccessToken(request);
  const adminAccess = await resolveAdminAccess(token);

  try {
    const overview = await getCommunityDocenteOverview({
      viewerUserId: access.access.user?.id,
      search,
      isAdmin: adminAccess.isAdmin,
    });
    return NextResponse.json({ ok: true, ...overview });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar a comunidade.",
      500,
    );
  }
}
