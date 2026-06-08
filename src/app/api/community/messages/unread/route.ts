import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../../server/auth/api-access";
import { getUnreadMessageCount } from "../../../../../server/community/community-messages-service";

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

  const unreadCount = await getUnreadMessageCount(userId);
  return NextResponse.json({ ok: true, unreadCount });
}
