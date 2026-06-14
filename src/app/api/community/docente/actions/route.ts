import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  addCommunityPostComment,
  createCommunityPost,
  toggleCommunityFollow,
  toggleCommunityPostLike,
} from "@/server/community/community-docente-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function POST(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "create_post");

  try {
    if (action === "create_post") {
      const title = String(body.title || "").trim();
      const content = String(body.body || "").trim();
      const disciplina = String(body.disciplina || "Ciências").trim();
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];

      if (title.length < 3) return jsonError("Informe um título com pelo menos 3 caracteres.");

      const post = await createCommunityPost({
        authorId: userId,
        title,
        body: content,
        disciplina,
        tags,
      });
      return NextResponse.json({ ok: true, postId: post?.id });
    }

    if (action === "like_post") {
      const postId = String(body.postId || "").trim();
      if (!postId) return jsonError("Post não informado.");
      const result = await toggleCommunityPostLike({ userId, postId });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "comment_post") {
      const postId = String(body.postId || "").trim();
      const comment = String(body.body || "").trim();
      if (!postId || !comment) return jsonError("Post e comentário são obrigatórios.");
      const result = await addCommunityPostComment({
        authorId: userId,
        postId,
        body: comment,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "follow") {
      const followingId = String(body.followingId || "").trim();
      if (!followingId) return jsonError("Professor não informado.");
      const result = await toggleCommunityFollow({ followerId: userId, followingId });
      return NextResponse.json({ ok: true, ...result });
    }

    return jsonError("Ação inválida.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível concluir a ação.",
      500,
    );
  }
}
