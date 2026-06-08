/**
 * Valida exportação DOCX (local e payload Google Docs/Drive).
 * node scripts/verify-docx-export.mjs
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, ".tmp-export-verify");
const moduleCache = new Map();

mkdirSync(outputDir, { recursive: true });

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) {
    return moduleCache.get(normalized);
  }

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
      const candidates = [
        `${resolved}.ts`,
        `${resolved}.js`,
        join(resolved, "index.ts"),
        join(resolved, "index.js"),
      ];

      for (const candidate of candidates) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      const candidates = [`${rel}.ts`, `${rel}.tsx`, join(rel, "index.ts")];
      for (const candidate of candidates) {
        const full = join(root, candidate);
        try {
          readFileSync(full);
          return loadTsModule(candidate.replace(/\\/g, "/"));
        } catch {
          // try next
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

const sampleDocumentHtml = `
<article class="planify-doc planify-doc-professional">
  <header class="planify-doc-header"><p class="planify-doc-kicker">Prova avaliativa</p></header>
  <h1>Prova de Frações</h1>
  <section class="planify-questoes-block">
    <article class="planify-questao planify-questao-card">
      <p class="planify-questao-statement">Qual é metade de 10?</p>
      <ol class="planify-questao-options"><li>4</li><li>5</li><li>6</li></ol>
    </article>
  </section>
  <section><h2>Notas para o professor</h2><ul><li>Corrigir com calma.</li></ul></section>
</article>`;

const sampleSlideHtml = `
<section class="planify-slide-deck" data-planify-slide-theme="moderno">
  <p>Apresentação · 2 slides · Tema moderno</p>
  <div class="planify-slide"><h3>Slide 1</h3><p>Conteúdo A</p></div>
  <div class="planify-slide"><h3>Slide 2</h3><p>Conteúdo B</p>
    <div><span>Notas do professor</span><span>Explique o tema.</span></div>
  </div>
</section>`;

const exportModule = loadTsModule("src/server/export/editor-html-export-service.ts");
const nativeModule = loadTsModule("src/server/docx/html-to-native-docx.ts");

const documentExport = await exportModule.exportEditorHtmlDocument({
  title: "Prova de Frações",
  html: sampleDocumentHtml,
  format: "docx",
  documentType: "material:prova",
});

assert.equal(documentExport.filename.endsWith(".docx"), true);
assert.ok(documentExport.buffer.byteLength > 1000, "DOCX de documento não pode ser vazio");
assert.equal(documentExport.buffer.subarray(0, 2).toString("utf8"), "PK");

const documentXml = nativeModule.buildNativeDocumentBodyXml(
  "Prova de Frações",
  exportModule.resolvePreparedExportBody(
    sampleDocumentHtml,
    "material:prova",
    "docx",
  ),
);

assert.match(documentXml, /Prova de Frações/);
assert.match(documentXml, /metade de 10/i);
assert.doesNotMatch(documentXml, /Notas para o professor/i);

const slideBody = exportModule.resolvePreparedExportBody(
  sampleSlideHtml,
  "material:slides",
  "docx",
);
assert.match(slideBody, /class="planify-slide"/);
assert.doesNotMatch(slideBody, /planify-slide-deck/i);
assert.doesNotMatch(slideBody, /Notas do professor/i);
assert.doesNotMatch(slideBody, /planify-slide-export-inner/i);

const slideExport = await exportModule.exportEditorHtmlDocument({
  title: "Slides Teste",
  html: sampleSlideHtml,
  format: "docx",
  documentType: "material:slides",
});

assert.ok(slideExport.buffer.byteLength > 800, "DOCX de slides não pode ser vazio");
assert.match(
  nativeModule.buildNativeDocumentBodyXml("Slides Teste", slideBody),
  /Conteúdo A/,
);

writeFileSync(join(outputDir, "verify-prova.docx"), documentExport.buffer);
writeFileSync(join(outputDir, "verify-slides.docx"), slideExport.buffer);

console.log("DOCX export verified:");
console.log(`- Document DOCX bytes: ${documentExport.buffer.byteLength}`);
console.log(`- Slide DOCX bytes: ${slideExport.buffer.byteLength}`);
console.log(`- Teacher notes stripped from DOCX body: OK`);
console.log(`- Artifacts: ${outputDir}`);
