import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  listCommunityGroupMessages,
  sendCommunityGroupMessage,
} from "@/server/community/community-group-messages-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const { id: groupId } = await params;

  try {
    const messages = await listCommunityGroupMessages({
      groupId,
      viewerUserId: userId,
      limit: 80,
    });
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar mensagens.",
      403,
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const { id: groupId } = await params;
  const body = await request.json().catch(() => ({}));
  const messageBody = String(body.body || "").trim();

  try {
    const message = await sendCommunityGroupMessage({
      groupId,
      senderId: userId,
      body: messageBody,
    });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível enviar a mensagem.",
      403,
    );
  }
}
