import "server-only";

import {
  computeContentHash,
  computeTopicSignature,
  normalizeAliasKey,
} from "@/lib/pedagogical-cache/topic-signature";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";

export type PedagogicalCacheEntry = Tables<"pedagogical_cache_entries"> & {
  source_slug?: string;
  source_priority?: number;
};

export type PedagogicalSource = Tables<"pedagogical_sources">;

export type UpsertCacheEntryInput = {
  query: PedagogicalScrapeQuery;
  sourceId: string;
  sourceSlug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  contentType?: TablesInsert<"pedagogical_cache_entries">["content_type"];
  sourceUrl?: string;
  sourceTitle?: string;
  sourceLicense?: string;
  bnccCodigos?: string[];
  tags?: string[];
  reviewStatus?: TablesInsert<"pedagogical_cache_entries">["review_status"];
  formatApplied?: boolean;
  aiTokensUsed?: number;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
};

const TOKENS_SAVED_PER_HIT = 4000;

export async function getActiveSources(): Promise<PedagogicalSource[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_sources")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as PedagogicalSource[];
}

export async function getSourceBySlug(slug: string): Promise<PedagogicalSource | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_sources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PedagogicalSource | null) ?? null;
}

export async function findApprovedEntries(
  query: PedagogicalScrapeQuery,
): Promise<PedagogicalCacheEntry[]> {
  const supabase = getSupabaseAdminClient();
  const topicSignature = computeTopicSignature({
    tema: query.tema,
    componente: query.componente,
    etapa: query.etapa,
    bnccCodigo: query.bnccCodigos?.[0],
  });

  const aliasKeys = [
    normalizeAliasKey(query.tema),
    ...(query.bnccCodigos || []).map((c) => normalizeAliasKey(c)),
  ].filter(Boolean);

  const entryIdsFromAliases = new Set<string>();

  if (aliasKeys.length) {
    const { data: aliases } = await supabase
      .from("pedagogical_cache_aliases")
      .select("entry_id")
      .in("alias_key", aliasKeys);

    for (const row of aliases || []) {
      entryIdsFromAliases.add(row.entry_id);
    }
  }

  const nowIso = new Date().toISOString();
  const orFilters: string[] = [`topic_signature.eq.${topicSignature}`];
  if (entryIdsFromAliases.size) {
    orFilters.push(`id.in.(${Array.from(entryIdsFromAliases).join(",")})`);
  }

  let dbQuery = supabase
    .from("pedagogical_cache_entries")
    .select("*")
    .eq("review_status", "approved")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .or(orFilters.join(","));

  // Com tema preenchido, entradas curadas (ex.: Wikipédia) podem ter bncc_codigos vazio.
  // overlaps() excluía alias hits quando o professor já tinha BNCC selecionada.
  const bnccOnlyLookup = Boolean(query.bnccCodigos?.length) && !query.tema?.trim();
  if (bnccOnlyLookup) {
    dbQuery = dbQuery.overlaps("bncc_codigos", query.bnccCodigos!);
  }

  const { data, error } = await dbQuery.limit(10);
  if (error) throw new Error(error.message);

  const rows = (data || []) as Tables<"pedagogical_cache_entries">[];
  const sources = await getActiveSources();
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const mapped = rows.map((row) => {
    const source = sourceById.get(row.source_id);
    return {
      ...row,
      source_slug: source?.slug,
      source_priority: source?.priority,
    };
  });

  mapped.sort((a, b) => (a.source_priority ?? 100) - (b.source_priority ?? 100));

  const seen = new Set<string>();
  return mapped.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export async function upsertCacheEntry(
  input: UpsertCacheEntryInput,
): Promise<{ entry: PedagogicalCacheEntry; created: boolean }> {
  const supabase = getSupabaseAdminClient();
  const topicSignature = computeTopicSignature({
    tema: input.query.tema,
    componente: input.query.componente,
    etapa: input.query.etapa,
    bnccCodigo: input.query.bnccCodigos?.[0] || input.bnccCodigos?.[0],
  });
  const contentHash = computeContentHash(input.bodyMarkdown, input.title);

  const { data: existing } = await supabase
    .from("pedagogical_cache_entries")
    .select("*")
    .eq("topic_signature", topicSignature)
    .eq("source_id", input.sourceId)
    .maybeSingle();

  const row: TablesInsert<"pedagogical_cache_entries"> = {
    topic_signature: topicSignature,
    content_hash: contentHash,
    title: input.title,
    summary: input.summary.slice(0, 400),
    body_markdown: input.bodyMarkdown,
    content_type: input.contentType || "context",
    componente: input.query.componente || null,
    ano_serie: input.query.anoSerie || null,
    etapa: input.query.etapa || null,
    bncc_codigos: input.bnccCodigos || input.query.bnccCodigos || [],
    tags: input.tags || [],
    source_id: input.sourceId,
    source_url: input.sourceUrl || null,
    source_title: input.sourceTitle || input.title,
    source_license: input.sourceLicense || null,
    source_fetched_at: new Date().toISOString(),
    review_status: input.reviewStatus || "pending",
    format_applied: input.formatApplied ?? false,
    ai_tokens_used: input.aiTokensUsed ?? 0,
    expires_at: input.expiresAt ?? null,
    metadata: (input.metadata || {}) as TablesInsert<"pedagogical_cache_entries">["metadata"],
  };

  if (existing) {
    if (existing.content_hash === contentHash) {
      return { entry: existing as PedagogicalCacheEntry, created: false };
    }

    const { data: updated, error } = await supabase
      .from("pedagogical_cache_entries")
      .update({
        ...row,
        review_status: input.reviewStatus || existing.review_status,
      } as TablesUpdate<"pedagogical_cache_entries">)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    await upsertAliasesForEntry(updated.id, input);
    return { entry: updated as PedagogicalCacheEntry, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("pedagogical_cache_entries")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  await upsertAliasesForEntry(inserted.id, input);
  return { entry: inserted as PedagogicalCacheEntry, created: true };
}

async function upsertAliasesForEntry(
  entryId: string,
  input: UpsertCacheEntryInput,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const aliases: TablesInsert<"pedagogical_cache_aliases">[] = [];

  const temaKey = normalizeAliasKey(input.query.tema);
  if (temaKey) {
    aliases.push({ entry_id: entryId, alias_key: temaKey, alias_type: "tema" });
  }

  for (const code of input.bnccCodigos || input.query.bnccCodigos || []) {
    const key = normalizeAliasKey(code);
    if (key) {
      aliases.push({ entry_id: entryId, alias_key: key, alias_type: "bncc" });
    }
  }

  if (!aliases.length) return;

  await supabase.from("pedagogical_cache_aliases").upsert(aliases, {
    onConflict: "alias_key",
    ignoreDuplicates: false,
  });
}

export async function recordCacheHit(
  entryId: string,
  userId: string | null,
  usageType: "snippet" | "generation_inject",
  toolTipo?: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: entry } = await supabase
    .from("pedagogical_cache_entries")
    .select("hit_count")
    .eq("id", entryId)
    .single();

  await supabase
    .from("pedagogical_cache_entries")
    .update({
      hit_count: (entry?.hit_count ?? 0) + 1,
      last_hit_at: new Date().toISOString(),
    })
    .eq("id", entryId);

  await supabase.from("pedagogical_cache_usage").insert({
    entry_id: entryId,
    user_id: userId,
    usage_type: usageType,
    tokens_saved_estimate: TOKENS_SAVED_PER_HIT,
    ai_tokens_spent: 0,
    tool_tipo: toolTipo ?? null,
  });
}

export async function recordCacheMissUsage(
  userId: string | null,
  toolTipo?: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("pedagogical_cache_usage").insert({
    entry_id: null,
    user_id: userId,
    usage_type: "scrape_miss",
    tokens_saved_estimate: 0,
    ai_tokens_spent: 0,
    tool_tipo: toolTipo ?? null,
  });
}

export async function createScrapeJob(input: {
  trigger: string;
  query: PedagogicalScrapeQuery;
  requestedBy?: string | null;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_scrape_jobs")
    .insert({
      trigger: input.trigger,
      query: input.query as TablesInsert<"pedagogical_scrape_jobs">["query"],
      status: "queued",
      requested_by: input.requestedBy ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateScrapeJob(
  jobId: string,
  patch: TablesUpdate<"pedagogical_scrape_jobs">,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("pedagogical_scrape_jobs")
    .update(patch)
    .eq("id", jobId);

  if (error) throw new Error(error.message);
}

export async function listPendingEntries(limit = 50): Promise<PedagogicalCacheEntry[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_cache_entries")
    .select("*")
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const sources = await getActiveSources();
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return ((data || []) as Tables<"pedagogical_cache_entries">[]).map((row) => ({
    ...row,
    source_slug: sourceById.get(row.source_id)?.slug,
  }));
}

export async function reviewCacheEntry(
  entryId: string,
  status: "approved" | "rejected",
  reviewedBy: string,
  notes?: string,
): Promise<PedagogicalCacheEntry> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_cache_entries")
    .update({
      review_status: status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq("id", entryId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PedagogicalCacheEntry;
}

export async function markStaleEntries(ttlDays = 90): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ttlDays);

  const { data, error } = await supabase
    .from("pedagogical_cache_entries")
    .update({ review_status: "stale" })
    .eq("review_status", "approved")
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) throw new Error(error.message);

  const { data: expiredByAge } = await supabase
    .from("pedagogical_cache_entries")
    .update({ review_status: "stale" })
    .eq("review_status", "approved")
    .is("expires_at", null)
    .lt("source_fetched_at", cutoff.toISOString())
    .select("id");

  return (data?.length ?? 0) + (expiredByAge?.length ?? 0);
}

export async function fetchPedagogicalUsageStats(windowHours = 24): Promise<{
  cacheHits: number;
  cacheMisses: number;
  hitRate: number | null;
  tokensSaved: number;
  aiTokensSpent: number;
  topMissThemes: Array<{ tema: string; count: number }>;
}> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const [{ data, error }, { data: missEvents, error: missError }] = await Promise.all([
    supabase
      .from("pedagogical_cache_usage")
      .select("usage_type, tokens_saved_estimate, ai_tokens_spent")
      .gte("created_at", since)
      .in("usage_type", ["snippet", "generation_inject", "scrape_miss"]),
    supabase
      .from("operational_events")
      .select("metadata")
      .eq("event_type", "pedagogical_cache_miss")
      .gte("created_at", since),
  ]);

  if (error) throw new Error(error.message);
  if (missError) throw new Error(missError.message);

  const rows = data || [];
  const hits = rows.filter((row) =>
    row.usage_type === "snippet" || row.usage_type === "generation_inject",
  );
  const misses = rows.filter((row) => row.usage_type === "scrape_miss");

  const temaCounts = new Map<string, number>();
  for (const event of missEvents || []) {
    const metadata = (event.metadata || {}) as Record<string, unknown>;
    const tema = String(metadata.tema || "").trim();
    if (!tema) continue;
    temaCounts.set(tema, (temaCounts.get(tema) || 0) + 1);
  }

  const topMissThemes = [...temaCounts.entries()]
    .map(([tema, count]) => ({ tema, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cacheHits = hits.length;
  const cacheMisses = Math.max(misses.length, topMissThemes.reduce((sum, item) => sum + item.count, 0));
  const denominator = cacheHits + cacheMisses;

  return {
    cacheHits,
    cacheMisses,
    hitRate: denominator > 0 ? Math.round((cacheHits / denominator) * 100) : null,
    tokensSaved: hits.reduce((sum, r) => sum + (r.tokens_saved_estimate ?? 0), 0),
    aiTokensSpent: rows.reduce((sum, r) => sum + (r.ai_tokens_spent ?? 0), 0),
    topMissThemes,
  };
}

export async function listStaleEntriesForRefresh(
  limit = 10,
): Promise<PedagogicalCacheEntry[]> {
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: staleRows, error: staleError } = await supabase
    .from("pedagogical_cache_entries")
    .select("*")
    .eq("review_status", "stale")
    .order("source_fetched_at", { ascending: true })
    .limit(limit);

  if (staleError) throw new Error(staleError.message);

  const remaining = Math.max(0, limit - (staleRows?.length ?? 0));
  let expiredRows: Tables<"pedagogical_cache_entries">[] = [];

  if (remaining > 0) {
    const { data, error } = await supabase
      .from("pedagogical_cache_entries")
      .select("*")
      .eq("review_status", "approved")
      .not("expires_at", "is", null)
      .lt("expires_at", nowIso)
      .order("expires_at", { ascending: true })
      .limit(remaining);

    if (error) throw new Error(error.message);
    expiredRows = (data || []) as Tables<"pedagogical_cache_entries">[];
  }

  const rows = [...(staleRows || []), ...expiredRows] as Tables<"pedagogical_cache_entries">[];
  const sources = await getActiveSources();
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return rows.map((row) => ({
    ...row,
    source_slug: sourceById.get(row.source_id)?.slug,
    source_priority: sourceById.get(row.source_id)?.priority,
  }));
}

export async function listTopMissThemes(
  windowDays = 7,
  limit = 10,
): Promise<Array<{ tema: string; count: number; componente?: string; etapa?: string }>> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("operational_events")
    .select("metadata")
    .eq("event_type", "pedagogical_cache_miss")
    .gte("created_at", since);

  if (error) throw new Error(error.message);

  const counts = new Map<string, { count: number; componente?: string; etapa?: string }>();

  for (const row of data || []) {
    const metadata = (row.metadata || {}) as Record<string, unknown>;
    const tema = String(metadata.tema || "").trim();
    if (!tema) continue;

    const current = counts.get(tema) || {
      count: 0,
      componente: metadata.componente ? String(metadata.componente) : undefined,
      etapa: metadata.etapa ? String(metadata.etapa) : undefined,
    };
    current.count += 1;
    counts.set(tema, current);
  }

  return [...counts.entries()]
    .map(([tema, meta]) => ({
      tema,
      count: meta.count,
      componente: meta.componente,
      etapa: meta.etapa,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function entryToScrapeQuery(entry: PedagogicalCacheEntry): PedagogicalScrapeQuery {
  const metadata =
    entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
      ? (entry.metadata as Record<string, unknown>)
      : {};

  return {
    tema: String(metadata.tema || entry.title || "").trim(),
    componente: entry.componente || undefined,
    etapa: entry.etapa || undefined,
    anoSerie: entry.ano_serie || undefined,
    bnccCodigos: entry.bncc_codigos?.length ? entry.bncc_codigos : undefined,
  };
}

export function estimateTokensSaved(entryCount: number): number {
  return entryCount * TOKENS_SAVED_PER_HIT;
}
