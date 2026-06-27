/**
 * Verificação estática do garimpo/RAG MVP (corpus_candidates + export_success).
 * Run: npm run verify:corpus-mining
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const migration = readFileSync(
  join(root, "supabase/migrations/20260702120000_corpus_candidates.sql"),
  "utf8",
);
assert.match(migration, /corpus_candidates/);
assert.match(migration, /PRIVACIDADE/);
assert.match(migration, /planify-corpus/);

const opsSource = readFileSync(
  join(root, "src/server/telemetry/operational-telemetry.ts"),
  "utf8",
);
assert.match(opsSource, /"export_success"/);

const exportSource = readFileSync(
  join(root, "src/server/export/export-error-service.ts"),
  "utf8",
);
assert.match(exportSource, /logExportSuccess/);

const { computeContentHash } = loadTsModule("src/lib/pedagogical-cache/topic-signature.ts");
const hashA = computeContentHash("resumo didático sobre fotossíntese", "Fotossíntese");
const hashB = computeContentHash("resumo didático sobre fotossíntese", "Fotossíntese");
const hashC = computeContentHash("outro conteúdo", "Fotossíntese");
assert.equal(hashA, hashB);
assert.notEqual(hashA, hashC);

assert.ok(existsSync(join(root, "scripts/corpus-mining/sync-corpus-candidates.mjs")));
assert.ok(existsSync(join(root, "src/server/corpus/sync-corpus-candidates.ts")));
assert.ok(existsSync(join(root, "src/app/api/cron/corpus-sync/route.ts")));
assert.ok(existsSync(join(root, "src/app/api/admin/corpus-candidates/stats/route.ts")));

const vercelJson = readFileSync(join(root, "vercel.json"), "utf8");
assert.match(vercelJson, /\/api\/cron\/corpus-sync/);
assert.match(vercelJson, /0 5 \* \* \*/);

const syncSource = readFileSync(
  join(root, "src/server/corpus/sync-corpus-candidates.ts"),
  "utf8",
);
assert.match(syncSource, /CORPUS_AUTO_APPROVE_THRESHOLD = 90/);
assert.match(syncSource, /review_status: autoApproved \? "approved" : "pending"/);
assert.match(syncSource, /review_status: "approved"/);
assert.match(syncSource, /PRIVACIDADE/);

const resolverSource = readFileSync(
  join(root, "src/server/pedagogical-cache/pedagogical-context-resolver.ts"),
  "utf8",
);
assert.match(resolverSource, /findApprovedCorpusCandidates/);

console.log("verify-corpus-mining: OK");
