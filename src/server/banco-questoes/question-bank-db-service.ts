import { computeQuestionContentHash } from "@/lib/banco-questoes/question-bank-hash";
import type { Database } from "@/types/database";
import type { QuestionBankItem } from "@/types/question-bank";
import { getPrimarySchoolIdForUser } from "../schools/school-access";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type QuestionBankRow = Database["public"]["Tables"]["question_bank_items"]["Row"];
type QuestionBankInsert =
  Database["public"]["Tables"]["question_bank_items"]["Insert"];

export type QuestionBankListFilter = {
  componente?: string;
  anoSerie?: string;
  query?: string;
  limit?: number;
  offset?: number;
};

function mapRowToItem(row: QuestionBankRow): QuestionBankItem {
  const alternativas = Array.isArray(row.alternativas)
    ? (row.alternativas as string[])
    : [];

  return {
    id: row.id,
    enunciado: row.enunciado,
    tipo: row.tipo,
    alternativas,
    respostaEsperada: row.resposta_esperada,
    criterioCorrecao: row.criterio_correcao,
    componente: row.componente,
    anoSerie: row.ano_serie,
    etapa: row.etapa,
    tema: row.tema,
    bnccCodigos: row.bncc_codigos ?? [],
    tags: row.tags ?? [],
    sourceTitle: row.source_title ?? undefined,
    sourceType: row.source_type ?? undefined,
    isCommunity: row.visibility === "community" && row.is_published,
    isSchool: row.visibility === "school" && row.is_published,
    authorName: row.author_display_name ?? undefined,
    usageCount: row.usage_count,
    contentHash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItemToInsert(
  userId: string,
  item: Omit<QuestionBankItem, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    schoolId?: string | null;
  },
): QuestionBankInsert {
  const contentHash =
    item.contentHash ||
    computeQuestionContentHash(item.enunciado, item.tipo);

  return {
    id: item.id,
    user_id: userId,
    school_id: item.schoolId ?? null,
    enunciado: item.enunciado,
    tipo: item.tipo || "discursiva",
    alternativas: item.alternativas ?? [],
    resposta_esperada: item.respostaEsperada ?? "",
    criterio_correcao: item.criterioCorrecao ?? "",
    componente: item.componente || "Multicomponente",
    ano_serie: item.anoSerie || "Geral",
    etapa: item.etapa ?? "",
    tema: item.tema ?? "",
    bncc_codigos: item.bnccCodigos ?? [],
    tags: item.tags ?? [],
    source_title: item.sourceTitle ?? null,
    source_type: item.sourceType ?? null,
    content_hash: contentHash,
    visibility: "private",
    is_published: false,
    author_display_name: item.authorName ?? null,
  };
}

export function mapQuestionBankRow(row: QuestionBankRow): QuestionBankItem {
  return mapRowToItem(row);
}

export async function listUserQuestions(
  userId: string,
  filter: QuestionBankListFilter = {},
): Promise<QuestionBankItem[]> {
  const supabase = getSupabaseAdminClient();
  const limit = filter.limit ?? 500;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("question_bank_items")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.componente) {
    query = query.eq("componente", filter.componente);
  }
  if (filter.anoSerie) {
    query = query.eq("ano_serie", filter.anoSerie);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let items = (data ?? []).map((row) =>
    mapRowToItem(row as QuestionBankRow),
  );

  const q = filter.query?.trim().toLowerCase();
  if (q) {
    items = items.filter((item) => {
      const haystack = [
        item.enunciado,
        item.tema,
        item.tags.join(" "),
        item.bnccCodigos.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return items;
}

export async function listCommunityQuestions(
  filter: QuestionBankListFilter = {},
): Promise<QuestionBankItem[]> {
  const supabase = getSupabaseAdminClient();
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("question_bank_items")
    .select("*")
    .eq("visibility", "community")
    .eq("is_published", true)
    .order("usage_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.componente) {
    query = query.eq("componente", filter.componente);
  }
  if (filter.anoSerie) {
    query = query.eq("ano_serie", filter.anoSerie);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let items = (data ?? []).map((row) =>
    mapRowToItem(row as QuestionBankRow),
  );

  const q = filter.query?.trim().toLowerCase();
  if (q) {
    items = items.filter((item) => {
      const haystack = [
        item.enunciado,
        item.tema,
        item.authorName ?? "",
        item.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return items;
}

export async function listSchoolQuestions(
  schoolId: string,
  filter: QuestionBankListFilter = {},
): Promise<QuestionBankItem[]> {
  const supabase = getSupabaseAdminClient();
  const limit = filter.limit ?? 500;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("question_bank_items")
    .select("*")
    .eq("visibility", "school")
    .eq("is_published", true)
    .eq("school_id", schoolId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.componente) {
    query = query.eq("componente", filter.componente);
  }
  if (filter.anoSerie) {
    query = query.eq("ano_serie", filter.anoSerie);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let items = (data ?? []).map((row) =>
    mapRowToItem(row as QuestionBankRow),
  );

  const q = filter.query?.trim().toLowerCase();
  if (q) {
    items = items.filter((item) => {
      const haystack = [
        item.enunciado,
        item.tema,
        item.authorName ?? "",
        item.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return items;
}

async function assertActiveSchoolMember(
  userId: string,
  schoolId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("school_memberships")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Você não é membro ativo desta escola.");
  }
}

export async function publishToSchool(
  userId: string,
  questionId: string,
  schoolId: string,
): Promise<QuestionBankItem> {
  await assertActiveSchoolMember(userId, schoolId);

  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const authorName =
    (profile as { full_name?: string | null } | null)?.full_name?.trim() ||
    "Professor Planify";

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("question_bank_items")
    .update({
      visibility: "school",
      is_published: true,
      published_at: now,
      school_id: schoolId,
      author_display_name: authorName,
      updated_at: now,
    })
    .eq("id", questionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Questão não encontrada.");
  }

  return mapRowToItem(data as QuestionBankRow);
}

export async function resolveSchoolIdForUser(
  userId: string,
  requestedSchoolId?: string | null,
): Promise<string> {
  const schoolId =
    requestedSchoolId?.trim() || (await getPrimarySchoolIdForUser(userId));

  if (!schoolId) {
    throw new Error("Nenhuma escola vinculada à sua conta.");
  }

  await assertActiveSchoolMember(userId, schoolId);
  return schoolId;
}

export type UpsertQuestionResult = {
  item: QuestionBankItem;
  duplicate: boolean;
};

export async function upsertUserQuestion(
  userId: string,
  item: Omit<QuestionBankItem, "createdAt" | "updatedAt" | "id"> & {
    id?: string;
  },
): Promise<UpsertQuestionResult> {
  const supabase = getSupabaseAdminClient();
  const contentHash = computeQuestionContentHash(item.enunciado, item.tipo);

  const { data: existing } = await supabase
    .from("question_bank_items")
    .select("*")
    .eq("user_id", userId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existing && (!item.id || existing.id !== item.id)) {
    return {
      item: mapRowToItem(existing as QuestionBankRow),
      duplicate: true,
    };
  }

  const payload = mapItemToInsert(userId, { ...item, contentHash });
  const now = new Date().toISOString();
  const isServerId = item.id && !item.id.startsWith("qb-");

  if (isServerId && item.id) {
    const { data, error } = await supabase
      .from("question_bank_items")
      .update({
        ...payload,
        updated_at: now,
      })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { item: mapRowToItem(data as QuestionBankRow), duplicate: false };
  }

  const { data, error } = await supabase
    .from("question_bank_items")
    .upsert(
      {
        ...payload,
        id: undefined,
        updated_at: now,
      },
      { onConflict: "user_id,content_hash" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { item: mapRowToItem(data as QuestionBankRow), duplicate: false };
}

export async function deleteUserQuestion(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { error, count } = await supabase
    .from("question_bank_items")
    .delete({ count: "exact" })
    .eq("id", questionId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function publishToCommunity(
  userId: string,
  questionId: string,
): Promise<QuestionBankItem> {
  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const authorName =
    (profile as { full_name?: string | null } | null)?.full_name?.trim() ||
    "Professor Planify";

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("question_bank_items")
    .update({
      visibility: "community",
      is_published: true,
      published_at: now,
      author_display_name: authorName,
      updated_at: now,
    })
    .eq("id", questionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Questão não encontrada.");
  }

  return mapRowToItem(data as QuestionBankRow);
}

export async function unpublishFromCommunity(
  questionId: string,
): Promise<QuestionBankItem> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("question_bank_items")
    .update({
      visibility: "private",
      is_published: false,
      published_at: null,
      updated_at: now,
    })
    .eq("id", questionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Questão não encontrada.");
  }

  return mapRowToItem(data as QuestionBankRow);
}

export async function incrementUsageCount(questionId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: row } = await supabase
    .from("question_bank_items")
    .select("usage_count")
    .eq("id", questionId)
    .maybeSingle();

  if (!row) return;

  const current = Number((row as { usage_count?: number }).usage_count ?? 0);
  await supabase
    .from("question_bank_items")
    .update({ usage_count: current + 1 })
    .eq("id", questionId);
}

export async function migrateLocalQuestions(
  userId: string,
  items: (Omit<QuestionBankItem, "createdAt" | "updatedAt"> & { id?: string })[],
): Promise<{ imported: number; duplicates: number; items: QuestionBankItem[] }> {
  const results: QuestionBankItem[] = [];
  let imported = 0;
  let duplicates = 0;

  for (const item of items) {
    const { item: saved, duplicate } = await upsertUserQuestion(userId, item);
    results.push(saved);
    if (duplicate) duplicates += 1;
    else imported += 1;
  }

  return { imported, duplicates, items: results };
}

export async function countUserQuestions(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("question_bank_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
