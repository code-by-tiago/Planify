import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, ".tmp-export-verify");

mkdirSync(outputDir, { recursive: true });

const moduleCache = new Map();

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

const sampleHtml = `
<article class="planify-doc">
  <h1>Revisão de Frações</h1>
  <p>Material com tabela e lista para validar exportação.</p>
  <table>
    <tbody>
      <tr><th>Item</th><th>Valor</th></tr>
      <tr><td>Metade</td><td>1/2</td></tr>
      <tr><td>Terceiro</td><td>1/3</td></tr>
    </tbody>
  </table>
  <ul><li>Primeiro tópico</li><li>Segundo tópico</li></ul>
</article>
`.trim();

const flashcardHtml = `
<article class="planify-doc">
  <h1>Aprofundando o Conhecimento para o Ensino Médio</h1>
  <p>Classes de palavras em português.</p>
  <div class="planify-flashcard">
    <strong>PERGUNTA 1</strong>
    <p>O que é um substantivo?</p>
    <p>Palavra que nomeia seres, objetos, lugares ou ideias.</p>
  </div>
  <div class="planify-flashcard">
    <strong>PERGUNTA 2</strong>
    <p>O que é um adjetivo?</p>
    <p>Palavra que qualifica ou caracteriza o substantivo.</p>
  </div>
</article>
`.trim();

const exportModule = loadTsModule("src/server/export/editor-html-export-service.ts");

const exported = await exportModule.exportEditorHtmlDocument({
  title: "Revisão de Frações",
  html: sampleHtml,
  format: "docx",
});

assert.equal(exported.filename.endsWith(".docx"), true);
assert.ok(exported.buffer.byteLength > 1000, "DOCX buffer should not be empty");

const zipSignature = exported.buffer.subarray(0, 2).toString("utf8");
assert.equal(zipSignature, "PK", "DOCX should be a zip archive");

const exportHtml = exportModule.buildEditorExportDocumentHtml(
  "Revisão de Frações",
  sampleHtml,
);

assert.match(exportHtml, /<table>/);
assert.match(exportHtml, /Revisão de Frações/);
assert.match(exportHtml, /planify-export-document/);

const flashcardExport = await exportModule.exportEditorHtmlDocument({
  title: "Flashcards — Classes de palavras",
  html: flashcardHtml,
  format: "docx",
});

assert.ok(flashcardExport.buffer.byteLength > 1000, "Flashcard DOCX should not be empty");

const nativeModule = loadTsModule("src/server/docx/html-to-native-docx.ts");
const flashcardXml = nativeModule.buildNativeDocumentBodyXml(
  "Flashcards — Classes de palavras",
  flashcardHtml,
);
assert.match(flashcardXml, /PERGUNTA 1/);
assert.match(flashcardXml, /substantivo/i);
assert.match(flashcardXml, /<w:t[^>]*>[^<]+<\/w:t>/);

writeFileSync(join(outputDir, "sample.docx"), exported.buffer);
writeFileSync(join(outputDir, "flashcards.docx"), flashcardExport.buffer);
writeFileSync(join(outputDir, "sample.html"), exportHtml, "utf8");

console.log("Export motors verified:");
console.log(`- DOCX bytes: ${exported.buffer.byteLength}`);
console.log(`- Flashcard DOCX bytes: ${flashcardExport.buffer.byteLength}`);
console.log(`- HTML bytes: ${Buffer.byteLength(exportHtml, "utf8")}`);
console.log(`- Artifacts: ${outputDir}`);
