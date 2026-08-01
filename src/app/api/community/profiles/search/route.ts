import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";
import { searchCommunityProfiles } from "../../../../../server/community/community-profile-search-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  const school = request.nextUrl.searchParams.get("school") || "";
  const component = request.nextUrl.searchParams.get("component") || "";

  try {
    const profiles = await searchCommunityProfiles({
      query: q,
      school,
      component,
      excludeUserId: access.access.user?.id,
    });
    return NextResponse.json({ ok: true, profiles });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível buscar professores.",
      500,
    );
  }
}
