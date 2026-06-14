import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  hideCommunityFeedMaterial,
  listHiddenFeedMaterialIds,
  syncHiddenFeedMaterialIds,
  unhideCommunityFeedMaterial,
} from "@/server/community/community-hidden-feed-materials-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const materialIds = await listHiddenFeedMaterialIds(userId);
  return NextResponse.json({ ok: true, materialIds });
}

export async function POST(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "hide").trim();
  const materialId = String(body.materialId || "").trim();

  try {
    if (action === "sync") {
      const materialIds = Array.isArray(body.materialIds)
        ? body.materialIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : [];
      const result = await syncHiddenFeedMaterialIds({ userId, materialIds });
      return NextResponse.json({ ok: true, ...result });
    }

    if (!materialId) return jsonError("Material não informado.");

    if (action === "unhide") {
      await unhideCommunityFeedMaterial({ userId, materialId });
      return NextResponse.json({ ok: true, hidden: false });
    }

    await hideCommunityFeedMaterial({ userId, materialId });
    return NextResponse.json({ ok: true, hidden: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível atualizar preferências.",
      400,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const materialId =
    request.nextUrl.searchParams.get("materialId") ||
    String((await request.json().catch(() => ({}))).materialId || "").trim();

  if (!materialId) return jsonError("Material não informado.");

  try {
    await unhideCommunityFeedMaterial({ userId, materialId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível restaurar o material.",
      400,
    );
  }
}
