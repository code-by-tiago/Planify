import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../../../server/auth/api-access";
import { isOwnerEmail } from "../../../../../../../server/auth/owner-emails";
import { deleteMarketplaceComment } from "../../../../../../../server/community/marketplace-social-service";
import { getSupabaseAdminClient } from "../../../../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { id: materialId, commentId } = await context.params;

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  if (!commentId) {
    return jsonError("Comentário não informado.", 400);
  }

  const supabase = getSupabaseAdminClient();

  const { data: comment, error: commentError } = await supabase
    .from("marketplace_material_comments")
    .select("id,material_id,user_id")
    .eq("id", commentId)
    .eq("material_id", materialId)
    .maybeSingle();

  if (commentError) {
    return jsonError(
      `Não foi possível localizar o comentário. Detalhe: ${commentError.message}`,
      500,
    );
  }

  if (!comment) {
    return jsonError("Comentário não encontrado.", 404);
  }

  const { data: material } = await supabase
    .from("marketplace_materials")
    .select("user_id")
    .eq("id", materialId)
    .maybeSingle();

  const isCommentAuthor = Boolean(comment.user_id && comment.user_id === userId);
  const isMaterialOwner = Boolean(material?.user_id && material.user_id === userId);
  const isAdmin = Boolean(access.access.user?.isAdmin);
  const isOwner = isOwnerEmail(access.access.user?.email);

  if (!isCommentAuthor && !isMaterialOwner && !isAdmin && !isOwner) {
    return jsonError("Você não pode excluir este comentário.", 403);
  }

  try {
    await deleteMarketplaceComment({ materialId, commentId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível excluir o comentário.",
      500,
    );
  }
}
