/**
 * Verificação estática Sprint 4 — erros uniformes, swipe, ops, escola, PDF.
 * Run: npm run verify:sprint4
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
      jsx: ts.JsxEmit.React,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.tsx`, `${resolved}.js`]) {
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
    if (specifier === "next/link") {
      return { default: ({ children }) => children };
    }
    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    "React",
    transpiled,
  );
  const React = require("react");
  evaluator(
    module.exports,
    localRequire,
    module,
    dirname(sourcePath),
    sourcePath,
    React,
  );
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

const requiredFiles = [
  "src/components/pro/SwipeTabPanel.tsx",
  "src/lib/pro/generation-error-ui.tsx",
  "src/server/telemetry/operational-telemetry.ts",
  "src/app/api/banco-questoes/publicar-escola/route.ts",
  "src/app/api/correcao/exportar-pdf/route.ts",
  "src/components/materiais/MaterialPreviewSkeleton.tsx",
  "src/components/credits/GenerationCostHint.tsx",
  "supabase/migrations/20260622_operational_events.sql",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `arquivo ausente: ${file}`);
}

const { formatGenerationError } = loadTsModule("src/lib/pro/generation-error-ui.tsx");
const { computeQuestionContentHash } = loadTsModule(
  "src/lib/banco-questoes/question-bank-hash.ts",
);
const { MaterialPreviewSkeleton } = loadTsModule(
  "src/components/materiais/MaterialPreviewSkeleton.tsx",
);

// --- formatGenerationError ---
const offline = formatGenerationError(new TypeError("Failed to fetch"));
assert.equal(offline.code, "offline");
assert.equal(offline.retryable, true);

const credits = formatGenerationError({ code: "insufficient_credits", message: "x" });
assert.equal(credits.code, "insufficient_credits");
assert.equal(credits.retryable, false);
assert.ok(credits.cta);

const daily = formatGenerationError({ code: "daily_limit_reached" });
assert.equal(daily.code, "daily_limit_reached");
assert.match(daily.message, /Brasília/i);

const serverBusy = formatGenerationError({ status: 502, message: "bad gateway" });
assert.equal(serverBusy.code, "server_error");
assert.equal(serverBusy.retryable, true);

// --- hash regression ---
const h1 = computeQuestionContentHash("  Questão   A? ", "Discursiva");
const h2 = computeQuestionContentHash("questao a", "discursiva");
assert.equal(h1, h2);

assert.equal(typeof MaterialPreviewSkeleton, "function");

console.log("verify-sprint4: OK");
