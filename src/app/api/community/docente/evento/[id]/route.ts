import { NextRequest, NextResponse } from "next/server";
import { resolveAdminAccess } from "@/server/auth/admin-access";
import { getRequestAccessToken, requireApiPremiumAccess } from "@/server/auth/api-access";
import { getCommunityEventDetail } from "@/server/community/community-docente-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const { id } = await params;
  const token = getRequestAccessToken(request);
  const adminAccess = await resolveAdminAccess(token);

  try {
    const event = await getCommunityEventDetail({
      eventId: id,
      viewerUserId: access.access.user?.id,
      isAdmin: adminAccess.isAdmin,
    });

    if (!event) return jsonError("Evento não encontrado.", 404);

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar o evento.",
      500,
    );
  }
}
