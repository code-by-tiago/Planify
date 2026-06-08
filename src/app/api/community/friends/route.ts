import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  listCommunityFriends,
  listPendingIncomingFriends,
  listPendingOutgoingFriends,
  sendFriendRequest,
} from "../../../../server/community/community-friends-service";
import { createCommunityNotification } from "../../../../server/community/community-notifications-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const view = request.nextUrl.searchParams.get("view") || "friends";

  if (view === "incoming") {
    const pending = await listPendingIncomingFriends(userId);
    return NextResponse.json({ ok: true, pending });
  }

  if (view === "outgoing") {
    const pending = await listPendingOutgoingFriends(userId);
    return NextResponse.json({ ok: true, pending });
  }

  if (view === "all") {
    const [friends, incoming, outgoing] = await Promise.all([
      listCommunityFriends(userId),
      listPendingIncomingFriends(userId),
      listPendingOutgoingFriends(userId),
    ]);
    return NextResponse.json({ ok: true, friends, incoming, outgoing });
  }

  const friends = await listCommunityFriends(userId);
  return NextResponse.json({ ok: true, friends });
}

export async function POST(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const body = await request.json().catch(() => ({}));
  const addresseeId = String(body.userId || body.addresseeId || "").trim();

  if (!addresseeId) {
    return jsonError("Informe o usuário para adicionar.", 400);
  }

  try {
    const friendship = await sendFriendRequest({
      requesterId: userId,
      addresseeId,
    });

    void createCommunityNotification({
      userId: addresseeId,
      type: "friend_request",
      actorUserId: userId,
      bodyPreview: "Enviou uma solicitação de amizade",
      friendshipId: friendship.id,
    });

    return NextResponse.json({ ok: true, friendship });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível enviar solicitação.",
      400,
    );
  }
}
