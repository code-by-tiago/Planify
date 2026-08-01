#!/usr/bin/env node
/**
 * Separa texto de leitura embutido no enunciado → coluna texto_apoio.
 * Recalcula content_hash (enunciado + tipo) e remove duplicatas.
 *
 * Run: node scripts/cleanup-question-bank-texto-apoio.mjs
 * Dry-run: node scripts/cleanup-question-bank-texto-apoio.mjs --dry-run
 */
import {
  createSupabaseAdmin,
  loadEnvLocal,
  loadTsModule,
} from "./lib/question-bank-ingest/shared.mjs";

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");

const { splitEmbeddedReadingText } = loadTsModule(
  "src/lib/banco-questoes/question-bank-self-contained.ts",
);
const { computeQuestionContentHash } = loadTsModule(
  "src/lib/banco-questoes/question-bank-hash.ts",
);

const READING_PREFIX = /^texto (?:para )?leitura\s*:/i;

async function fetchAllRows(supabase) {
  const rows = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("question_bank_items")
      .select("id, user_id, enunciado, tipo, texto_apoio, content_hash, created_at")
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function main() {
  const supabase = createSupabaseAdmin();
  const rows = await fetchAllRows(supabase);

  let fixed = 0;
  let unchanged = 0;
  let deduped = 0;
  const updates = [];

  for (const row of rows) {
    let enunciado = String(row.enunciado || "").trim();
    let textoApoio = String(row.texto_apoio || "").trim();

    if (!textoApoio && READING_PREFIX.test(enunciado)) {
      const split = splitEmbeddedReadingText(enunciado);
      enunciado = split.enunciado;
      textoApoio = split.textoApoio || "";
    }

    const newHash = computeQuestionContentHash(enunciado, row.tipo || "discursiva");
    const changed =
      enunciado !== row.enunciado ||
      (textoApoio || null) !== (row.texto_apoio || null) ||
      newHash !== row.content_hash;

    if (!changed) {
      unchanged += 1;
      continue;
    }

    updates.push({
      id: row.id,
      user_id: row.user_id,
      enunciado,
      texto_apoio: textoApoio || null,
      content_hash: newHash,
      created_at: row.created_at,
    });
    fixed += 1;
  }

  console.log(`Total: ${rows.length}`);
  console.log(`A corrigir: ${fixed}`);
  console.log(`Sem alteração: ${unchanged}`);

  if (dryRun) {
    const sample = updates.slice(0, 3);
    if (sample.length) {
      console.log("\nAmostra:");
      for (const item of sample) {
        console.log(`- ${item.id}: enunciado ${item.enunciado.slice(0, 72)}…`);
      }
    }
    console.log("\nDRY-RUN — nada alterado.");
    return;
  }

  const keepByHash = new Map();
  const deleteIds = [];

  for (const item of updates) {
    const key = `${item.user_id}|${item.content_hash}`;
    const existing = keepByHash.get(key);
    if (existing) {
      deleteIds.push(item.id);
      deduped += 1;
      continue;
    }
    keepByHash.set(key, item.id);

    const { error } = await supabase
      .from("question_bank_items")
      .update({
        enunciado: item.enunciado,
        texto_apoio: item.texto_apoio,
        content_hash: item.content_hash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) throw new Error(`update ${item.id}: ${error.message}`);
  }

  for (const row of rows) {
    if (updates.some((u) => u.id === row.id)) continue;
    const key = `${row.user_id}|${row.content_hash}`;
    if (keepByHash.has(key) && keepByHash.get(key) !== row.id) {
      deleteIds.push(row.id);
      deduped += 1;
    } else if (!keepByHash.has(key)) {
      keepByHash.set(key, row.id);
    }
  }

  if (deleteIds.length) {
    const uniqueDeletes = [...new Set(deleteIds)];
    const chunkSize = 100;
    for (let i = 0; i < uniqueDeletes.length; i += chunkSize) {
      const chunk = uniqueDeletes.slice(i, i + chunkSize);
      const { error } = await supabase.from("question_bank_items").delete().in("id", chunk);
      if (error) throw new Error(error.message);
    }
  }

  console.log(`Corrigidos: ${fixed}`);
  console.log(`Duplicatas removidas: ${deduped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
