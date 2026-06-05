import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, ".tmp-export-verify");

mkdirSync(outputDir, { recursive: true });

async function loadTsModule(relativePath) {
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
  const evaluator = new Function("exports", "require", "module", "__dirname", "__filename", transpiled);
  evaluator(module.exports, require, module, dirname(sourcePath), sourcePath);
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

const docxModule = await loadTsModule("src/server/docx/simple-docx-builder.ts");
const exportModule = await loadTsModule("src/server/export/editor-html-export-service.ts");

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

writeFileSync(join(outputDir, "sample.docx"), exported.buffer);
writeFileSync(join(outputDir, "sample.html"), exportHtml, "utf8");

console.log("Export motors verified:");
console.log(`- DOCX bytes: ${exported.buffer.byteLength}`);
console.log(`- HTML bytes: ${Buffer.byteLength(exportHtml, "utf8")}`);
console.log(`- Artifacts: ${outputDir}`);
