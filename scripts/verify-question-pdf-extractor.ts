import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PNG } from "pngjs";
import { extractEntranceExamPdf } from "../src/server/banco-questoes/entrance-exam-pdf-extractor";
import type { Database } from "../src/types/database";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const ROOT = process.cwd();
const DEFAULT_BUCKET = "question-extract-assets";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function makeTinyPng(): Buffer {
  const png = new PNG({ width: 1, height: 1 });
  png.data[0] = 0;
  png.data[1] = 200;
  png.data[2] = 255;
  png.data[3] = 255;
  return PNG.sync.write(png);
}

async function verifyLocalExtractor() {
  const pdfPath =
    getArgValue("--pdf") ||
    path.join(ROOT, "data", "teachy-ai-challenge", "entrance-exams", "obf.pdf");
  assert.ok(existsSync(pdfPath), `PDF de teste nao encontrado: ${pdfPath}`);

  const outputDir = path.join(os.tmpdir(), `planify-pdf-extractor-${Date.now()}`);
  await mkdir(outputDir, { recursive: true });

  const result = await extractEntranceExamPdf({
    pdfBuffer: await readFile(pdfPath),
    fileName: path.basename(pdfPath),
    config: {
      columns: "auto",
      maxPages: Number(getArgValue("--max-pages") || "2"),
      etapa: "ENEM e Vestibulares",
    },
    assetBaseDir: path.join(outputDir, "assets"),
    assetPublicPath: "./assets",
  });

  assert.ok(result.questions.length >= 1, "Nenhuma questao foi extraida do PDF de teste.");
  assert.ok(
    result.questions.some((question) => question.alternatives.length >= 4),
    "Nenhuma questao de multipla escolha com alternativas foi extraida.",
  );
  assert.equal(
    result.items.length,
    result.questions.length,
    "Quantidade de itens do banco diferente da quantidade de questoes.",
  );
  assert.ok(
    result.report.textLineCount > 0,
    "O PDF de teste nao gerou linhas de texto.",
  );

  await writeFile(
    path.join(outputDir, "result.json"),
    JSON.stringify(
      {
        questions: result.questions,
        report: result.report,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(
    `OK extractor local: ${result.questions.length} questao(oes), ${result.report.textLineCount} linhas.`,
  );
  console.log(`Amostra: ${outputDir}`);
}

async function verifySupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.QUESTION_EXTRACT_STORAGE_BUCKET || DEFAULT_BUCKET;

  assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL nao configurada.");
  assert.ok(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY nao configurada.");

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const columnProbe = await supabase
    .from("question_bank_items")
    .select("id,image_urls")
    .limit(1);
  assert.equal(
    columnProbe.error,
    null,
    `Coluna image_urls indisponivel: ${columnProbe.error?.message || ""}`,
  );

  const storagePath = `verify/${Date.now()}-tiny.png`;
  const upload = await supabase.storage
    .from(bucketName)
    .upload(storagePath, makeTinyPng(), {
      contentType: "image/png",
      upsert: true,
    });
  assert.equal(
    upload.error,
    null,
    `Bucket ${bucketName} indisponivel para upload: ${upload.error?.message || ""}`,
  );

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  assert.ok(data.publicUrl, "Nao foi possivel gerar URL publica do bucket.");

  await supabase.storage.from(bucketName).remove([storagePath]);
  console.log(`OK Supabase: coluna image_urls e bucket ${bucketName} acessiveis.`);
}

async function main() {
  await verifyLocalExtractor();
  if (hasFlag("--supabase")) {
    await verifySupabase();
  } else {
    console.log("Supabase nao verificado. Use -- --supabase para validar banco e bucket.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
