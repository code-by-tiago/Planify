import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  listSavedMaterialIds,
  saveCommunityMaterial,
  unsaveCommunityMaterial,
} from "../../../../server/community/community-saved-materials-service";

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

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const materialIds = await listSavedMaterialIds(userId);
  return NextResponse.json({ ok: true, materialIds });
}

export async function POST(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const body = await request.json().catch(() => ({}));
  const materialId = String(body.materialId || "").trim();

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  try {
    const result = await saveCommunityMaterial({ userId, materialId });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível salvar material.",
      400,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const materialId =
    request.nextUrl.searchParams.get("materialId") ||
    String((await request.json().catch(() => ({}))).materialId || "").trim();

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  try {
    await unsaveCommunityMaterial({ userId, materialId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível remover da biblioteca.",
      400,
    );
  }
}
