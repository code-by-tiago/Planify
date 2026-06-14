import { NextRequest, NextResponse } from "next/server";
import { resolveAdminAccess } from "@/server/auth/admin-access";
import {
  getRequestAccessToken,
  requireApiPremiumAccess,
} from "@/server/auth/api-access";
import { getCommunityDocenteOverview, getSavedDiscussionsForUser } from "@/server/community/community-docente-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const search = request.nextUrl.searchParams.get("q") || "";
  const disciplina = request.nextUrl.searchParams.get("disciplina") || "";
  const componente = request.nextUrl.searchParams.get("componente") || "";
  const mineOnly = request.nextUrl.searchParams.get("mine") === "true";
  const friendsOnly = request.nextUrl.searchParams.get("friendsOnly") === "true";
  const savedOnly = request.nextUrl.searchParams.get("saved") === "true";
  const token = getRequestAccessToken(request);
  const adminAccess = await resolveAdminAccess(token);

  try {
    const overview = await getCommunityDocenteOverview({
      viewerUserId: access.access.user?.id,
      search,
      disciplina: disciplina || null,
      componente: componente || null,
      mineOnly,
      friendsOnly,
      savedOnly,
      isAdmin: adminAccess.isAdmin,
    });
    const savedDiscussions = access.access.user?.id
      ? await getSavedDiscussionsForUser({ userId: access.access.user.id })
      : [];
    return NextResponse.json({ ok: true, ...overview, savedDiscussions });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar a comunidade.",
      500,
    );
  }
}
