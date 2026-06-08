import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";
import {
  listConversationsForUser,
  openConversationWithUser,
} from "../../../../../server/community/community-messages-service";

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

  const conversations = await listConversationsForUser(userId);
  return NextResponse.json({ ok: true, conversations });
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
  const otherUserId = String(body.userId || body.otherUserId || "").trim();

  if (!otherUserId) {
    return jsonError("Informe o usuário para abrir conversa.", 400);
  }

  try {
    const result = await openConversationWithUser({
      userId,
      otherUserId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível abrir conversa.",
      400,
    );
  }
}
