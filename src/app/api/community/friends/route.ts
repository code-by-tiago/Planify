import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  listCommunityFriends,
  sendFriendRequest,
} from "../../../../server/community/community-friends-service";

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
    return NextResponse.json({ ok: true, friendship });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível enviar solicitação.",
      400,
    );
  }
}
