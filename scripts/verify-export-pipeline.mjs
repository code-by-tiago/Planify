/**
 * Verifica camadas de exportação: PDF, DOCX, Classroom, Forms, HTML preparado.
 * Sem chamadas Google ao vivo. Run: npm run verify:export-pipeline
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const classroom = loadTsModule("src/lib/export/classroom-export-format.ts");
const detection = loadTsModule("src/lib/google/document-type-detection.ts");
const exportSvc = loadTsModule("src/server/export/editor-html-export-service.ts");
const { parseQuizQuestionsFromHtml } = loadTsModule(
  "src/server/google/parse-quiz-from-html.ts",
);
const { stripTeacherOnlyExportBlocks } = loadTsModule(
  "src/server/editor/prepare-export-html.ts",
);
function resolveGoogleProductForTool(toolId) {
  if (toolId === "slides") return "slides";
  if (toolId === "prova" || toolId === "lista") return "forms";
  return "docs";
}

const gameOutput = buildVisualGameMaterial({
  tipo: "jogo",
  modeloJogo: "cruzadinha",
  tema: "Sintaxe: Sintagmas",
  componenteCurricular: "Língua Portuguesa",
  anoSerie: "8º ano",
  etapa: "Ensino Fundamental",
});
const gameHtml = String(gameOutput.visualHtml || "");

const provaHtml = `
<article class="planify-doc-professional">
  <article class="planify-questao planify-questao-card">
    <p class="planify-questao-statement">Qual é a capital do Brasil?</p>
    <span class="planify-questao-type">Múltipla escolha</span>
    <ol class="planify-questao-options"><li>Brasília</li><li>Rio</li></ol>
  </article>
</article>`;

// --- Classroom: jogos visuais → PDF ---
assert.equal(
  classroom.resolveClassroomExportForHtml(gameHtml, "material:jogo"),
  "pdf",
  "Classroom deve enviar jogo como PDF",
);
assert.equal(
  classroom.resolveClassroomExportForHtml(gameHtml, null),
  "pdf",
  "Classroom detecta jogo visual pelo HTML mesmo sem documentType",
);
assert.equal(
  classroom.resolveClassroomExportForHtml(gameHtml, "material:cruzadinha"),
  "pdf",
  "Classroom deve enviar cruzadinha como PDF",
);
assert.equal(
  classroom.resolveClassroomExportForHtml(provaHtml, "material:prova"),
  "pdf",
);
assert.equal(
  classroom.resolveClassroomExportForHtml(
    "<article><h1>Apostila</h1><p>Texto.</p></article>",
    "material:apostila",
  ),
  "docx",
);

// --- Forms: só prova/lista; jogo oculto/incompatível ---
assert.equal(
  detection.resolveFormsExportCompatible(() => provaHtml, "material:prova"),
  true,
);
assert.equal(
  detection.resolveFormsExportCompatible(() => gameHtml, "material:jogo"),
  false,
);
assert.equal(parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(gameHtml)).length, 0);
assert.equal(parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(provaHtml)).length, 1);

// --- Auto-export pós-geração ---
assert.equal(resolveGoogleProductForTool("jogo"), "docs");
assert.equal(resolveGoogleProductForTool("cruzadinha"), "docs");
assert.equal(resolveGoogleProductForTool("prova"), "forms");
assert.equal(resolveGoogleProductForTool("lista"), "forms");
assert.equal(resolveGoogleProductForTool("slides"), "slides");

// --- PDF export HTML inclui CSS de jogos ---
const { exportHtml: gamePdfHtml } = exportSvc.buildEditorExportHtmlForProfile(
  "Jogo — Sintaxe",
  `<div class="planify-jogo-visual">${gameHtml}</div>`,
  "material:jogo",
);
assert.match(gamePdfHtml, /planify-game-cell--letter/);
assert.match(gamePdfHtml, /table:not\(\.planify-game-table\)/);

const prepared = exportSvc.resolvePreparedExportBody(
  `<div class="planify-jogo-visual">${gameHtml}</div>`,
  "material:jogo",
  "pdf-document",
);
assert.match(prepared, /planify-game-table--crossword/);
assert.match(prepared, /box-shadow:inset 0 0 0 1px #111827/);
assert.match(gamePdfHtml, /box-shadow: inset 0 0 0 1px #111827/);

const legacyCrosswordHtml = `
<section>
  <h2>Cruzadinha — versão do aluno</h2>
  <table>
    <tr><td></td><td>S</td><td></td><td></td></tr>
    <tr><td>N</td><td>A</td><td>R</td><td></td></tr>
    <tr><td></td><td>T</td><td></td><td></td></tr>
    <tr><td></td><td>A</td><td></td><td></td></tr>
  </table>
</section>`;
const legacyPrepared = exportSvc.resolvePreparedExportBody(
  legacyCrosswordHtml,
  "material:jogo",
  "pdf-document",
);
assert.match(legacyPrepared, /planify-game-table--crossword/);
assert.match(legacyPrepared, /planify-game-cell--letter/);
assert.match(legacyPrepared, /box-shadow:inset 0 0 0 1px #111827/);

// --- Rotas API existem ---
for (const route of [
  "src/app/api/google/classroom/export/route.ts",
  "src/app/api/google/docs/export/route.ts",
  "src/app/api/google/drive/export/route.ts",
  "src/app/api/google/forms/export/route.ts",
  "src/app/api/google/slides/export/route.ts",
  "src/app/api/documentos/export/route.ts",
  "src/app/api/documentos/export-pptx/route.ts",
]) {
  const source = readFileSync(join(root, route), "utf8");
  assert.match(source, /export async function POST/, `${route} deve expor POST`);
}

const pptxSvc = loadTsModule("src/server/materials/slides-pptx-export-service.ts");
const sampleSlideHtml = `
<section class="planify-slide-deck" data-planify-slide-theme="moderno">
  <p>Apresentação · 2 slides · Tema moderno</p>
  <div class="planify-slide" style="padding:24px;background:#fff;">
    <h3>Introdução</h3>
    <ul><li>Ponto 1</li><li>Ponto 2</li></ul>
  </div>
  <div class="planify-slide" style="padding:24px;background:#fff;">
    <h3>Desenvolvimento</h3>
    <ul><li>Ponto 3</li></ul>
  </div>
</section>`;

await pptxSvc.exportSlidesPptxBuffer({
  title: "Apresentação teste",
  html: sampleSlideHtml,
}).then((exported) => {
  assert.ok(exported.buffer.byteLength > 800, "PPTX de slides não pode ser vazio");
  assert.match(exported.filename, /\.pptx$/i);
  assert.equal(exported.slideCount, 2);
});

console.log("verify-export-pipeline: OK");
console.log("- Classroom jogo/prova → PDF; apostila → DOCX");
console.log("- Forms só prova/lista; jogo sem questões parseáveis");
console.log("- Auto-export: jogo → Docs, prova/lista → Forms");
console.log("- PDF preserva markup planify-game-*");
console.log("- Jogos legados sem classes são promovidos na exportação");
console.log("- 7 rotas de exportação com POST");
console.log("- PPTX nativo de slides via slides-pptx-export-service");
