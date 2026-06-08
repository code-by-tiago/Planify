import { getSupabaseAdminClient } from "../supabase/admin-client";
import { resolveCommunityAuthors } from "./marketplace-social-service";

export type FriendshipStatus =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "declined"
  | "blocked";

export type FriendshipRecord = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommunityFriendSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  friendshipId: string;
  since: string;
};

export type CommunityFriendshipCounts = {
  friendsCount: number;
  pendingIncomingCount: number;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapDbStatus(
  status: string,
  viewerId: string,
  row: FriendshipRow,
): FriendshipStatus {
  if (status === "accepted") return "accepted";
  if (status === "declined") return "declined";
  if (status === "blocked") return "blocked";
  if (status === "pending") {
    return row.requester_id === viewerId ? "pending_outgoing" : "pending_incoming";
  }
  return "none";
}

export async function findFriendshipBetweenUsers(params: {
  userId: string;
  otherUserId: string;
}): Promise<FriendshipRecord | null> {
  if (params.userId === params.otherUserId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .or(
      `and(requester_id.eq.${params.userId},addressee_id.eq.${params.otherUserId}),and(requester_id.eq.${params.otherUserId},addressee_id.eq.${params.userId})`,
    )
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as FriendshipRow;

  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: mapDbStatus(row.status, params.userId, row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFriendshipStatusBetweenUsers(params: {
  userId: string;
  otherUserId: string;
}): Promise<FriendshipStatus> {
  const record = await findFriendshipBetweenUsers(params);
  return record?.status || "none";
}

export async function getCommunityFriendshipCounts(
  userId: string,
): Promise<CommunityFriendshipCounts> {
  const supabase = getSupabaseAdminClient();

  try {
    const [friendsResult, pendingResult] = await Promise.all([
      supabase
        .from("community_friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase
        .from("community_friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("addressee_id", userId),
    ]);

    if (friendsResult.error || pendingResult.error) {
      return { friendsCount: 0, pendingIncomingCount: 0 };
    }

    return {
      friendsCount: friendsResult.count || 0,
      pendingIncomingCount: pendingResult.count || 0,
    };
  } catch {
    return { friendsCount: 0, pendingIncomingCount: 0 };
  }
}

export type CommunityPendingFriendSummary = CommunityFriendSummary & {
  direction: "incoming" | "outgoing";
};

async function mapFriendshipRows(
  userId: string,
  rows: FriendshipRow[],
): Promise<CommunityFriendSummary[]> {
  if (!rows.length) {
    return [];
  }

  const friendIds = rows.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );
  const authors = await resolveCommunityAuthors(friendIds);

  return rows.map((row) => {
    const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    const author = authors.get(friendId);

    return {
      userId: friendId,
      displayName: author?.displayName || "Professor",
      avatarUrl: author?.avatarUrl || null,
      friendshipId: row.id,
      since: row.updated_at,
    };
  });
}

export async function listPendingIncomingFriends(
  userId: string,
): Promise<CommunityPendingFriendSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .select("id,requester_id,addressee_id,updated_at")
    .eq("status", "pending")
    .eq("addressee_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const rows = data as FriendshipRow[];
  const requesterIds = rows.map((row) => row.requester_id);
  const authors = await resolveCommunityAuthors(requesterIds);

  return rows.map((row) => {
    const author = authors.get(row.requester_id);
    return {
      userId: row.requester_id,
      displayName: author?.displayName || "Professor",
      avatarUrl: author?.avatarUrl || null,
      friendshipId: row.id,
      since: row.updated_at,
      direction: "incoming" as const,
    };
  });
}

export async function listPendingOutgoingFriends(
  userId: string,
): Promise<CommunityPendingFriendSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .select("id,requester_id,addressee_id,updated_at")
    .eq("status", "pending")
    .eq("requester_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  const rows = data as FriendshipRow[];
  const addresseeIds = rows.map((row) => row.addressee_id);
  const authors = await resolveCommunityAuthors(addresseeIds);

  return rows.map((row) => {
    const author = authors.get(row.addressee_id);
    return {
      userId: row.addressee_id,
      displayName: author?.displayName || "Professor",
      avatarUrl: author?.avatarUrl || null,
      friendshipId: row.id,
      since: row.updated_at,
      direction: "outgoing" as const,
    };
  });
}

export async function listCommunityFriends(userId: string): Promise<CommunityFriendSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .select("id,requester_id,addressee_id,updated_at")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  return mapFriendshipRows(userId, data as FriendshipRow[]);
}

export async function listAcceptedFriendUserIds(userId: string): Promise<string[]> {
  const friends = await listCommunityFriends(userId);
  return friends.map((friend) => friend.userId);
}

export async function sendFriendRequest(params: {
  requesterId: string;
  addresseeId: string;
}): Promise<FriendshipRecord> {
  if (params.requesterId === params.addresseeId) {
    throw new Error("Você não pode adicionar a si mesmo.");
  }

  const existing = await findFriendshipBetweenUsers({
    userId: params.requesterId,
    otherUserId: params.addresseeId,
  });

  if (existing) {
    if (existing.status === "accepted") {
      throw new Error("Vocês já são amigos.");
    }
    if (existing.status === "blocked") {
      throw new Error("Não é possível enviar solicitação para este usuário.");
    }
    if (existing.status === "pending_outgoing") {
      return existing;
    }
    if (existing.status === "pending_incoming") {
      return acceptFriendRequest({
        userId: params.requesterId,
        otherUserId: params.addresseeId,
      });
    }
    if (existing.status === "declined") {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("community_friendships")
        .update({
          status: "pending",
          requester_id: params.requesterId,
          addressee_id: params.addresseeId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id,requester_id,addressee_id,status,created_at,updated_at")
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Não foi possível enviar solicitação.");
      }

      const row = data as FriendshipRow;
      return {
        id: row.id,
        requesterId: row.requester_id,
        addresseeId: row.addressee_id,
        status: "pending_outgoing",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .insert({
      requester_id: params.requesterId,
      addressee_id: params.addresseeId,
      status: "pending",
    })
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(error.message || "Não foi possível enviar solicitação.");
  }

  const row = data as FriendshipRow;
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: "pending_outgoing",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function acceptFriendRequest(params: {
  userId: string;
  otherUserId: string;
}): Promise<FriendshipRecord> {
  const existing = await findFriendshipBetweenUsers({
    userId: params.userId,
    otherUserId: params.otherUserId,
  });

  if (!existing) {
    throw new Error("Solicitação não encontrada.");
  }

  if (existing.status === "accepted") {
    return existing;
  }

  if (existing.status !== "pending_incoming") {
    throw new Error("Não há solicitação pendente para aceitar.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível aceitar solicitação.");
  }

  const row = data as FriendshipRow;
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: "accepted",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function declineFriendRequest(params: {
  userId: string;
  otherUserId: string;
}): Promise<void> {
  const existing = await findFriendshipBetweenUsers({
    userId: params.userId,
    otherUserId: params.otherUserId,
  });

  if (!existing || existing.status !== "pending_incoming") {
    throw new Error("Não há solicitação pendente para recusar.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("community_friendships")
    .update({
      status: "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    throw new Error(error.message || "Não foi possível recusar solicitação.");
  }
}

export async function cancelFriendRequest(params: {
  userId: string;
  otherUserId: string;
}): Promise<void> {
  const existing = await findFriendshipBetweenUsers({
    userId: params.userId,
    otherUserId: params.otherUserId,
  });

  if (!existing || existing.status !== "pending_outgoing") {
    throw new Error("Não há solicitação pendente para cancelar.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("community_friendships").delete().eq("id", existing.id);

  if (error) {
    throw new Error(error.message || "Não foi possível cancelar solicitação.");
  }
}

export async function blockCommunityUser(params: {
  userId: string;
  otherUserId: string;
}): Promise<FriendshipRecord> {
  if (params.userId === params.otherUserId) {
    throw new Error("Operação inválida.");
  }

  const existing = await findFriendshipBetweenUsers({
    userId: params.userId,
    otherUserId: params.otherUserId,
  });

  const supabase = getSupabaseAdminClient();

  if (existing) {
    const { data, error } = await supabase
      .from("community_friendships")
      .update({
        status: "blocked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id,requester_id,addressee_id,status,created_at,updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Não foi possível bloquear usuário.");
    }

    const row = data as FriendshipRow;
    return {
      id: row.id,
      requesterId: row.requester_id,
      addresseeId: row.addressee_id,
      status: "blocked",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  const { data, error } = await supabase
    .from("community_friendships")
    .insert({
      requester_id: params.userId,
      addressee_id: params.otherUserId,
      status: "blocked",
    })
    .select("id,requester_id,addressee_id,status,created_at,updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível bloquear usuário.");
  }

  const row = data as FriendshipRow;
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: "blocked",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function assertUsersAreFriends(params: {
  userId: string;
  otherUserId: string;
}): Promise<boolean> {
  const status = await getFriendshipStatusBetweenUsers(params);
  return status === "accepted";
}
