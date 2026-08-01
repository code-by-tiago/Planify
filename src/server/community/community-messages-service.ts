import { getSupabaseAdminClient } from "../supabase/admin-client";
import { assertUsersAreFriends } from "./community-friends-service";
import { resolveCommunityAuthors } from "./marketplace-social-service";

export type CommunityMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type CommunityConversationSummary = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type ConversationRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function canonicalPair(userId: string, otherUserId: string): [string, string] {
  return userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
}

function mapMessage(row: MessageRow): CommunityMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function getOrCreateConversation(params: {
  userId: string;
  otherUserId: string;
}): Promise<ConversationRow> {
  if (params.userId === params.otherUserId) {
    throw new Error("Conversa inválida.");
  }

  const areFriends = await assertUsersAreFriends({
    userId: params.userId,
    otherUserId: params.otherUserId,
  });

  if (!areFriends) {
    throw new Error("Somente amigos aceitos podem trocar mensagens.");
  }

  const [userAId, userBId] = canonicalPair(params.userId, params.otherUserId);
  const supabase = getSupabaseAdminClient();

  const existing = await supabase
    .from("community_conversations")
    .select("id,user_a_id,user_b_id,created_at,updated_at")
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  if (existing.data) {
    return existing.data as ConversationRow;
  }

  const { data, error } = await supabase
    .from("community_conversations")
    .insert({
      user_a_id: userAId,
      user_b_id: userBId,
    })
    .select("id,user_a_id,user_b_id,created_at,updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível abrir conversa.");
  }

  return data as ConversationRow;
}

export async function listConversationsForUser(
  userId: string,
): Promise<CommunityConversationSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_conversations")
    .select("id,user_a_id,user_b_id,updated_at")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const conversations = data as ConversationRow[];
  const conversationIds = conversations.map((row) => row.id);
  const otherUserIds = conversations.map((row) =>
    row.user_a_id === userId ? row.user_b_id : row.user_a_id,
  );

  const [authors, messagesResult] = await Promise.all([
    resolveCommunityAuthors(otherUserIds),
    supabase
      .from("community_messages")
      .select("id,conversation_id,sender_id,body,read_at,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const lastMessageByConversation = new Map<string, MessageRow>();
  const unreadByConversation = new Map<string, number>();

  for (const row of (messagesResult.data || []) as MessageRow[]) {
    if (!lastMessageByConversation.has(row.conversation_id)) {
      lastMessageByConversation.set(row.conversation_id, row);
    }
    if (row.sender_id !== userId && !row.read_at) {
      unreadByConversation.set(
        row.conversation_id,
        (unreadByConversation.get(row.conversation_id) || 0) + 1,
      );
    }
  }

  return conversations.map((conversation) => {
    const otherUserId =
      conversation.user_a_id === userId ? conversation.user_b_id : conversation.user_a_id;
    const author = authors.get(otherUserId);
    const lastMessage = lastMessageByConversation.get(conversation.id);

    return {
      id: conversation.id,
      otherUserId,
      otherUserName: author?.displayName || "Professor",
      otherUserAvatarUrl: author?.avatarUrl || null,
      lastMessageBody: lastMessage?.body || null,
      lastMessageAt: lastMessage?.created_at || conversation.updated_at,
      unreadCount: unreadByConversation.get(conversation.id) || 0,
    };
  });
}

export async function listMessagesForConversation(params: {
  conversationId: string;
  userId: string;
  limit?: number;
}): Promise<CommunityMessage[]> {
  const supabase = getSupabaseAdminClient();

  const conversation = await supabase
    .from("community_conversations")
    .select("id,user_a_id,user_b_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  const row = conversation.data as ConversationRow | null;

  if (!row || (row.user_a_id !== params.userId && row.user_b_id !== params.userId)) {
    throw new Error("Conversa não encontrada.");
  }

  const { data, error } = await supabase
    .from("community_messages")
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true })
    .limit(params.limit || 100);

  if (error) {
    throw new Error(error.message || "Não foi possível carregar mensagens.");
  }

  return ((data || []) as MessageRow[]).map(mapMessage);
}

export async function sendCommunityMessage(params: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<CommunityMessage> {
  const trimmed = params.body.trim();

  if (!trimmed) {
    throw new Error("Digite uma mensagem.");
  }

  if (trimmed.length > 4000) {
    throw new Error("Mensagem muito longa (máx. 4000 caracteres).");
  }

  const supabase = getSupabaseAdminClient();

  const conversation = await supabase
    .from("community_conversations")
    .select("id,user_a_id,user_b_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  const row = conversation.data as ConversationRow | null;

  if (!row || (row.user_a_id !== params.senderId && row.user_b_id !== params.senderId)) {
    throw new Error("Conversa não encontrada.");
  }

  const otherUserId = row.user_a_id === params.senderId ? row.user_b_id : row.user_a_id;
  const areFriends = await assertUsersAreFriends({
    userId: params.senderId,
    otherUserId,
  });

  if (!areFriends) {
    throw new Error("Somente amigos aceitos podem trocar mensagens.");
  }

  const { data, error } = await supabase
    .from("community_messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      body: trimmed,
    })
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível enviar mensagem.");
  }

  await supabase
    .from("community_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.conversationId);

  return mapMessage(data as MessageRow);
}

export async function markConversationRead(params: {
  conversationId: string;
  userId: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const conversation = await supabase
    .from("community_conversations")
    .select("id,user_a_id,user_b_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  const row = conversation.data as ConversationRow | null;

  if (!row || (row.user_a_id !== params.userId && row.user_b_id !== params.userId)) {
    throw new Error("Conversa não encontrada.");
  }

  const now = new Date().toISOString();
  await supabase
    .from("community_messages")
    .update({ read_at: now })
    .eq("conversation_id", params.conversationId)
    .neq("sender_id", params.userId)
    .is("read_at", null);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { data: conversations } = await supabase
    .from("community_conversations")
    .select("id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const conversationIds = (conversations || []).map((row) => row.id as string);

  if (!conversationIds.length) {
    return 0;
  }

  const { count, error } = await supabase
    .from("community_messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function openConversationWithUser(params: {
  userId: string;
  otherUserId: string;
}): Promise<{ conversationId: string }> {
  const conversation = await getOrCreateConversation(params);
  return { conversationId: conversation.id };
}
