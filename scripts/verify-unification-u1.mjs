/**
 * Verificação estática Sprint U1 — contrato JSON, shared layer, ops wrapper, rotas.
 * Run: npm run verify:unification-u1
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
    if (specifier === "next/server") {
      return {
        NextResponse: {
          json: (body, init) => ({ body, status: init?.status ?? 200 }),
        },
      };
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
  "src/server/generation/generation-api-contract.ts",
  "src/server/generation/generation-api-shared.ts",
  "src/server/telemetry/with-operational-capture.ts",
  "src/lib/ops/sentry-dsn.ts",
  "src/lib/pro/generation-error-ui.tsx",
  "src/app/api/materiais/gerar/route.ts",
  "src/app/api/planejamentos/gerar-ia/route.ts",
  "src/app/api/inclusao/adaptar/route.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `arquivo ausente: ${file}`);
}

// --- contract helpers ---
const { jsonGenerationError, jsonGenerationValidationError } = loadTsModule(
  "src/server/generation/generation-api-contract.ts",
);

const creditsErr = jsonGenerationError("insufficient_credits", "sem créditos", 402);
assert.equal(creditsErr.status, 402);
assert.equal(creditsErr.body.code, "insufficient_credits");

const validationErr = jsonGenerationValidationError("campo inválido");
assert.equal(validationErr.status, 400);
assert.equal(validationErr.body.code, "validation_error");

// --- shared layer (static exports) ---
const sharedSource = readFileSync(
  join(root, "src/server/generation/generation-api-shared.ts"),
  "utf8",
);
for (const fn of [
  "prepareGenerationRequest",
  "refundGenerationCharges",
  "finalizeGenerationFailure",
  "logGenerationSuccessEvent",
]) {
  assert.match(sharedSource, new RegExp(`export async function ${fn}|export function ${fn}`));
}

// --- operational capture wrapper ---
const { withOperationalCapture } = loadTsModule(
  "src/server/telemetry/with-operational-capture.ts",
);
assert.equal(typeof withOperationalCapture, "function");

// --- operational event types extended ---
const opsSource = readFileSync(
  join(root, "src/server/telemetry/operational-telemetry.ts"),
  "utf8",
);
for (const eventType of [
  "material_generation_failed",
  "planning_generation_failed",
  "export_failed",
  "editor_ai_adjust_failed",
]) {
  assert.match(opsSource, new RegExp(`"${eventType}"`));
}

// --- routes use shared layer ---
for (const routeFile of [
  "src/app/api/materiais/gerar/route.ts",
  "src/app/api/inclusao/adaptar/route.ts",
  "src/app/api/planejamentos/gerar-ia/route.ts",
]) {
  const source = readFileSync(join(root, routeFile), "utf8");
  assert.match(source, /generation-api-shared|withOperationalCapture/);
}

// --- GenerationErrorBanner exported ---
const { GenerationErrorBanner, formatGenerationError } = loadTsModule(
  "src/lib/pro/generation-error-ui.tsx",
);
assert.equal(typeof GenerationErrorBanner, "function");
assert.equal(typeof formatGenerationError, "function");

// --- Sentry DSN helper ---
const { getSentryDsn } = loadTsModule("src/lib/ops/sentry-dsn.ts");
assert.equal(typeof getSentryDsn, "function");

// --- ops-staging documents error contract ---
const opsDoc = readFileSync(join(root, "docs/ops-staging.md"), "utf8");
assert.match(opsDoc, /Padrão de erro|generation-api-contract/i);

console.log("verify-unification-u1: OK");
