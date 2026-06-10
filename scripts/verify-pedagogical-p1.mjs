/**
 * Verificação estática Sprint P1 — schema, topic-signature, BNCC adapter, resolver.
 * Run: npm run verify:pedagogical-p1
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) return moduleCache.get(normalized);

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
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        try {
          readFileSync(candidate);
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        } catch {
          // try next
        }
      }
    }
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
    if (specifier === "server-only") return {};
    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, localRequire, module, dirname(sourcePath), sourcePath);
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

const migration = readFileSync(
  join(root, "supabase/migrations/20260625_pedagogical_cache.sql"),
  "utf8",
);

assert.match(migration, /pedagogical_sources/);
assert.match(migration, /pedagogical_cache_entries/);
assert.match(migration, /pedagogical_cache_aliases/);
assert.match(migration, /pedagogical_scrape_jobs/);
assert.match(migration, /pedagogical_cache_usage/);
assert.match(migration, /wikipedia-pt/);
assert.match(migration, /bncc-skills/);
assert.match(migration, /bncc-gov-orientacoes/);

const { computeTopicSignature, computeContentHash } = loadTsModule(
  "src/lib/pedagogical-cache/topic-signature.ts",
);

const sig1 = computeTopicSignature({
  tema: "Fotossíntese",
  componente: "Ciências",
  etapa: "Ensino Fundamental",
  bnccCodigo: "EF05CI05",
});
const sig2 = computeTopicSignature({
  tema: "fotossintese",
  componente: "ciencias",
  etapa: "ensino fundamental",
  bnccCodigo: "ef05ci05",
});
assert.equal(sig1, sig2, "topic signature deve ser estável após normalização");

const hash1 = computeContentHash("Corpo do texto", "Título");
const hash2 = computeContentHash("corpo do texto", "titulo");
assert.equal(hash1, hash2, "content hash deve ser estável");

assert.ok(
  existsSync(join(root, "src/server/pedagogical-cache/adapters/bncc-gov-adapter.ts")),
);
assert.ok(
  existsSync(join(root, "src/server/pedagogical-cache/pedagogical-context-resolver.ts")),
);
assert.ok(
  existsSync(join(root, "src/app/api/pedagogico/contexto/route.ts")),
);
assert.ok(existsSync(join(root, "scripts/backfill-pedagogical-bncc.mjs")));

const dbTypes = readFileSync(join(root, "src/types/database.ts"), "utf8");
assert.match(dbTypes, /pedagogical_cache_entries/);
assert.match(dbTypes, /pedagogical_sources/);

const { appendPedagogicalContext } = loadTsModule(
  "src/server/pedagogical-cache/pedagogical-context-resolver.ts",
);

const appended = appendPedagogicalContext("obs existente", [
  {
    id: "1",
    title: "BNCC EF05HI06",
    summary: "Resumo curto",
    source_title: "BNCC EF05HI06",
    bncc_codigos: ["EF05HI06"],
  },
]);
assert.match(appended, /CONTEXTO VERIFICADO/);
assert.match(appended, /EF05HI06/);
assert.match(appended, /obs existente/);

console.log("verify:pedagogical-p1: OK");
