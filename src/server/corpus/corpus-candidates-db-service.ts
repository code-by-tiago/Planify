import "server-only";

import {
  computeContentHash,
  computeTopicSignature,
} from "@/lib/pedagogical-cache/topic-signature";
import type { Tables } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { PedagogicalScrapeQuery } from "../pedagogical-cache/adapters/pedagogical-source-adapter";
import type { PedagogicalCacheEntry } from "../pedagogical-cache/pedagogical-cache-db-service";
import { getSourceBySlug } from "../pedagogical-cache/pedagogical-cache-db-service";

export type CorpusCandidate = Tables<"corpus_candidates">;

const CORPUS_SOURCE_SLUG = "planify-corpus";
const SUMMARY_MAX = 2000;

/** Remove HTML e limita tamanho — sem PII explícita no garimpo. */
export function sanitizeCorpusSummary(value: string): string {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUMMARY_MAX);
}

export function buildCorpusContentHash(tema: string, summary: string): string {
  return computeContentHash(summary, tema);
}

export function buildCorpusTopicSignature(input: {
  tema: string;
  discipline?: string | null;
  bnccCodigo?: string | null;
}): string {
  return computeTopicSignature({
    tema: input.tema,
    componente: input.discipline || "",
    bnccCodigo: input.bnccCodigo || "",
  });
}

function corpusToPedagogicalEntry(
  row: CorpusCandidate,
  sourceId: string,
): PedagogicalCacheEntry {
  return {
    id: row.id,
    topic_signature: row.topic_signature,
    content_hash: row.content_hash,
    title: row.tema,
    summary: row.content_summary,
    body_markdown: row.content_summary,
    content_type: "context",
    componente: row.discipline,
    ano_serie: null,
    etapa: null,
    bncc_codigos: row.bncc_codigos,
    tags: [row.tipo, row.surface].filter(Boolean),
    source_id: sourceId,
    source_url: null,
    source_title: "Planify — garimpo interno",
    source_license: "Planify — uso interno pedagógico",
    source_fetched_at: row.created_at,
    review_status: "approved",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    format_applied: false,
    ai_tokens_used: 0,
    hit_count: 0,
    last_hit_at: null,
    expires_at: null,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.created_at,
    source_slug: CORPUS_SOURCE_SLUG,
    source_priority: 30,
  };
}

/**
 * Busca candidatos aprovados do garimpo interno (sem pgvector — assinatura BNCC/tema).
 * PRIVACIDADE: apenas entradas já revisadas; sem HTML bruto nem dados de alunos.
 */
export async function findApprovedCorpusCandidates(
  query: PedagogicalScrapeQuery,
): Promise<PedagogicalCacheEntry[]> {
  const supabase = getSupabaseAdminClient();
  const source = await getSourceBySlug(CORPUS_SOURCE_SLUG);
  if (!source) return [];

  const topicSignature = computeTopicSignature({
    tema: query.tema,
    componente: query.componente,
    etapa: query.etapa,
    bnccCodigo: query.bnccCodigos?.[0],
  });

  let dbQuery = supabase
    .from("corpus_candidates")
    .select("*")
    .eq("review_status", "approved")
    .eq("topic_signature", topicSignature);

  const bnccOnlyLookup = Boolean(query.bnccCodigos?.length) && !query.tema?.trim();
  if (bnccOnlyLookup) {
    dbQuery = dbQuery.overlaps("bncc_codigos", query.bnccCodigos!);
  }

  const { data, error } = await dbQuery
    .order("quality_score", { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) throw new Error(error.message);

  const rows = (data || []) as CorpusCandidate[];
  const seen = new Set<string>();

  return rows
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return Boolean(row.content_summary?.trim());
    })
    .map((row) => corpusToPedagogicalEntry(row, source.id));
}

export type CorpusCandidateStats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export async function fetchCorpusCandidateStats(): Promise<CorpusCandidateStats> {
  const supabase = getSupabaseAdminClient();
  const statuses = ["pending", "approved", "rejected"] as const;
  const counts: Record<string, number> = {};

  await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("corpus_candidates")
        .select("id", { count: "exact", head: true })
        .eq("review_status", status);

      if (error) throw new Error(error.message);
      counts[status] = count ?? 0;
    }),
  );

  const pending = counts.pending ?? 0;
  const approved = counts.approved ?? 0;
  const rejected = counts.rejected ?? 0;

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
  };
}

export type CorpusReviewStatus = "pending" | "approved" | "rejected";

export type CorpusCandidateListFilters = {
  status?: CorpusReviewStatus | "all";
  q?: string;
  page?: number;
  limit?: number;
};

export type CorpusCandidateListResult = {
  items: CorpusCandidate[];
  total: number;
  page: number;
  limit: number;
};

export async function listCorpusCandidates(
  filters: CorpusCandidateListFilters = {},
): Promise<CorpusCandidateListResult> {
  const supabase = getSupabaseAdminClient();
  const status = filters.status ?? "pending";
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
  const offset = (page - 1) * limit;

  let query = supabase.from("corpus_candidates").select("*", { count: "exact" });

  if (status !== "all") {
    query = query.eq("review_status", status);
  }

  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    query = query.or(
      `tema.ilike.${pattern},discipline.ilike.${pattern},surface.ilike.${pattern},tipo.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query
    .order("quality_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    items: (data || []) as CorpusCandidate[],
    total: count ?? 0,
    page,
    limit,
  };
}

export async function updateCorpusCandidateReview(
  id: string,
  reviewStatus: Exclude<CorpusReviewStatus, "pending">,
): Promise<CorpusCandidate> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("corpus_candidates")
    .update({ review_status: reviewStatus })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as CorpusCandidate;
}

export async function bulkUpdateCorpusCandidateReview(
  ids: string[],
  reviewStatus: Exclude<CorpusReviewStatus, "pending">,
): Promise<number> {
  if (ids.length === 0) return 0;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("corpus_candidates")
    .update({ review_status: reviewStatus })
    .in("id", ids)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
