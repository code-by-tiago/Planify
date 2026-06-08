import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../server/google/google-auth";
import { getPublicCommunityProfile } from "../../../../../server/community/community-profile-service";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: { message: "Perfil não informado." } },
      { status: 400 },
    );
  }

  const viewer = await resolvePlanifyUserFromRequest(request);
  const profile = await getPublicCommunityProfile({
    targetUserId: userId,
    viewerUserId: viewer?.id || access.access.user?.id || null,
  });

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: { message: "Perfil não encontrado." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, profile });
}
