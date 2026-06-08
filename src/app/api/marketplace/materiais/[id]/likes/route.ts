import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../../server/auth/api-access";
import { getSupabaseAdminClient } from "../../../../../../server/supabase/admin-client";
import {
  getMaterialLikeSummary,
  likeMarketplaceMaterial,
  unlikeMarketplaceMaterial,
} from "../../../../../../server/community/marketplace-social-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

async function assertPublishedMaterial(materialId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("marketplace_materials")
    .select("id")
    .eq("id", materialId)
    .eq("is_published", true)
    .maybeSingle();

  return Boolean(data);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const { id: materialId } = await context.params;

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  const summary = await getMaterialLikeSummary({
    materialId,
    viewerUserId: access.access.user?.id || null,
  });

  return NextResponse.json({ success: true, ...summary });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { id: materialId } = await context.params;

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  if (!(await assertPublishedMaterial(materialId))) {
    return jsonError("Material não encontrado.", 404);
  }

  try {
    const summary = await likeMarketplaceMaterial({ materialId, userId });
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível curtir.",
      500,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { id: materialId } = await context.params;

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  try {
    const summary = await unlikeMarketplaceMaterial({ materialId, userId });
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível remover curtida.",
      500,
    );
  }
}
