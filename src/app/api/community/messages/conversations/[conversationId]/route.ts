import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../../server/auth/api-access";
import {
  listMessagesForConversation,
  markConversationRead,
  sendCommunityMessage,
} from "../../../../../../server/community/community-messages-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return jsonError("Conversa não informada.", 400);
  }

  try {
    const messages = await listMessagesForConversation({
      conversationId,
      userId,
    });
    await markConversationRead({ conversationId, userId });
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar mensagens.",
      400,
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const { conversationId } = await context.params;

  if (!conversationId) {
    return jsonError("Conversa não informada.", 400);
  }

  const body = await request.json().catch(() => ({}));
  const messageBody = String(body.body || body.message || "");

  try {
    const message = await sendCommunityMessage({
      conversationId,
      senderId: userId,
      body: messageBody,
    });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível enviar mensagem.",
      400,
    );
  }
}
