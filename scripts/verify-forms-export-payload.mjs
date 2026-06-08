/**
 * Valida payload de exportação para Google Forms e perfis Classroom.
 * node scripts/verify-forms-export-payload.mjs
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

const quizHtml = `
<article class="planify-doc planify-doc-professional">
  <h1>Lista de Exercícios</h1>
  <section class="planify-questoes-block">
    <article class="planify-questao planify-questao-card">
      <p class="planify-questao-statement">Quanto é 2 + 2?</p>
      <span class="planify-questao-type">Múltipla escolha</span>
      <ol class="planify-questao-options"><li>3</li><li>4</li><li>5</li></ol>
    </article>
    <article class="planify-questao planify-questao-card">
      <p class="planify-questao-statement">Explique o que é uma fração.</p>
      <span class="planify-questao-type">Dissertativa</span>
    </article>
  </section>
  <section class="planify-gabarito-block"><h2>Gabarito</h2><ol><li>Questão 1: B</li></ol></section>
  <section><h2>Notas para o professor</h2><ul><li>Tempo sugerido: 40 min.</li></ul></section>
</article>`;

const slideHtml = `
<section class="planify-slide-deck">
  <div class="planify-slide"><h3>Intro</h3></div>
</section>`;

const classroomModule = loadTsModule("src/lib/export/classroom-export-format.ts");
const quizModule = loadTsModule("src/server/google/parse-quiz-from-html.ts");
const prepareModule = loadTsModule("src/server/editor/prepare-export-html.ts");

assert.equal(
  classroomModule.resolveClassroomExportForHtml(quizHtml, "material:prova"),
  "pdf",
);
assert.equal(
  classroomModule.resolveClassroomExportForHtml(slideHtml, "material:slides"),
  "pdf",
);
assert.equal(
  classroomModule.resolveClassroomExportForHtml(
    "<article><h1>Apostila</h1><p>Texto.</p></article>",
    "material:apostila",
  ),
  "docx",
);

const cleanedQuizHtml = prepareModule.stripTeacherOnlyExportBlocks(quizHtml);
const questions = quizModule.parseQuizQuestionsFromHtml(cleanedQuizHtml);

assert.equal(questions.length, 2);
assert.match(questions[0].statement, /2 \+ 2/);
assert.equal(questions[0].type, "multipla-escolha");
assert.equal(questions[0].options.length, 3);
assert.equal(questions[1].type, "dissertativa");
assert.doesNotMatch(
  JSON.stringify(questions),
  /Gabarito|Notas para o professor|Tempo sugerido/i,
);

const formRequests = questions.map((question, index) => {
  const isChoice =
    question.type === "multipla-escolha" ||
    question.type === "verdadeiro-falso" ||
    (question.options.length >= 2 && question.type !== "dissertativa");

  return {
    createItem: {
      item: {
        title: question.statement,
        questionItem: {
          question: isChoice
            ? {
                choiceQuestion: {
                  type: "RADIO",
                  options: question.options.map((value) => ({ value })),
                },
              }
            : {
                textQuestion: {
                  paragraph: question.type === "completar",
                },
              },
        },
      },
      location: { index },
    },
  };
});

assert.equal(formRequests.length, 2);
assert.ok(formRequests[0].createItem.item.title.length >= 8);
assert.equal(
  formRequests[0].createItem.item.questionItem.question.choiceQuestion.options.length,
  3,
);

console.log("Forms/Classroom export payload verified:");
console.log(`- Classroom quiz -> pdf, slides -> pdf, apostila -> docx`);
console.log(`- Parsed questions: ${questions.length}`);
console.log(`- Form batch requests: ${formRequests.length}`);
console.log(`- No gabarito/teacher notes in form payload: OK`);
