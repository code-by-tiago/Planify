import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import {
  deleteCommunityGroupMessage,
  updateCommunityGroupMessage,
} from "@/server/community/community-group-messages-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string; messageId: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const { id: groupId, messageId } = await params;
  const body = await request.json().catch(() => ({}));
  const messageBody = String(body.body || "").trim();

  try {
    const message = await updateCommunityGroupMessage({
      groupId,
      messageId,
      actorUserId: userId,
      body: messageBody,
    });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return jsonResponseError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const userId = access.access.user?.id;
  if (!userId) return jsonError("Não foi possível identificar sua conta.", 401);

  const { id: groupId, messageId } = await params;

  try {
    await deleteCommunityGroupMessage({
      groupId,
      messageId,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonResponseError(error);
  }
}

function jsonResponseError(error: unknown) {
  return jsonError(
    error instanceof Error ? error.message : "Não foi possível atualizar a mensagem.",
    403,
  );
}
