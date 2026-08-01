import { NextRequest, NextResponse } from "next/server";
import { resolvePlanifyUserFromRequest } from "../../../../../../server/google/google-auth";
import { getSupabaseAdminClient } from "../../../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ materialId: string }> },
) {
  const user = await resolvePlanifyUserFromRequest(request);

  if (!user?.id) {
    return jsonError("Faça login para remover materiais do portfólio.", 401);
  }

  const { materialId } = await context.params;
  const id = String(materialId || "").trim();

  if (!id) {
    return jsonError("Material não informado.");
  }

  const supabase = getSupabaseAdminClient();
  const table = supabase.from("marketplace_materials") as any;

  const { data: material, error: readError } = await table
    .select("id,user_id,is_published")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return jsonError(`Erro ao localizar material: ${readError.message}`, 500);
  }

  if (!material) {
    return jsonError("Material não encontrado.", 404);
  }

  if (String(material.user_id || "") !== user.id) {
    return jsonError("Você só pode remover materiais do seu próprio portfólio.", 403);
  }

  const { error } = await table
    .update({ is_published: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError(`Erro ao remover do portfólio: ${error.message}`, 500);
  }

  return NextResponse.json({ ok: true, materialId: id });
}
