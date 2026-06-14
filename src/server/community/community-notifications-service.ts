import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveCommunityAuthors } from "./marketplace-social-service";
import type {
  CommunityNotificationTargetType,
  CommunityNotificationType,
} from "@/lib/community/types";

export type CommunityNotification = {
  id: string;
  type: CommunityNotificationType;
  actorUserId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  materialId: string | null;
  conversationId: string | null;
  friendshipId: string | null;
  targetType: CommunityNotificationTargetType | null;
  targetId: string | null;
  href: string | null;
  bodyPreview: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: CommunityNotificationType;
  actor_user_id: string;
  material_id: string | null;
  conversation_id: string | null;
  friendship_id: string | null;
  target_type: string | null;
  target_id: string | null;
  href: string | null;
  body_preview: string;
  read_at: string | null;
  created_at: string;
};

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

function isMissingColumnError(message: string): boolean {
  return /column.*does not exist|schema cache/i.test(message);
}

export async function createCommunityNotification(params: {
  userId: string;
  type: CommunityNotificationType;
  actorUserId: string;
  bodyPreview: string;
  materialId?: string | null;
  conversationId?: string | null;
  friendshipId?: string | null;
  targetType?: CommunityNotificationTargetType | null;
  targetId?: string | null;
  href?: string | null;
}): Promise<void> {
  if (params.userId === params.actorUserId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const preview = params.bodyPreview.trim().slice(0, 280) || "Nova atividade na Comunidade";

  const payload: Record<string, unknown> = {
    user_id: params.userId,
    type: params.type,
    actor_user_id: params.actorUserId,
    material_id: params.materialId || null,
    conversation_id: params.conversationId || null,
    friendship_id: params.friendshipId || null,
    body_preview: preview,
  };

  if (params.targetType) payload.target_type = params.targetType;
  if (params.targetId) payload.target_id = params.targetId;
  if (params.href) payload.href = params.href;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("community_notifications").insert(payload);

  if (error && !isMissingTableError(error.message) && !isMissingColumnError(error.message)) {
    console.warn("[community-notifications] create failed:", error.message);
  } else if (error && isMissingColumnError(error.message)) {
    // Fallback for databases without deep-link columns yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("community_notifications").insert({
      user_id: params.userId,
      type: params.type,
      actor_user_id: params.actorUserId,
      material_id: params.materialId || null,
      conversation_id: params.conversationId || null,
      friendship_id: params.friendshipId || null,
      body_preview: preview,
    });
  }
}

export async function listCommunityNotifications(params: {
  userId: string;
  limit?: number;
}): Promise<CommunityNotification[]> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_notifications")
    .select(
      "id,user_id,type,actor_user_id,material_id,conversation_id,friendship_id,target_type,target_id,href,body_preview,read_at,created_at",
    )
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(params.limit || 40);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    throw new Error(error.message || "Não foi possível carregar notificações.");
  }

  const rows = (data || []) as NotificationRow[];
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id))];
  const authors = await resolveCommunityAuthors(actorIds);

  return rows.map((row) => {
    const actor = authors.get(row.actor_user_id);
    return {
      id: row.id,
      type: row.type,
      actorUserId: row.actor_user_id,
      actorName: actor?.displayName || "Professor",
      actorAvatarUrl: actor?.avatarUrl || null,
      materialId: row.material_id,
      conversationId: row.conversation_id,
      friendshipId: row.friendship_id,
      targetType: (row.target_type as CommunityNotificationTargetType | null) || null,
      targetId: row.target_id,
      href: row.href,
      bodyPreview: row.body_preview,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from("community_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (isMissingTableError(error.message)) {
      return 0;
    }
    return 0;
  }

  return count || 0;
}

export async function markNotificationsRead(params: {
  userId: string;
  notificationIds?: string[];
  markAll?: boolean;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("community_notifications")
    .update({ read_at: now })
    .eq("user_id", params.userId)
    .is("read_at", null);

  if (!params.markAll && params.notificationIds?.length) {
    query = query.in("id", params.notificationIds);
  }

  const { error } = await query;

  if (error && !isMissingTableError(error.message)) {
    throw new Error(error.message || "Não foi possível marcar notificações como lidas.");
  }
}
