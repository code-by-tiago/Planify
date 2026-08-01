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
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const messageBody = String(form.get("body") || "").trim();
      const fileValue = form.get("file");

      let file: {
        name: string;
        mime: string;
        size: number;
        buffer: Uint8Array;
      } | null = null;

      if (fileValue instanceof File && fileValue.size > 0) {
        const arrayBuffer = await fileValue.arrayBuffer();
        file = {
          name: fileValue.name,
          mime: fileValue.type || "application/octet-stream",
          size: fileValue.size,
          buffer: new Uint8Array(arrayBuffer),
        };
      }

      const message = await sendCommunityGroupMessage({
        groupId,
        senderId: userId,
        body: messageBody,
        file,
      });
      return NextResponse.json({ ok: true, message });
    }

    const body = await request.json().catch(() => ({}));
    const messageBody = String(body.body || "").trim();
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
