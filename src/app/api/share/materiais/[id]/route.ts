import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) return jsonError("Link inválido.", 400);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("shared_materials")
    .select("id,title,html,tool_id,view_count,created_at,expires_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Material não encontrado.", 404);

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return jsonError("Este link expirou.", 410);
  }

  await (supabase as any)
    .from("shared_materials")
    .update({ view_count: Number(data.view_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    material: {
      id: data.id,
      title: data.title,
      html: data.html,
      toolId: data.tool_id,
      viewCount: Number(data.view_count || 0) + 1,
      createdAt: data.created_at,
    },
  });
}
