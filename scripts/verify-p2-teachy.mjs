/**
 * P2 verification: BNCC tema autocomplete + OCR student split.
 * Run: node scripts/verify-p2-teachy.mjs
 */
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOG = join(root, "debug-0e58e7.log");
const moduleCache = new Map();

function agentLog(hypothesisId, location, message, data) {
  const line = JSON.stringify({
    sessionId: "0e58e7",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId: "verify-script",
  });
  appendFileSync(LOG, `${line}\n`);
}

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) return moduleCache.get(normalized);

  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = require("fs").readFileSync(sourcePath, "utf8");
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
          require("fs").readFileSync(candidate);
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        } catch {
          /* try next */
        }
      }
    }
    if (specifier === "server-only") return {};
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const ext of [".ts", ".tsx", "/index.ts"]) {
        try {
          require("fs").readFileSync(join(root, rel + ext));
          return loadTsModule(rel + ext);
        } catch {
          /* try next */
        }
      }
    }
    return require(specifier);
  };

  const fn = new Function("require", "module", "exports", transpiled);
  fn(localRequire, module, module.exports);
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

const catalog = loadTsModule("src/server/bncc/bncc-catalog-service.ts");
const { searchBnccTemaSuggestions, browseBnccTemaSuggestions } = loadTsModule(
  "src/server/bncc/bncc-tema-autocomplete.ts",
);
const { splitMultiStudentText } = loadTsModule(
  "src/lib/correcao/correcao-ocr-client.ts",
);

async function main() {
  const cached = await catalog.getCachedBnccSkills();
  agentLog("H1", "verify-p2-teachy.mjs", "catalog source", { count: cached.length });

  // H1: context filter too strict
  const withContext = await searchBnccTemaSuggestions("Fraç", {
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Matemática",
  });
  agentLog("H1", "verify-p2-teachy.mjs", "autocomplete with context", {
    count: withContext.length,
    firstLabel: withContext[0]?.label,
  });

  const noContext = await searchBnccTemaSuggestions("Fraç", {});
  agentLog("H1", "verify-p2-teachy.mjs", "autocomplete no context", {
    count: noContext.length,
    firstLabel: noContext[0]?.label,
  });

  assert.ok(
    withContext.length > 0,
    "H1 FAIL: expected suggestions with Matemática 5º Fraç",
  );

  const browse = await browseBnccTemaSuggestions({
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Matemática",
  });
  agentLog("H2", "verify-p2-teachy.mjs", "browse prefetch", {
    count: browse.length,
    firstLabel: browse[0]?.label,
  });
  assert.ok(
    browse.length > 0,
    "H2 FAIL: expected browse suggestions for Matemática 5º",
  );

  const { trimTeachyGabaritoAnswer, TEACHY_MAX_GABARITO_CHARS } = loadTsModule(
    "src/lib/materiais/material-document-layout.ts",
  );
  assert.equal(TEACHY_MAX_GABARITO_CHARS, 120);
  const longAnswer = "A".repeat(200);
  assert.ok(
    trimTeachyGabaritoAnswer(longAnswer).length <= 121,
    "gabarito deve respeitar limite Teachy",
  );

  // H5: student split heuristics
  const sample = `Aluno: Maria Silva
Resposta da questão 1 sobre frações.

Aluno: João Santos
Resposta da questão 1 diferente.`;

  const parts = splitMultiStudentText(sample);
  agentLog("H5", "verify-p2-teachy.mjs", "split multi student", {
    parts: parts.length,
    lengths: parts.map((p) => p.length),
  });
  assert.equal(parts.length, 2, "H5 FAIL: expected 2 student blocks");

  console.log("verify-p2-teachy: OK");
  console.log(`  autocomplete with context: ${withContext.length} (${withContext[0]?.label})`);
  console.log(`  browse prefetch: ${browse.length} (${browse[0]?.label})`);
  console.log(`  autocomplete no context: ${noContext.length}`);
  console.log(`  student split: ${parts.length} parts`);
}

main().catch((err) => {
  agentLog("ERR", "verify-p2-teachy.mjs", "verify failed", {
    error: String(err?.message || err),
  });
  console.error(err);
  process.exit(1);
});
