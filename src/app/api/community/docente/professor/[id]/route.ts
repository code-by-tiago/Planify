import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getCommunityTeacherDetail } from "@/server/community/community-docente-service";

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

  try {
    const teacher = await getCommunityTeacherDetail({
      userId: id,
      viewerUserId: access.access.user?.id,
    });

    if (!teacher) return jsonError("Professor não encontrado ou perfil privado.", 404);

    return NextResponse.json({ ok: true, teacher });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar o perfil.",
      500,
    );
  }
}
