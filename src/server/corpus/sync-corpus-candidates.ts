import {
  computeContentHash,
  computeTopicSignature,
} from "@/lib/pedagogical-cache/topic-signature";
import type { Tables, TablesInsert } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

/** Materiais abaixo deste score não entram no garimpo. */
export const CORPUS_SYNC_MIN_QUALITY = 75;

/** Score >= threshold: aprovação automática + promoção ao cache pedagógico. */
export const CORPUS_AUTO_APPROVE_THRESHOLD = 90;

const CORPUS_SOURCE_SLUG = "planify-corpus";
const PAGE_SIZE = 200;
const SUMMARY_MIN_LENGTH = 40;
const SUMMARY_MAX_LENGTH = 2000;

/**
 * PRIVACIDADE: o garimpo persiste apenas previews sanitizados derivados de conteúdo
 * gerado por professores (termos de uso), sem IP, PII de alunos nem HTML bruto.
 * Auto-aprovação (score >= 90) aplica-se só a resumos já sanitizados neste pipeline.
 */

export type SyncCorpusCandidatesOptions = {
  minQuality?: number;
  autoApproveThreshold?: number;
  limit?: number;
  dryRun?: boolean;
};

export type SyncCorpusCandidatesStats = {
  scanned: number;
  inserted: number;
  autoApproved: number;
  skippedDuplicate: number;
  skippedLowQuality: number;
  promoted: number;
  errors: number;
};

type GeneratedMaterialRow = Pick<
  Tables<"generated_materials">,
  | "id"
  | "tipo"
  | "title"
  | "discipline"
  | "surface"
  | "quality_score"
  | "status"
  | "bncc_skill_codes"
  | "content_preview"
  | "request_payload"
  | "response_json"
  | "created_at"
>;

type CorpusCandidateRow = Tables<"corpus_candidates">;

function stripHtml(value: string): string {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTema(row: GeneratedMaterialRow): string {
  const payload = row.request_payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const tema = record.tema || record.titulo || record.assunto;
    if (tema) return String(tema).trim();
  }
  return String(row.title || "").trim();
}

function sanitizeMaterialSummary(row: GeneratedMaterialRow): string {
  const preview = stripHtml(row.content_preview || "");
  if (preview.length >= SUMMARY_MIN_LENGTH) {
    return preview.slice(0, SUMMARY_MAX_LENGTH);
  }
  const jsonText = stripHtml(
    JSON.stringify(row.response_json || {}).slice(0, 4000),
  );
  return jsonText.slice(0, SUMMARY_MAX_LENGTH);
}

async function loadExistingHashes(): Promise<Set<string>> {
  const supabase = getSupabaseAdminClient();
  const hashes = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("corpus_candidates")
      .select("content_hash")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const row of data) {
      if (row.content_hash) hashes.add(row.content_hash);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return hashes;
}

async function loadCorpusSourceId(): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedagogical_sources")
    .select("id")
    .eq("slug", CORPUS_SOURCE_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function promoteToPedagogicalCache(
  row: CorpusCandidateRow,
  sourceId: string,
): Promise<"created" | "updated"> {
  const supabase = getSupabaseAdminClient();
  const topicSignature = computeTopicSignature({
    tema: row.tema,
    componente: row.discipline || "",
    bnccCodigo: row.bncc_codigos?.[0] || "",
  });
  const bodyMarkdown = row.content_summary;

  const { data: existing } = await supabase
    .from("pedagogical_cache_entries")
    .select("id")
    .eq("topic_signature", topicSignature)
    .eq("source_id", sourceId)
    .maybeSingle();

  const payload: TablesInsert<"pedagogical_cache_entries"> = {
    topic_signature: topicSignature,
    content_hash: row.content_hash,
    title: row.tema,
    summary: bodyMarkdown.slice(0, 500),
    body_markdown: bodyMarkdown,
    content_type: "context",
    componente: row.discipline,
    bncc_codigos: row.bncc_codigos || [],
    tags: [row.tipo, row.surface].filter(Boolean),
    source_id: sourceId,
    source_title: "Planify — garimpo interno",
    source_license: "Planify — uso interno pedagógico",
    review_status: "approved",
    metadata: {
      corpus_candidate_id: row.id,
      source_material_id: row.source_id,
      auto_approved: true,
    },
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("pedagogical_cache_entries")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return "updated";
  }

  const { error } = await supabase.from("pedagogical_cache_entries").insert(payload);
  if (error) throw new Error(error.message);
  return "created";
}

export async function syncCorpusCandidates(
  options: SyncCorpusCandidatesOptions = {},
): Promise<SyncCorpusCandidatesStats> {
  const minQuality = options.minQuality ?? CORPUS_SYNC_MIN_QUALITY;
  const autoApproveThreshold =
    options.autoApproveThreshold ?? CORPUS_AUTO_APPROVE_THRESHOLD;
  const limit = Math.max(0, options.limit ?? 0);
  const dryRun = options.dryRun ?? false;

  const stats: SyncCorpusCandidatesStats = {
    scanned: 0,
    inserted: 0,
    autoApproved: 0,
    skippedDuplicate: 0,
    skippedLowQuality: 0,
    promoted: 0,
    errors: 0,
  };

  const supabase = getSupabaseAdminClient();
  const existingHashes = await loadExistingHashes();
  const corpusSourceId = await loadCorpusSourceId();
  let offset = 0;
  let processed = 0;

  while (true) {
    const { data, error } = await supabase
      .from("generated_materials")
      .select(
        "id, tipo, title, discipline, surface, quality_score, status, bncc_skill_codes, content_preview, request_payload, response_json, created_at",
      )
      .eq("status", "completed")
      .gte("quality_score", minQuality)
      .order("quality_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const material of data as GeneratedMaterialRow[]) {
      if (limit > 0 && processed >= limit) break;

      stats.scanned += 1;
      processed += 1;

      const score = Number(material.quality_score);
      if (!Number.isFinite(score) || score < minQuality) {
        stats.skippedLowQuality += 1;
        continue;
      }

      const tema = extractTema(material);
      const summary = sanitizeMaterialSummary(material);
      if (!tema || summary.length < SUMMARY_MIN_LENGTH) {
        stats.skippedLowQuality += 1;
        continue;
      }

      const contentHash = computeContentHash(summary, tema);
      if (existingHashes.has(contentHash)) {
        stats.skippedDuplicate += 1;
        continue;
      }

      const autoApproved = score >= autoApproveThreshold;
      const row: TablesInsert<"corpus_candidates"> = {
        source_table: "generated_materials",
        source_id: material.id,
        surface: material.surface || "material",
        tipo: material.tipo || "",
        bncc_codigos: material.bncc_skill_codes || [],
        quality_score: score,
        tema,
        discipline: material.discipline || null,
        topic_signature: computeTopicSignature({
          tema,
          componente: material.discipline || "",
          bnccCodigo: material.bncc_skill_codes?.[0] || "",
        }),
        content_summary: summary,
        content_hash: contentHash,
        review_status: autoApproved ? "approved" : "pending",
        metadata: {
          pipeline: "corpus-mining-v1",
          auto_approved: autoApproved,
        },
      };

      if (!dryRun) {
        const { data: inserted, error: insertError } = await supabase
          .from("corpus_candidates")
          .insert(row)
          .select("*")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            stats.skippedDuplicate += 1;
            existingHashes.add(contentHash);
            continue;
          }
          stats.errors += 1;
          continue;
        }

        existingHashes.add(contentHash);
        stats.inserted += 1;
        if (autoApproved) stats.autoApproved += 1;

        if (autoApproved && corpusSourceId) {
          try {
            await promoteToPedagogicalCache(inserted as CorpusCandidateRow, corpusSourceId);
            stats.promoted += 1;
          } catch {
            stats.errors += 1;
          }
        }
      } else {
        existingHashes.add(contentHash);
        stats.inserted += 1;
        if (autoApproved) {
          stats.autoApproved += 1;
          stats.promoted += 1;
        }
      }
    }

    if (limit > 0 && processed >= limit) break;
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return stats;
}
