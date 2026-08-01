import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createCommunityNotification } from "./community-notifications-service";
import { consumeCommunityRateLimit } from "./community-rate-limit-service";
import { resolveCommunityAuthors } from "./marketplace-social-service";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHAT_FILES_BUCKET = "community-group-files";
const CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024;
const CHAT_FILE_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

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
  fileName: string | null;
  fileMime: string | null;
  hasFile: boolean;
};

type MessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  file_name?: string | null;
  file_mime?: string | null;
  file_path?: string | null;
  file_size?: number | null;
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
    canEdit: isOwn && withinEditWindow && !row.file_path,
    canDelete: isOwn || isOwner,
    fileName: row.file_name || null,
    fileMime: row.file_mime || null,
    hasFile: Boolean(row.file_path),
  };
}

function safeChatFilename(name: string): string {
  return name.replace(/[^\w.\-()áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ ]+/g, "_").slice(0, 120) || "arquivo";
}

async function ensureChatFilesBucket() {
  const client = getSupabaseAdminClient();
  try {
    const { data } = await client.storage.getBucket(CHAT_FILES_BUCKET);
    if (data) return client;
  } catch {
    // continue
  }

  const { error } = await client.storage.createBucket(CHAT_FILES_BUCKET, {
    public: false,
    fileSizeLimit: "10MB",
  });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }

  return client;
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
    .select(
      "id,group_id,sender_id,body,created_at,edited_at,deleted_at,file_name,file_mime,file_path,file_size",
    )
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
  file?: {
    name: string;
    mime: string;
    size: number;
    buffer: Uint8Array;
  } | null;
}): Promise<CommunityGroupMessage> {
  const body = String(params.body || "").trim();
  const file = params.file || null;

  if (!body && !file) {
    throw new Error("Digite uma mensagem ou anexe um arquivo.");
  }
  if (body.length > 4000) {
    throw new Error("Mensagem muito longa (máximo 4000 caracteres).");
  }
  if (file) {
    if (file.size <= 0 || file.size > CHAT_FILE_MAX_BYTES) {
      throw new Error("Arquivo inválido (máximo 10 MB).");
    }
    if (!CHAT_FILE_MIMES.has(file.mime)) {
      throw new Error("Formato de arquivo não suportado no chat.");
    }
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

  const messageId = crypto.randomUUID();
  let filePath: string | null = null;
  let fileName: string | null = null;
  let fileMime: string | null = null;
  let fileSize: number | null = null;

  if (file) {
    const client = await ensureChatFilesBucket();
    fileName = safeChatFilename(file.name);
    fileMime = file.mime;
    fileSize = file.size;
    const extension = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    filePath = `${params.groupId}/${messageId}/${messageId}.${extension}`;

    const { error: uploadError } = await client.storage
      .from(CHAT_FILES_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mime,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Não foi possível enviar o arquivo.");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("community_group_messages")
    .insert({
      id: messageId,
      group_id: params.groupId,
      sender_id: params.senderId,
      body: body || "📎 Arquivo anexado",
      file_name: fileName,
      file_mime: fileMime,
      file_path: filePath,
      file_size: fileSize,
    })
    .select(
      "id,group_id,sender_id,body,created_at,edited_at,deleted_at,file_name,file_mime,file_path,file_size",
    )
    .single();

  if (error || !data) {
    if (filePath) {
      await supabase.storage.from(CHAT_FILES_BUCKET).remove([filePath]);
    }
    if (isMissingTableError(error?.message || "")) {
      throw new Error("Chat do grupo em atualização. Tente novamente em instantes.");
    }
    throw new Error(error?.message || "Não foi possível enviar a mensagem.");
  }

  const row = data as MessageRow;
  const authorMap = await resolveCommunityAuthors([row.sender_id]);
  const message = mapMessageRow(row, authorMap, params.senderId, ownerId);

  const notifyBody = row.file_path
    ? `${body || "Arquivo"} 📎 ${row.file_name || "anexo"}`
    : row.body;

  void notifyGroupChatMembers({
    groupId: params.groupId,
    senderId: params.senderId,
    body: notifyBody,
    groupName: (groupRow?.name as string | null) || null,
  });

  return message;
}

export async function downloadCommunityGroupMessageFile(params: {
  groupId: string;
  messageId: string;
  viewerUserId: string;
}): Promise<{ buffer: Buffer; fileName: string; mime: string }> {
  await assertGroupMember(params.groupId, params.viewerUserId);

  const supabase = getSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (supabase as any)
    .from("community_group_messages")
    .select("id,group_id,file_name,file_mime,file_path,deleted_at")
    .eq("id", params.messageId)
    .eq("group_id", params.groupId)
    .maybeSingle();

  if (error || !row || row.deleted_at || !row.file_path) {
    throw new Error("Arquivo não encontrado.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(CHAT_FILES_BUCKET)
    .download(row.file_path as string);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message || "Não foi possível baixar o arquivo.");
  }

  const arrayBuffer = await fileData.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    fileName: (row.file_name as string) || "arquivo-chat",
    mime: (row.file_mime as string) || "application/octet-stream",
  };
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
    .select(
      "id,group_id,sender_id,body,created_at,edited_at,deleted_at,file_name,file_mime,file_path,file_size",
    )
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
    .select(
      "id,group_id,sender_id,body,created_at,edited_at,deleted_at,file_name,file_mime,file_path,file_size",
    )
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
