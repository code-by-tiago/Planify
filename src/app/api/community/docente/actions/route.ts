import { NextRequest, NextResponse } from "next/server";
import { resolveAdminAccess } from "@/server/auth/admin-access";
import {
  getRequestAccessToken,
  requireApiPremiumAccess,
} from "@/server/auth/api-access";
import { completeCommunityChallenge } from "@/server/community/community-badge-service";
import {
  addCommunityPostComment,
  createCommunityEvent,
  createCommunityGroup,
  createCommunityPost,
  deleteCommunityEvent,
  deleteCommunityPost,
  inviteCommunityGroupMembers,
  inviteCommunityPostParticipants,
  joinCommunityGroup,
  leaveCommunityGroup,
  toggleCommunityEventRsvp,
  toggleCommunityFollow,
  toggleCommunityPostLike,
  toggleSavedPost,
  updateCommunityEvent,
  updateCommunityPost,
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
  const token = getRequestAccessToken(request);

  try {
    if (action === "create_post") {
      const title = String(body.title || "").trim();
      const content = String(body.body || "").trim();
      const disciplina = String(body.disciplina || "Ciências").trim();
      const tags = Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [];
      const participantUserIds = Array.isArray(body.participantUserIds)
        ? body.participantUserIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : [];
      const groupId = body.groupId ? String(body.groupId).trim() : null;

      if (title.length < 3) return jsonError("Informe um título com pelo menos 3 caracteres.");

      const post = await createCommunityPost({
        authorId: userId,
        title,
        body: content,
        disciplina,
        tags,
        participantUserIds,
        groupId,
      });
      return NextResponse.json({ ok: true, postId: post?.id });
    }

    if (action === "update_post") {
      const postId = String(body.postId || "").trim();
      const title = String(body.title || "").trim();
      const content = String(body.body || "").trim();
      const disciplina = String(body.disciplina || "Ciências").trim();
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

    if (action === "event_rsvp") {
      const eventId = String(body.eventId || "").trim();
      const statusRaw = String(body.status || "going").trim();
      const status =
        statusRaw === "interested" ? "interested" : statusRaw === "none" ? "none" : "going";
      if (!eventId) return jsonError("Evento não informado.");
      const result = await toggleCommunityEventRsvp({ userId, eventId, status });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "create_group") {
      const name = String(body.name || "").trim();
      const description = String(body.description || "").trim();
      const disciplina = String(body.disciplina || "Ciências").trim();
      const memberUserIds = Array.isArray(body.memberUserIds)
        ? body.memberUserIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : [];

      if (name.length < 3) return jsonError("Informe um nome com pelo menos 3 caracteres.");

      const group = await createCommunityGroup({
        ownerId: userId,
        name,
        description,
        disciplina,
        memberUserIds,
      });
      return NextResponse.json({ ok: true, groupId: group?.id });
    }

    if (action === "create_event") {
      const admin = await resolveAdminAccess(token);
      if (!admin.isAdmin) {
        return jsonError("Apenas administradores podem criar eventos.", 403);
      }

      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();
      const presenterName = String(body.presenterName || "").trim() || "Equipe Planify";
      const startsAt = String(body.startsAt || "").trim();
      const isOnline = body.isOnline !== false;
      const location = body.location ? String(body.location).trim() : null;

      if (title.length < 3) return jsonError("Informe um título com pelo menos 3 caracteres.");
      if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
        return jsonError("Informe uma data e hora válidas.");
      }

      const event = await createCommunityEvent({
        hostId: userId,
        title,
        description,
        presenterName,
        startsAt,
        isOnline,
        location,
      });
      return NextResponse.json({ ok: true, eventId: event?.id });
    }

    if (action === "update_event") {
      const admin = await resolveAdminAccess(token);
      if (!admin.isAdmin) {
        return jsonError("Apenas administradores podem editar eventos.", 403);
      }
      const eventId = String(body.eventId || "").trim();
      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();
      const presenterName = String(body.presenterName || "").trim() || "Equipe Planify";
      const startsAt = String(body.startsAt || "").trim();
      const isOnline = body.isOnline !== false;
      const location = body.location ? String(body.location).trim() : null;

      if (!eventId) return jsonError("Evento não informado.");
      if (title.length < 3) return jsonError("Informe um título com pelo menos 3 caracteres.");
      if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
        return jsonError("Informe uma data e hora válidas.");
      }

      await updateCommunityEvent({
        adminId: userId,
        eventId,
        title,
        description,
        presenterName,
        startsAt,
        isOnline,
        location,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_event") {
      const admin = await resolveAdminAccess(token);
      if (!admin.isAdmin) {
        return jsonError("Apenas administradores podem excluir eventos.", 403);
      }
      const eventId = String(body.eventId || "").trim();
      if (!eventId) return jsonError("Evento não informado.");
      await deleteCommunityEvent({ adminId: userId, eventId });
      return NextResponse.json({ ok: true });
    }

    if (action === "join_group") {
      const groupId = String(body.groupId || "").trim();
      if (!groupId) return jsonError("Grupo não informado.");
      const result = await joinCommunityGroup({ userId, groupId });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "leave_group") {
      const groupId = String(body.groupId || "").trim();
      if (!groupId) return jsonError("Grupo não informado.");
      const result = await leaveCommunityGroup({ userId, groupId });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "participate_challenge") {
      const challengeSlug = String(body.challengeSlug || "desafio-bncc").trim();
      const result = await completeCommunityChallenge({ userId, challengeSlug });
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

    if (action === "invite_group_members") {
      const groupId = String(body.groupId || "").trim();
      const memberUserIds = Array.isArray(body.memberUserIds)
        ? body.memberUserIds.map((id: unknown) => String(id).trim()).filter(Boolean)
        : [];
      if (!groupId) return jsonError("Grupo não informado.");
      const result = await inviteCommunityGroupMembers({
        ownerId: userId,
        groupId,
        memberUserIds,
      });
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
