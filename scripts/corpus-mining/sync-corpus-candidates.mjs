#!/usr/bin/env node
/**
 * Garimpo interno: sincroniza generated_materials de alta qualidade em corpus_candidates.
 *
 * PRIVACIDADE: não persiste IP, PII de alunos nem HTML bruto — apenas previews sanitizados.
 *
 * Uso:
 *   npm run sync:corpus-candidates
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --min-quality=75 --auto-approve=90
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --dry-run --limit=100
 *   node scripts/corpus-mining/sync-corpus-candidates.mjs --feed-question-bank
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */
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
    autoApproveThreshold: 90,
    limit: 0,
    dryRun: false,
    feedQuestionBank: false,
  };

  for (const raw of argv) {
    if (raw === "--dry-run") args.dryRun = true;
    else if (raw === "--feed-question-bank") args.feedQuestionBank = true;
    else if (raw.startsWith("--min-quality=")) {
      args.minQuality = Number(raw.split("=")[1]) || 75;
    } else if (raw.startsWith("--auto-approve=")) {
      args.autoApproveThreshold = Number(raw.split("=")[1]) || 90;
    } else if (raw.startsWith("--promote-quality=")) {
      args.autoApproveThreshold = Number(raw.split("=")[1]) || 90;
    } else if (raw.startsWith("--limit=")) {
      args.limit = Number(raw.split("=")[1]) || 0;
    }
  }

  return args;
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
}

const {
  syncCorpusCandidates,
  CORPUS_SYNC_MIN_QUALITY,
  CORPUS_AUTO_APPROVE_THRESHOLD,
} = loadTsModule("src/server/corpus/sync-corpus-candidates.ts");

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log("=== Planify · sync corpus_candidates ===");
  console.log(
    `min-quality=${args.minQuality ?? CORPUS_SYNC_MIN_QUALITY} auto-approve=${args.autoApproveThreshold ?? CORPUS_AUTO_APPROVE_THRESHOLD} dry-run=${args.dryRun}`,
  );

  const stats = await syncCorpusCandidates({
    minQuality: args.minQuality ?? CORPUS_SYNC_MIN_QUALITY,
    autoApproveThreshold: args.autoApproveThreshold ?? CORPUS_AUTO_APPROVE_THRESHOLD,
    limit: args.limit,
    dryRun: args.dryRun,
  });

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
