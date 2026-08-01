import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  getUnreadNotificationCount,
  listCommunityNotifications,
  markNotificationsRead,
} from "../../../../server/community/community-notifications-service";

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

  try {
    const [notifications, unreadCount] = await Promise.all([
      listCommunityNotifications({ userId }),
      getUnreadNotificationCount(userId),
    ]);

    return NextResponse.json({ ok: true, notifications, unreadCount });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar notificações.",
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);

  if (!access.ok) {
    return access.response;
  }

  const userId = access.access.user?.id;

  if (!userId) {
    return jsonError("Não foi possível identificar sua conta.", 401);
  }

  const body = await request.json().catch(() => ({}));
  const notificationIds = Array.isArray(body.notificationIds)
    ? body.notificationIds.map(String)
    : undefined;
  const markAll = Boolean(body.markAll);

  try {
    await markNotificationsRead({ userId, notificationIds, markAll });
    const unreadCount = await getUnreadNotificationCount(userId);
    return NextResponse.json({ ok: true, unreadCount });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível atualizar notificações.",
      500,
    );
  }
}
