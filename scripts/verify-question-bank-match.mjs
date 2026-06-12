/**
 * Smoke suite for question bank browse/search matching logic.
 * Run: node scripts/verify-question-bank-match.mjs
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
  });

  const module = { exports: {} };
  const dirnamePath = dirname(sourcePath);
  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    transpiled.outputText,
  );
  evaluator(
    module.exports,
    (request) => {
      if (request.startsWith("@/")) {
        const mapped = request.replace("@/", "src/") + ".ts";
        return loadTsModule(mapped);
      }
      return require(request);
    },
    module,
    sourcePath,
    dirnamePath,
  );
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

const { searchQuestionBankItems, scoreQuestionBankMatch } = loadTsModule(
  "src/lib/banco-questoes/question-bank-match.ts",
);

const now = new Date().toISOString();

function item(partial) {
  return {
    enunciado: "Enunciado",
    tipo: "objetiva",
    alternativas: ["A", "B", "C", "D"],
    respostaEsperada: "A",
    criterioCorrecao: "",
    componente: "Língua Portuguesa",
    anoSerie: "3ª série",
    etapa: "Ensino Médio",
    tema: "",
    bnccCodigos: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const FIXTURES = [
  item({
    id: "em-lp-3",
    tema: "Sintaxe e concordância",
    tags: ["Sintaxe", "Concordância"],
    bnccCodigos: ["EM13LP08"],
  }),
  item({
    id: "em-lp-1",
    tema: "Textos argumentativos",
    bnccCodigos: ["EM13LP05"],
    anoSerie: "1ª série",
  }),
  item({
    id: "ef-lp-7",
    tema: "Sintaxe básica",
    tags: ["Sintaxe"],
    bnccCodigos: ["EF07LP06"],
    anoSerie: "7º ano",
    etapa: "Ensino Fundamental",
  }),
  item({
    id: "bad-meta",
    tema: "Erro de metadado",
    bnccCodigos: ["EF07LP06"],
    anoSerie: "7º ano",
    etapa: "Ensino Médio",
  }),
];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
    failed += 1;
  }
}

test("browse shows all valid items", () => {
  const result = searchQuestionBankItems(FIXTURES, {
    query: "",
    etapa: "todos",
    componente: "todos",
    anoSerie: "todos",
    bncc: "",
    source: "todas",
  });
  assert.equal(result.mode, "browse");
  assert.equal(result.items.length, 3);
  assert.ok(!result.items.some((i) => i.id === "bad-meta"));
});

test("browse EM 3ª série LP excludes EF", () => {
  const result = searchQuestionBankItems(FIXTURES, {
    query: "",
    etapa: "Ensino Médio",
    componente: "Língua Portuguesa",
    anoSerie: "3ª série",
    bncc: "",
    source: "todas",
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, "em-lp-3");
});

test("search tema+BNCC EM never returns EF items", () => {
  const result = searchQuestionBankItems(FIXTURES, {
    query: "Sintaxe",
    etapa: "Ensino Médio",
    componente: "Língua Portuguesa",
    anoSerie: "3ª série",
    bncc: "",
    bnccCodigos: ["EM13LP08"],
    bnccSearchTerms: [
      "Analisar elementos da sintaxe",
      "Empregar sintaxe na produção textual",
    ],
    source: "todas",
  });
  const ids = [...result.items, ...result.related].map((i) => i.id);
  assert.ok(!ids.includes("ef-lp-7"));
  assert.ok(!ids.includes("bad-meta"));
});

test("search Sintaticas matches sintaxe via tema token normalization", () => {
  const result = searchQuestionBankItems(FIXTURES, {
    query: "Sintaticas",
    etapa: "Ensino Médio",
    componente: "Língua Portuguesa",
    anoSerie: "3ª série",
    bncc: "",
    source: "todas",
  });
  const ids = result.items.map((i) => i.id);
  assert.ok(
    ids.includes("em-lp-3") || result.related.some((i) => i.id === "em-lp-1"),
    `expected EM sintaxe matches, got items=${ids.join(",")} related=${result.related.map((i) => i.id).join(",")}`,
  );
  assert.ok(!ids.includes("ef-lp-7"));
});

test("related stays within EM stage", () => {
  const result = searchQuestionBankItems(FIXTURES, {
    query: "argumentativos",
    etapa: "Ensino Médio",
    componente: "Língua Portuguesa",
    anoSerie: "3ª série",
    bncc: "",
    source: "todas",
  });
  const ids = [...result.items, ...result.related].map((i) => i.id);
  for (const id of ids) {
    assert.notEqual(id, "ef-lp-7");
    assert.notEqual(id, "bad-meta");
  }
});

test("score rejects cross-stage serie", () => {
  const score = scoreQuestionBankMatch(
    FIXTURES[2],
    "Sintaxe",
    "Língua Portuguesa",
    "3ª série",
  );
  assert.equal(score, 0);
});

console.log(`\nverify-question-bank-match: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
