import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return jsonError("Pasta inválida.", 400);

  const userId = auth.access.user!.id;
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: fetchError } = await (supabase as any)
    .from("material_folders")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!existing) return jsonError("Pasta não encontrada.", 404);

  await (supabase as any)
    .from("generated_materials")
    .update({ folder_id: null })
    .eq("folder_id", id)
    .eq("user_id", userId);

  const { error: deleteError } = await (supabase as any)
    .from("material_folders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (deleteError) return jsonError(deleteError.message, 500);

  return NextResponse.json({ success: true, folderId: id });
}
