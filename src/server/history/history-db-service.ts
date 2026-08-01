import type { HistoryItem } from "../../types/history";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const TABLE_NAME = "user_history";

type HistoryDBRow = {
  id: string;
  user_id: string | null;
  title: string;
  subtitle: string | null;
  source: string;
  type: string;
  status: string;
  content_preview: string;
  content: string;
  raw: unknown;
  created_at: string;
  updated_at: string;
};

export type HistoryDBInput = {
  userId?: string | null;
  item: HistoryItem;
};

function historyItemToRow(input: HistoryDBInput): HistoryDBRow {
  return {
    id: input.item.id,
    user_id: input.userId || null,
    title: input.item.title,
    subtitle: input.item.subtitle || null,
    source: input.item.source,
    type: input.item.type,
    status: input.item.status,
    content_preview: input.item.contentPreview || input.item.content.slice(0, 260),
    content: input.item.content,
    raw: input.item.raw || null,
    created_at: input.item.createdAt,
    updated_at: input.item.updatedAt,
  };
}

function rowToHistoryItem(row: HistoryDBRow): HistoryItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    source: row.source as HistoryItem["source"],
    type: row.type,
    status: row.status as HistoryItem["status"],
    contentPreview: row.content_preview,
    content: row.content,
    raw: row.raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveHistoryItemToDB(input: HistoryDBInput): Promise<HistoryItem> {
  const supabase = getSupabaseAdminClient();
  const row = historyItemToRow(input);

  const { data, error } = await (supabase as any)
    .from(TABLE_NAME)
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToHistoryItem(data as HistoryDBRow);
}

export async function listHistoryItemsFromDB(params: {
  userId?: string | null;
  limit?: number;
}): Promise<HistoryItem[]> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(params.limit || 50, 1), 100);

  let query = supabase
    .from(TABLE_NAME)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!params.userId) {
    return [];
  }

  query = query.eq("user_id", params.userId);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as unknown as HistoryDBRow[]).map(rowToHistoryItem);
}

export async function deleteHistoryItemFromDB(params: {
  id: string;
  userId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();

  if (!params.userId) {
    throw new Error("Usuário não autenticado.");
  }

  const query = (supabase as any)
    .from(TABLE_NAME)
    .delete()
    .eq("id", params.id)
    .eq("user_id", params.userId);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearHistoryItemsFromDB(params: {
  userId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();

  if (!params.userId) {
    throw new Error("Usuário não autenticado.");
  }

  const query = (supabase as any)
    .from(TABLE_NAME)
    .delete()
    .eq("user_id", params.userId);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}
