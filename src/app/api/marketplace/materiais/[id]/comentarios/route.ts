import { NextRequest, NextResponse } from "next/server";
import { verifyPremiumAccess } from "../../../../../../server/auth/premium-access-service";
import { resolveDisplayNameFromSources } from "../../../../../../server/auth/user-display-name";
import { getMaterialCommentsBatch } from "../../../../../../server/community/marketplace-social-service";
import { createCommunityNotification } from "../../../../../../server/community/community-notifications-service";
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

  const commentsMap = await getMaterialCommentsBatch([materialId]);
  const comments = commentsMap.get(materialId) || [];

  return NextResponse.json({
    success: true,
    comments: comments.map((comment) => ({
      id: comment.id,
      material_id: materialId,
      user_id: comment.userId,
      author_name: comment.authorName,
      author_avatar_url: comment.authorAvatarUrl,
      body: comment.body,
      created_at: comment.createdAt,
    })),
  });
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

  const payload = (await request.json()) as { text?: string };
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
    .select("id,user_id,title")
    .eq("id", materialId)
    .maybeSingle();

  if (!material) {
    return jsonError("Material não encontrado.", 404);
  }

  const userId = access.user?.id;

  if (!userId) {
    return jsonError("Faça login para comentar.", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email")
    .eq("id", userId)
    .maybeSingle();

  const authorName = resolveDisplayNameFromSources({
    profileFullName: profile?.full_name,
    email: profile?.email || access.user?.email || null,
    fallback: "Professor",
  });

  const row = {
    material_id: materialId,
    user_id: userId,
    author_name: authorName,
    author_email: access.user?.email || profile?.email || null,
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

  const enriched = await getMaterialCommentsBatch([materialId]);
  const saved = (enriched.get(materialId) || []).find((row) => row.id === String(data.id));

  const ownerUserId = material?.user_id ? String(material.user_id) : null;

  if (ownerUserId) {
    void createCommunityNotification({
      userId: ownerUserId,
      type: "comment",
      actorUserId: userId,
      materialId,
      bodyPreview: text.slice(0, 200),
    });
  }

  return NextResponse.json({
    success: true,
    comment: saved
      ? {
          id: saved.id,
          material_id: materialId,
          user_id: saved.userId,
          author_name: saved.authorName,
          author_avatar_url: saved.authorAvatarUrl,
          body: saved.body,
          created_at: saved.createdAt,
        }
      : (data as CommentRow),
  });
}
