import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getSupabaseAdminClient } from "@/server/supabase/admin-client";
import { getSiteUrl } from "@/lib/seo/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user!.id;
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    html?: string;
    toolId?: string;
  } | null;

  const title = String(body?.title || "").trim() || "Material Planify";
  const html = String(body?.html || "").trim();
  const toolId = String(body?.toolId || "").trim() || null;

  if (html.length < 20) {
    return jsonError("Conteúdo insuficiente para compartilhar.", 400);
  }

  if (html.length > 1_500_000) {
    return jsonError("Material muito grande para compartilhar por link.", 400);
  }

  const supabase = getSupabaseAdminClient();

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await (supabase as any)
    .from("shared_materials")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId)
    .gte("created_at", since);

  if ((count || 0) >= 30) {
    return jsonError("Limite de links por hora atingido. Tente novamente mais tarde.", 429);
  }

  const { data, error } = await (supabase as any)
    .from("shared_materials")
    .insert({
      owner_user_id: userId,
      title,
      html,
      tool_id: toolId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return jsonError(error?.message || "Não foi possível criar o link.", 500);
  }

  const url = `${getSiteUrl()}/s/${data.id}`;

  return NextResponse.json({
    success: true,
    share: { id: data.id, url },
  });
}
