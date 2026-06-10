/**
 * Verificação estática Sprint U3 — planejamentos, editor, export-error-service.
 * Run: npm run verify:unification-u3
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/server/export/export-error-service.ts",
  "src/app/planejamentos/PlanejamentosClient.tsx",
  "src/components/slides/SlideAiAdjustPanel.tsx",
  "src/app/api/google/docs/export/route.ts",
  "src/app/api/google/slides/export/route.ts",
  "src/app/api/google/forms/export/route.ts",
  "src/app/api/documentos/export/route.ts",
  "src/app/api/planejamentos/docx-pacote/route.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `arquivo ausente: ${file}`);
}

const ts = require("typescript");
function loadTsModule(relativePath) {
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
      return loadTsModule(`${rel}.ts`);
    }
    if (specifier === "next/server") {
      return { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } };
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", transpiled)(
    module.exports,
    localRequire,
    module,
  );
  return module.exports;
}

const { mapExportError } = loadTsModule("src/server/export/export-error-service.ts");
const offline = mapExportError(new TypeError("Failed to fetch"));
assert.equal(offline.code, "server_error");
assert.equal(offline.retryable, true);

const auth = mapExportError(new Error("login required"), 401);
assert.equal(auth.status, 401);

const planejSource = readFileSync(
  join(root, "src/app/planejamentos/PlanejamentosClient.tsx"),
  "utf8",
);
assert.match(planejSource, /formatGenerationError/);
assert.match(planejSource, /GenerationErrorBanner/);
assert.match(planejSource, /MaterialPreviewSkeleton/);

const slideAdjust = readFileSync(
  join(root, "src/components/slides/SlideAiAdjustPanel.tsx"),
  "utf8",
);
assert.match(slideAdjust, /formatGenerationError/);
assert.match(slideAdjust, /MaterialPreviewSkeleton/);

for (const route of [
  "src/app/api/google/docs/export/route.ts",
  "src/app/api/planejamentos/docx-pacote/route.ts",
]) {
  const source = readFileSync(join(root, route), "utf8");
  assert.match(source, /export-error-service/);
}

console.log("verify-unification-u3: OK");
