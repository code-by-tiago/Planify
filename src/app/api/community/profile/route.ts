import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../server/google/google-auth";
import {
  getCommunityProfileForUser,
  updateCommunityProfile,
} from "../../../../server/community/community-profile-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { message: "Faça login para ver seu perfil." } },
      { status: 401 },
    );
  }

  const profile = await getCommunityProfileForUser({
    userId: user.id,
    email: user.email,
  });

  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(request: NextRequest) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { message: "Faça login para editar o perfil." } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));

  await updateCommunityProfile(user.id, {
    fullName:
      body.fullName !== undefined ? String(body.fullName || "") : undefined,
    schoolName:
      body.schoolName !== undefined
        ? body.schoolName === null
          ? null
          : String(body.schoolName || "")
        : undefined,
    bio: body.bio !== undefined ? (body.bio === null ? null : String(body.bio || "")) : undefined,
    communityPublic:
      body.communityPublic !== undefined ? Boolean(body.communityPublic) : undefined,
    teachingAreas: Array.isArray(body.teachingAreas)
      ? body.teachingAreas.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined,
  });

  const profile = await getCommunityProfileForUser({
    userId: user.id,
    email: user.email,
  });

  return NextResponse.json({ ok: true, profile });
}
