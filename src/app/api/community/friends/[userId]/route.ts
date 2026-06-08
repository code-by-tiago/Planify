import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";
import {
  acceptFriendRequest,
  blockCommunityUser,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendshipStatusBetweenUsers,
} from "../../../../../server/community/community-friends-service";
import { createCommunityNotification } from "../../../../../server/community/community-notifications-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const viewerId = access.access.user?.id;

  if (!viewerId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { userId: otherUserId } = await context.params;

  if (!otherUserId) {
    return jsonError("Usuário não informado.", 400);
  }

  const status = await getFriendshipStatusBetweenUsers({
    userId: viewerId,
    otherUserId,
  });

  return NextResponse.json({ ok: true, status });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const viewerId = access.access.user?.id;

  if (!viewerId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { userId: otherUserId } = await context.params;

  if (!otherUserId) {
    return jsonError("Usuário não informado.", 400);
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "").trim().toLowerCase();

  try {
    if (action === "accept") {
      const friendship = await acceptFriendRequest({
        userId: viewerId,
        otherUserId,
      });

      void createCommunityNotification({
        userId: otherUserId,
        type: "friend_accepted",
        actorUserId: viewerId,
        bodyPreview: "Aceitou sua solicitação de amizade",
        friendshipId: friendship.id,
      });

      return NextResponse.json({ ok: true, friendship, status: friendship.status });
    }

    if (action === "decline") {
      await declineFriendRequest({ userId: viewerId, otherUserId });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    if (action === "cancel") {
      await cancelFriendRequest({ userId: viewerId, otherUserId });
      return NextResponse.json({ ok: true, status: "none" });
    }

    if (action === "block") {
      const friendship = await blockCommunityUser({
        userId: viewerId,
        otherUserId,
      });
      return NextResponse.json({ ok: true, friendship, status: friendship.status });
    }

    return jsonError("Ação inválida. Use accept, decline, cancel ou block.", 400);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível atualizar amizade.",
      400,
    );
  }
}
