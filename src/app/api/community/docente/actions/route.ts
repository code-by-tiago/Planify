import { NextRequest, NextResponse } from "next/server";
import {
  requireApiPremiumAccess,
} from "@/server/auth/api-access";
import {
  hideCommunityFeedMaterial,
  unhideCommunityFeedMaterial,
} from "@/server/community/community-hidden-feed-materials-service";
import { completeCommunityChallenge } from "@/server/community/community-badge-service";
import {
  addCommunityPostComment,
  createCommunityPost,
  createCommunityPostWithAttachments,
  deleteCommunityPost,
  inviteCommunityPostParticipants,
  toggleCommunityFollow,
  toggleCommunityPostLike,
  toggleSavedPost,
  updateCommunityPost,
} from "@/server/community/community-docente-service";
import { linkPostAttachments } from "@/server/community/community-post-attachments-service";
import { consumeCommunityRateLimit } from "@/server/community/community-rate-limit-service";

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
    await consumeCommunityRateLimit({
      userId,
      bucketKey: `docente_action:${action}`,
      limit: action === "participate_challenge" ? 20 : 90,
      windowSec: 60,
    });

    if (action === "create_post") {
      const content = String(body.body || "").trim().slice(0, 8000);
      const rawTitle = String(body.title || "").trim();
      const hasAttachments = Boolean(body.hasAttachments) ||
        (Array.isArray(body.attachments) && body.attachments.length > 0);
      let title =
        rawTitle ||
        content
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .find(Boolean)
          ?.slice(0, 80) ||
        "";

      // Banco exige título com pelo menos 3 caracteres (community_posts_title_check).
      if (title.trim().length < 3) {
        title = hasAttachments
          ? "Publicação com anexo"
          : content.trim().length > 0
            ? `${content.trim().slice(0, 40)} — publicação`.slice(0, 80)
            : "Publicação na comunidade";
      }
      title = title.trim().slice(0, 300);

      const disciplina = String(body.disciplina || "Multidisciplinar").trim();
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20)
        : [];
      const participantUserIds: string[] = Array.isArray(body.participantUserIds)
        ? Array.from(
            new Set(
              (body.participantUserIds as unknown[])
                .map((id) => String(id).trim())
                .filter((id) => id.length > 0),
            ),
          ).slice(0, 30)
        : [];

      if (!content && !rawTitle && !hasAttachments) {
        return jsonError("Escreva uma mensagem ou anexe um arquivo para publicar.");
      }
      if (title.trim().length < 3) {
        return jsonError("O título da publicação precisa ter pelo menos 3 caracteres.");
      }

      const post = await createCommunityPost({
        authorId: userId,
        title,
        body: content,
        disciplina,
        tags,
        participantUserIds,
      });
      return NextResponse.json({ ok: true, postId: post?.id });
    }

    if (action === "create_post_with_attachments") {
      const content = String(body.body || "").trim().slice(0, 8000);
      const rawTitle = String(body.title || "").trim();
      const attachments = Array.isArray(body.attachments) ? body.attachments : [];
      const hasAttachments = attachments.length > 0;
      let title =
        rawTitle ||
        content
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .find(Boolean)
          ?.slice(0, 80) ||
        "";

      if (title.trim().length < 3) {
        title = hasAttachments
          ? "Publicação com anexo"
          : content.trim().length > 0
            ? `${content.trim().slice(0, 40)} — publicação`.slice(0, 80)
            : "Publicação na comunidade";
      }
      title = title.trim().slice(0, 300);

      const disciplina = String(body.disciplina || "Multidisciplinar").trim();
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 20)
        : [];
      const participantUserIds: string[] = Array.isArray(body.participantUserIds)
        ? Array.from(
            new Set(
              (body.participantUserIds as unknown[])
                .map((id) => String(id).trim())
                .filter((id) => id.length > 0),
            ),
          ).slice(0, 30)
        : [];

      if (!content && !rawTitle && !hasAttachments) {
        return jsonError("Escreva uma mensagem ou anexe um arquivo para publicar.");
      }

      const normalized = attachments
        .map((item: unknown, index: number) => {
          const row = item as Record<string, unknown>;
          return {
            materialId: String(row.materialId || "").trim(),
            fileName: String(row.fileName || "anexo").trim(),
            fileMime: row.fileMime ? String(row.fileMime) : null,
            sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : index,
          };
        })
        .filter((item: { materialId: string }) => item.materialId)
        .slice(0, 5);

      const result = await createCommunityPostWithAttachments({
        authorId: userId,
        title,
        body: content,
        disciplina,
        tags,
        participantUserIds,
        attachments: normalized,
      });
      return NextResponse.json({
        ok: true,
        postId: result.postId,
        linked: result.linked,
      });
    }

    if (action === "link_post_attachments") {
      const postId = String(body.postId || "").trim();
      const attachments = Array.isArray(body.attachments) ? body.attachments : [];

      if (!postId) return jsonError("Post não informado.");
      if (attachments.length === 0) return jsonError("Nenhum anexo informado.");

      const normalized = attachments
        .map((item: unknown, index: number) => {
          const row = item as Record<string, unknown>;
          return {
            materialId: String(row.materialId || "").trim(),
            fileName: String(row.fileName || "anexo").trim(),
            fileMime: row.fileMime ? String(row.fileMime) : null,
            sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : index,
          };
        })
        .filter((item: { materialId: string }) => item.materialId);

      const result = await linkPostAttachments({
        authorId: userId,
        postId,
        attachments: normalized,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "update_post") {
      const postId = String(body.postId || "").trim();
      const title = String(body.title || "").trim();
      const content = String(body.body || "").trim();
      const disciplina = String(body.disciplina || "Multidisciplinar").trim();
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];

      if (!postId) return jsonError("Post não informado.");
      if (title.length < 3) return jsonError("Informe um título com pelo menos 3 caracteres.");

      await updateCommunityPost({
        authorId: userId,
        postId,
        title,
        body: content,
        disciplina,
        tags,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_post") {
      const postId = String(body.postId || "").trim();
      if (!postId) return jsonError("Post não informado.");
      await deleteCommunityPost({ authorId: userId, postId });
      return NextResponse.json({ ok: true });
    }

    if (action === "invite_post_participants") {
      const postId = String(body.postId || "").trim();
      const participantUserIds = Array.isArray(body.participantUserIds)
        ? body.participantUserIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : [];
      if (!postId) return jsonError("Post não informado.");
      const result = await inviteCommunityPostParticipants({
        authorId: userId,
        postId,
        participantUserIds,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "save_post") {
      const postId = String(body.postId || "").trim();
      if (!postId) return jsonError("Post não informado.");
      const result = await toggleSavedPost({ userId, postId });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "participate_challenge") {
      const challengeSlug = String(body.challengeSlug || "desafio-bncc").trim();
      const reflection = body.reflection != null ? String(body.reflection) : null;
      const result = await completeCommunityChallenge({ userId, challengeSlug, reflection });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "like_post") {
      const postId = String(body.postId || "").trim();
      if (!postId) return jsonError("Post não informado.");
      const result = await toggleCommunityPostLike({ userId, postId });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "comment_post") {
      const postId = String(body.postId || "").trim();
      const comment = String(body.body || "").trim().slice(0, 4000);
      if (!postId || !comment) return jsonError("Post e comentário são obrigatórios.");
      if (comment.length < 1) return jsonError("Comentário vazio.");
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

    if (action === "hide_feed_material") {
      const materialId = String(body.materialId || "").trim();
      if (!materialId) return jsonError("Material não informado.");
      await hideCommunityFeedMaterial({ userId, materialId });
      return NextResponse.json({ ok: true, hidden: true });
    }

    if (action === "unhide_feed_material") {
      const materialId = String(body.materialId || "").trim();
      if (!materialId) return jsonError("Material não informado.");
      await unhideCommunityFeedMaterial({ userId, materialId });
      return NextResponse.json({ ok: true, hidden: false });
    }

    return jsonError("Ação inválida.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível concluir a ação.",
      500,
    );
  }
}
