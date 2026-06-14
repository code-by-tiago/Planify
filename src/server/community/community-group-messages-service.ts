import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createCommunityNotification } from "./community-notifications-service";
import { consumeCommunityRateLimit } from "./community-rate-limit-service";
import { resolveCommunityAuthors } from "./marketplace-social-service";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CommunityGroupMessage = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  isOwn: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type MessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

async function assertGroupMember(groupId: string, userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: membership } = await supabase
    .from("community_group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Somente membros do grupo podem acessar o chat.");
  }
}

async function getGroupOwnerId(groupId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("community_groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();
  return (data?.owner_id as string | null) || null;
}

function mapMessageRow(
  row: MessageRow,
  authorMap: Map<string, { displayName: string; avatarUrl: string | null }>,
  viewerUserId: string,
  ownerId: string | null,
): CommunityGroupMessage {
  const author = authorMap.get(row.sender_id);
  const isOwn = row.sender_id === viewerUserId;
  const isOwner = ownerId === viewerUserId;
  const withinEditWindow = Date.now() - new Date(row.created_at).getTime() <= EDIT_WINDOW_MS;

  return {
    id: row.id,
    groupId: row.group_id,
    senderId: row.sender_id,
    senderName: author?.displayName || "Professor(a)",
    senderAvatarUrl: author?.avatarUrl || null,
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    isOwn,
    canEdit: isOwn && withinEditWindow,
    canDelete: isOwn || isOwner,
  };
}

export async function listCommunityGroupMessages(params: {
  groupId: string;
  viewerUserId: string;
  limit?: number;
}): Promise<CommunityGroupMessage[]> {
  await assertGroupMember(params.groupId, params.viewerUserId);

  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(params.limit || 50, 1), 100);
  const ownerId = await getGroupOwnerId(params.groupId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_group_messages")
    .select("id,group_id,sender_id,body,created_at,edited_at,deleted_at")
    .eq("group_id", params.groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }
    throw new Error(error.message || "Não foi possível carregar mensagens.");
  }

  const rows = (data || []) as MessageRow[];
  const senderIds = rows.map((row) => row.sender_id);
  const authorMap = await resolveCommunityAuthors(senderIds);

  return rows.map((row) => mapMessageRow(row, authorMap, params.viewerUserId, ownerId));
}

async function notifyGroupChatMembers(params: {
  groupId: string;
  senderId: string;
  body: string;
  groupName?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: members } = await supabase
    .from("community_group_members")
    .select("user_id")
    .eq("group_id", params.groupId);

  const recipientIds = (members || [])
    .map((row) => row.user_id as string)
    .filter((userId) => userId && userId !== params.senderId);

  if (recipientIds.length === 0) return;

  const preview = params.groupName
    ? `${params.groupName}: ${params.body.slice(0, 120)}`
    : params.body.slice(0, 160);
  const href = `/comunidade/grupo/${params.groupId}?tab=chat`;

  await Promise.all(
    recipientIds.map((userId) =>
      createCommunityNotification({
        userId,
        type: "message",
        actorUserId: params.senderId,
        bodyPreview: preview,
        targetType: "group",
        targetId: params.groupId,
        href,
      }),
    ),
  );
}

export async function sendCommunityGroupMessage(params: {
  groupId: string;
  senderId: string;
  body: string;
}): Promise<CommunityGroupMessage> {
  const body = String(params.body || "").trim();
  if (body.length < 1) {
    throw new Error("Digite uma mensagem.");
  }
  if (body.length > 4000) {
    throw new Error("Mensagem muito longa (máximo 4000 caracteres).");
  }

  await assertGroupMember(params.groupId, params.senderId);

  await consumeCommunityRateLimit({
    userId: params.senderId,
    bucketKey: "group_chat_send",
    limit: 30,
    windowSec: 60,
  });

  const supabase = getSupabaseAdminClient();
  const ownerId = await getGroupOwnerId(params.groupId);

  const { data: groupRow } = await supabase
    .from("community_groups")
    .select("name")
    .eq("id", params.groupId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_group_messages")
    .insert({
      group_id: params.groupId,
      sender_id: params.senderId,
      body,
    })
    .select("id,group_id,sender_id,body,created_at,edited_at,deleted_at")
    .single();

  if (error || !data) {
    if (isMissingTableError(error?.message || "")) {
      throw new Error("Chat do grupo em atualização. Tente novamente em instantes.");
    }
    throw new Error(error?.message || "Não foi possível enviar a mensagem.");
  }

  const row = data as MessageRow;
  const authorMap = await resolveCommunityAuthors([row.sender_id]);
  const message = mapMessageRow(row, authorMap, params.senderId, ownerId);

  void notifyGroupChatMembers({
    groupId: params.groupId,
    senderId: params.senderId,
    body: row.body,
    groupName: (groupRow?.name as string | null) || null,
  });

  return message;
}

export async function updateCommunityGroupMessage(params: {
  groupId: string;
  messageId: string;
  actorUserId: string;
  body: string;
}): Promise<CommunityGroupMessage> {
  const body = String(params.body || "").trim();
  if (body.length < 1) {
    throw new Error("Digite uma mensagem.");
  }
  if (body.length > 4000) {
    throw new Error("Mensagem muito longa (máximo 4000 caracteres).");
  }

  await assertGroupMember(params.groupId, params.actorUserId);

  const supabase = getSupabaseAdminClient();
  const ownerId = await getGroupOwnerId(params.groupId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (supabase as any)
    .from("community_group_messages")
    .select("id,group_id,sender_id,body,created_at,edited_at,deleted_at")
    .eq("id", params.messageId)
    .eq("group_id", params.groupId)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Mensagem não encontrada.");
  }

  const row = existing as MessageRow;
  if (row.deleted_at) {
    throw new Error("Esta mensagem foi removida.");
  }
  if (row.sender_id !== params.actorUserId) {
    throw new Error("Somente o(a) autor(a) pode editar a mensagem.");
  }
  if (Date.now() - new Date(row.created_at).getTime() > EDIT_WINDOW_MS) {
    throw new Error("O prazo para editar esta mensagem expirou (24h).");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_group_messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", params.messageId)
    .eq("group_id", params.groupId)
    .select("id,group_id,sender_id,body,created_at,edited_at,deleted_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível editar a mensagem.");
  }

  const authorMap = await resolveCommunityAuthors([(data as MessageRow).sender_id]);
  return mapMessageRow(data as MessageRow, authorMap, params.actorUserId, ownerId);
}

export async function deleteCommunityGroupMessage(params: {
  groupId: string;
  messageId: string;
  actorUserId: string;
}): Promise<void> {
  await assertGroupMember(params.groupId, params.actorUserId);

  const supabase = getSupabaseAdminClient();
  const ownerId = await getGroupOwnerId(params.groupId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (supabase as any)
    .from("community_group_messages")
    .select("id,sender_id,deleted_at")
    .eq("id", params.messageId)
    .eq("group_id", params.groupId)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Mensagem não encontrada.");
  }

  const row = existing as { id: string; sender_id: string; deleted_at: string | null };
  if (row.deleted_at) {
    return;
  }

  const canDelete = row.sender_id === params.actorUserId || ownerId === params.actorUserId;
  if (!canDelete) {
    throw new Error("Você não pode remover esta mensagem.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("community_group_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.messageId)
    .eq("group_id", params.groupId);

  if (error) {
    throw new Error(error.message || "Não foi possível remover a mensagem.");
  }
}
