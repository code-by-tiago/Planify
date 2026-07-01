import { readFileSync, writeFileSync } from "node:fs";
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
      for (const candidate of [
        `${resolved}.ts`,
        `${resolved}.js`,
        join(resolved, "index.ts"),
      ]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`, join(rel, "index.ts")]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate.replace(/\\/g, "/"));
        } catch {
          // continue
        }
      }
    }
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

const { buildVisualGameMaterial } = loadTsModule("src/lib/materiais/game-builder.ts");
const exportSvc = loadTsModule("src/server/export/editor-html-export-service.ts");

const gameOutput = buildVisualGameMaterial({
  tipo: "jogo",
  modeloJogo: "cruzadinha",
  tema: "Sintaxe: Sintagmas",
  componenteCurricular: "Língua Portuguesa",
  anoSerie: "8º ano",
  etapa: "Ensino Fundamental",
});
const gameHtml = String(gameOutput.visualHtml || "");

const { exportHtml: gamePdfHtml } = exportSvc.buildEditorExportHtmlForProfile(
  "Cruzadinha — preview",
  `<div class="planify-jogo-visual">${gameHtml}</div>`,
  "material:jogo",
);

writeFileSync(join(root, ".tmp-crossword-rendered.html"), gamePdfHtml, "utf8");
console.log("Wrote .tmp-crossword-rendered.html");
