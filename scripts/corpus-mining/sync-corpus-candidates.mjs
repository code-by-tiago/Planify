#!/usr/bin/env node
/**
 * Garimpo interno: sincroniza generated_materials de alta qualidade em corpus_candidates.
 *
 * PRIVACIDADE: não persiste IP, PII de alunos nem HTML bruto — apenas previews sanitizados.
 *
 * Uso:
 *   npm run sync:corpus-candidates
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --min-quality=75 --promote-quality=90
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --dry-run --limit=100
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --feed-question-bank
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
        } catch {
          // try next
        }
      }
    }
    return require(specifier);
  };

  const evaluator = new Function("exports", "require", "module", transpiled);
  evaluator(module.exports, localRequire, module);
  return module.exports;
}

function parseArgs(argv) {
  const args = {
    minQuality: 75,
    promoteQuality: 90,
    limit: 0,
    dryRun: false,
    feedQuestionBank: false,
  };

  for (const raw of argv) {
    if (raw === "--dry-run") args.dryRun = true;
    else if (raw === "--feed-question-bank") args.feedQuestionBank = true;
    else if (raw.startsWith("--min-quality=")) {
      args.minQuality = Number(raw.split("=")[1]) || 75;
    } else if (raw.startsWith("--promote-quality=")) {
      args.promoteQuality = Number(raw.split("=")[1]) || 90;
    } else if (raw.startsWith("--limit=")) {
      args.limit = Number(raw.split("=")[1]) || 0;
    }
  }

  return args;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTema(row) {
  const payload = row.request_payload;
  if (payload && typeof payload === "object") {
    const tema = payload.tema || payload.titulo || payload.assunto;
    if (tema) return String(tema).trim();
  }
  return String(row.title || "").trim();
}

function sanitizeSummary(row) {
  const preview = stripHtml(row.content_preview || "");
  if (preview.length >= 40) return preview.slice(0, 2000);
  const jsonText = stripHtml(JSON.stringify(row.response_json || {}).slice(0, 4000));
  return jsonText.slice(0, 2000);
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { computeContentHash, computeTopicSignature } = loadTsModule(
  "src/lib/pedagogical-cache/topic-signature.ts",
);

async function loadExistingHashes() {
  const hashes = new Set();
  let offset = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await supabase
      .from("corpus_candidates")
      .select("content_hash")
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const row of data) {
      if (row.content_hash) hashes.add(row.content_hash);
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return hashes;
}

async function loadCorpusSourceId() {
  const { data, error } = await supabase
    .from("pedagogical_sources")
    .select("id")
    .eq("slug", "planify-corpus")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function promoteToPedagogicalCache(row, sourceId) {
  const topicSignature = computeTopicSignature({
    tema: row.tema,
    componente: row.discipline || "",
    bnccCodigo: row.bncc_codigos?.[0] || "",
  });
  const contentHash = row.content_hash;
  const bodyMarkdown = row.content_summary;

  const { data: existing } = await supabase
    .from("pedagogical_cache_entries")
    .select("id")
    .eq("topic_signature", topicSignature)
    .eq("source_id", sourceId)
    .maybeSingle();

  const payload = {
    topic_signature: topicSignature,
    content_hash: contentHash,
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
    review_status: "pending",
    metadata: {
      corpus_candidate_id: row.id,
      source_material_id: row.source_id,
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stats = {
    scanned: 0,
    inserted: 0,
    skippedDuplicate: 0,
    skippedLowQuality: 0,
    promoted: 0,
    errors: 0,
  };

  console.log("=== Planify · sync corpus_candidates ===");
  console.log(`min-quality=${args.minQuality} promote-quality=${args.promoteQuality} dry-run=${args.dryRun}`);

  const existingHashes = await loadExistingHashes();
  const corpusSourceId = await loadCorpusSourceId();
  const pageSize = 200;
  let offset = 0;
  let processed = 0;

  while (true) {
    let query = supabase
      .from("generated_materials")
      .select(
        "id, tipo, title, discipline, surface, quality_score, status, bncc_skill_codes, content_preview, request_payload, response_json, created_at",
      )
      .eq("status", "completed")
      .gte("quality_score", args.minQuality)
      .order("quality_score", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const material of data) {
      if (args.limit > 0 && processed >= args.limit) break;

      stats.scanned += 1;
      processed += 1;

      const score = Number(material.quality_score);
      if (!Number.isFinite(score) || score < args.minQuality) {
        stats.skippedLowQuality += 1;
        continue;
      }

      const tema = extractTema(material);
      const summary = sanitizeSummary(material);
      if (!tema || summary.length < 40) {
        stats.skippedLowQuality += 1;
        continue;
      }

      const contentHash = computeContentHash(summary, tema);
      if (existingHashes.has(contentHash)) {
        stats.skippedDuplicate += 1;
        continue;
      }

      const row = {
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
        review_status: "pending",
        metadata: {
          pipeline: "corpus-mining-v1",
        },
      };

      if (!args.dryRun) {
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
          console.error(`insert error ${material.id}:`, insertError.message);
          stats.errors += 1;
          continue;
        }

        existingHashes.add(contentHash);
        stats.inserted += 1;

        if (score >= args.promoteQuality && corpusSourceId) {
          try {
            await promoteToPedagogicalCache(inserted, corpusSourceId);
            stats.promoted += 1;
          } catch (promoteErr) {
            console.error(`promote error ${material.id}:`, promoteErr.message);
            stats.errors += 1;
          }
        }
      } else {
        existingHashes.add(contentHash);
        stats.inserted += 1;
        if (score >= args.promoteQuality) stats.promoted += 1;
      }
    }

    if (args.limit > 0 && processed >= args.limit) break;
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(JSON.stringify(stats, null, 2));

  if (args.feedQuestionBank && !args.dryRun) {
    console.log("Disparando ingestão question_bank (planify-materials, min-quality)...");
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(
      process.execPath,
      [
        "scripts/ingest-question-bank-web.mjs",
        `--sources=planify-materials`,
        `--min-quality=${args.minQuality}`,
        "--max=200",
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
