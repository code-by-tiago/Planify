#!/usr/bin/env node
/**
 * Remove ingestão de baixa qualidade e questões sem contexto autossuficiente.
 * Run: node scripts/cleanup-question-bank-bad-ingest.mjs
 * Dry-run: node scripts/cleanup-question-bank-bad-ingest.mjs --dry-run
 */
import {
  createSupabaseAdmin,
  loadEnvLocal,
  loadTsModule,
} from "./lib/question-bank-ingest/shared.mjs";

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");
const { isQuestionSelfContained } = loadTsModule(
  "src/lib/banco-questoes/question-bank-self-contained.ts",
);

const BAD_SOURCE_TYPES = [
  "ingest:stackexchange",
  "ingest:wikiversity-pt",
];

async function main() {
  const supabase = createSupabaseAdmin();

  const { data: allRows, error: listErr } = await supabase
    .from("question_bank_items")
    .select("id, enunciado, source_type, author_display_name")
    .eq("visibility", "community")
    .eq("is_published", true);

  if (listErr) throw new Error(listErr.message);

  const orphanIds = [];
  for (const row of allRows || []) {
    const check = isQuestionSelfContained(row.enunciado || "");
    if (!check.ok) orphanIds.push(row.id);
  }

  const badSourceIds = (allRows || [])
    .filter(
      (row) =>
        BAD_SOURCE_TYPES.includes(row.source_type || "") ||
        /stack exchange/i.test(row.author_display_name || ""),
    )
    .map((row) => row.id);

  const toDelete = [...new Set([...orphanIds, ...badSourceIds])];

  console.log(`Comunidade publicada: ${allRows?.length ?? 0}`);
  console.log(`Sem contexto / órfãs: ${orphanIds.length}`);
  console.log(`Fontes externas ruins: ${badSourceIds.length}`);
  console.log(`Total a remover: ${toDelete.length}`);

  if (dryRun) {
    console.log("DRY-RUN — nada removido.");
    return;
  }

  if (toDelete.length) {
    const chunkSize = 100;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("question_bank_items")
        .delete()
        .in("id", chunk);
      if (error) throw new Error(error.message);
    }
  }

  const { count: remaining } = await supabase
    .from("question_bank_items")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "community")
    .eq("is_published", true);

  console.log(`Comunidade publicada restante: ${remaining ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
