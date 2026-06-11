#!/usr/bin/env node
/**
 * Ingestão em massa do banco de questões Planify — fontes permitidas (OER / APIs abertas / dados internos).
 *
 * Fontes:
 *  - planify-materials   — generated_materials (dados próprios)
 *  - planify-biblioteca  — pacotes curados Planify
 *  - stackexchange       — API oficial CC BY-SA (matemática, física, química, biologia)
 *  - wikiversity-pt      — MediaWiki API CC BY-SA (pt.wikiversity.org)
 *
 * NÃO inclui scraping de bancos comerciais (QConcursos, Teachy, etc.).
 *
 * Uso:
 *   node scripts/ingest-question-bank-web.mjs --hours=2
 *   node scripts/ingest-question-bank-web.mjs --max=500 --sources=planify-materials,planify-biblioteca
 *   node scripts/ingest-question-bank-web.mjs --dry-run --max=50
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Opcional: PLANIFY_OWNER_USER_ID, STACKEXCHANGE_KEY (maior cota na API)
 */
import {
  createIngestStats,
  createSupabaseAdmin,
  loadEnvLocal,
  loadTsModule,
  parseArgs,
  persistQuestion,
  resolveCuratorUserId,
  shouldStop,
  sleep,
  writeReport,
  INGEST_ROOT,
} from "./lib/question-bank-ingest/shared.mjs";
import { SOURCE_ID as BIB_ID, iteratePlanifyBiblioteca } from "./lib/question-bank-ingest/sources/planify-biblioteca.mjs";
import { SOURCE_ID as MAT_ID, iteratePlanifyMaterials } from "./lib/question-bank-ingest/sources/planify-materials.mjs";
import { SOURCE_ID as SE_ID, iterateStackExchange } from "./lib/question-bank-ingest/sources/stackexchange.mjs";
import { SOURCE_ID as WIKI_ID, iterateWikiversityPt } from "./lib/question-bank-ingest/sources/wikiversity-pt.mjs";

loadEnvLocal();

const { computeQuestionContentHash } = loadTsModule("src/lib/banco-questoes/question-bank-hash.ts");

const ALL_SOURCES = {
  [MAT_ID]: iteratePlanifyMaterials,
  [BIB_ID]: iteratePlanifyBiblioteca,
  [SE_ID]: iterateStackExchange,
  [WIKI_ID]: iterateWikiversityPt,
};

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const deadlineMs = Date.now() + args.hours * 60 * 60 * 1000;

  const selected =
    args.sources === "all"
      ? Object.keys(ALL_SOURCES)
      : args.sources.split(",").map((s) => s.trim()).filter(Boolean);

  for (const id of selected) {
    if (!ALL_SOURCES[id]) {
      throw new Error(`Fonte desconhecida: ${id}. Disponíveis: ${Object.keys(ALL_SOURCES).join(", ")}`);
    }
  }

  log("=== Planify · Ingestão banco de questões ===");
  log(`Modo: ${args.dryRun ? "DRY-RUN" : "PRODUÇÃO"}`);
  log(`Prazo: ${args.hours}h | max inserções: ${args.max || "ilimitado"}`);
  log(`Fontes: ${selected.join(", ")}`);

  const supabase = createSupabaseAdmin();
  const userId = await resolveCuratorUserId(supabase);
  log(`Curador user_id: ${userId}`);

  const stats = createIngestStats();
  const startedAt = new Date().toISOString();

  const ctx = {
    supabase,
    stats,
    sleep,
    log,
    shouldAbort: () => Boolean(shouldStop(deadlineMs, stats, args.max)),
  };

  for (const sourceId of selected) {
    if (ctx.shouldAbort()) break;

    log(`--- Fonte: ${sourceId} ---`);
    const iterator = ALL_SOURCES[sourceId](ctx);

    for await (const candidate of iterator) {
      if (ctx.shouldAbort()) break;

      const result = await persistQuestion(supabase, userId, candidate, {
        dryRun: args.dryRun,
        hashFn: computeQuestionContentHash,
      });

      if (result.status === "duplicate") {
        stats.duplicates += 1;
        if (stats.bySource[sourceId]) stats.bySource[sourceId].duplicates += 1;
      } else if (result.status === "inserted" || result.status === "dry_run") {
        stats.inserted += 1;
        if (stats.bySource[sourceId]) stats.bySource[sourceId].inserted += 1;
        if (stats.inserted % 25 === 0) {
          log(`Progresso: ${stats.inserted} inseridas | ${stats.duplicates} duplicatas | ${stats.rejected} rejeitadas`);
        }
      } else if (result.status === "error") {
        stats.errors += 1;
        log(`Erro ao persistir (${sourceId}): ${result.message}`);
      }
    }
  }

  const finishedAt = new Date().toISOString();
  const report = {
    startedAt,
    finishedAt,
    durationMinutes: Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 60000),
    args,
    stats,
    ingestRoot: INGEST_ROOT,
  };

  writeReport(args.reportPath, report);

  log("=== Concluído ===");
  log(`Inseridas: ${stats.inserted} | Duplicatas: ${stats.duplicates} | Rejeitadas: ${stats.rejected} | Erros: ${stats.errors}`);
  log(`Relatório: ${args.reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
