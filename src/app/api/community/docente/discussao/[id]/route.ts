import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getCommunityDiscussionDetail } from "@/server/community/community-docente-service";

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
    const discussion = await getCommunityDiscussionDetail({
      postId: id,
      viewerUserId: access.access.user?.id,
    });

    if (!discussion) return jsonError("Discussão não encontrada.", 404);

    return NextResponse.json({ ok: true, discussion });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar a discussão.",
      500,
    );
  }
}
