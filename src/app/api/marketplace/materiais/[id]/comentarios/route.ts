import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../../../server/auth/premium-access-service";
import { getSupabaseAdminClient } from "../../../../../../server/supabase/admin-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || request.cookies.get("planify_access")?.value || null;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: { message } }, { status });
}

type CommentRow = {
  id: string;
  material_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function commentsTable(supabase: ReturnType<typeof getSupabaseAdminClient>): any {
  return supabase.from("marketplace_material_comments");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: materialId } = await context.params;

  if (!materialId) {
    return jsonError("Material não informado.", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await commentsTable(supabase)
    .select("*")
    .eq("material_id", materialId)
    .order("created_at", { ascending: true });

  if (error) {
    return jsonError(
      `Não foi possível carregar comentários. Execute supabase/migrations/20260605_marketplace_comments.sql. Detalhe: ${error.message}`,
      500,
    );
  }

  return NextResponse.json({ success: true, comments: (data || []) as CommentRow[] });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: materialId } = await context.params;
  const token = getBearerToken(request);
  const access = await verifyPremiumAccess(token);

  if (!access.authenticated) {
    return jsonError("Faça login para comentar.", 401);
  }

  if (!access.premium) {
    return jsonError("Comentários exigem plano ativo.", 403);
  }

  const payload = (await request.json()) as { text?: string; authorName?: string };
  const text = String(payload.text || "").trim();

  if (text.length < 2) {
    return jsonError("Escreva um comentário com pelo menos 2 caracteres.");
  }

  if (text.length > 2000) {
    return jsonError("Comentário muito longo (máx. 2000 caracteres).");
  }

  const supabase = getSupabaseAdminClient();

  const { data: material } = await supabase
    .from("marketplace_materials")
    .select("id")
    .eq("id", materialId)
    .maybeSingle();

  if (!material) {
    return jsonError("Material não encontrado.", 404);
  }

  const row = {
    material_id: materialId,
    user_id: access.user?.id || null,
    author_name: String(
      payload.authorName || access.user?.email?.split("@")[0] || "Professor",
    ),
    author_email: access.user?.email || null,
    body: text,
  };

  const { data, error } = await commentsTable(supabase)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    return jsonError(
      `Não foi possível salvar o comentário. Detalhe: ${error.message}`,
      500,
    );
  }

  return NextResponse.json({ success: true, comment: data as CommentRow });
}
