/**
 * Verificação estática Sprint 3 — OCR, banco DB, dedup, rotas.
 * Run: npm run verify:sprint3
 *
 * Smoke manual:
 * 1. Correção → upload foto → texto preenchido → corrigir → perfil sincroniza
 * 2. Correção lote → 3 respostas com --- → 3 feedbacks
 * 3. Banco → migrar local → logout/login → mesmas questões
 * 4. Publicar questão → aparece em Comunidade para outro usuário
 * 5. Importar prova servidor → sem duplicata ao reimportar
 * 6. Montar prova → prova recebe questões via sessionStorage
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
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
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

const { computeQuestionContentHash } = loadTsModule(
  "src/lib/banco-questoes/question-bank-hash.ts",
);
const { extractQuestionsFromMaterialOutput } = loadTsModule(
  "src/lib/banco-questoes/question-bank-extract.ts",
);
const { mapQuestionBankRow } = loadTsModule(
  "src/server/banco-questoes/question-bank-db-service.ts",
);
const { splitMultiStudentText } = loadTsModule(
  "src/lib/correcao/correcao-ocr-client.ts",
);

// --- hash normalization ---
const h1 = computeQuestionContentHash("  Questão   A? ", "Discursiva");
const h2 = computeQuestionContentHash("questao a", "discursiva");
assert.equal(h1, h2);
assert.equal(h1.length, 32);

const h3 = computeQuestionContentHash("Questão A", "objetiva");
assert.notEqual(h1, h3);

// --- mapper DB ↔ QuestionBankItem ---
const mapped = mapQuestionBankRow({
  id: "00000000-0000-4000-8000-000000000001",
  user_id: "00000000-0000-4000-8000-000000000002",
  school_id: null,
  enunciado: "Teste?",
  tipo: "discursiva",
  alternativas: [],
  resposta_esperada: "Sim",
  criterio_correcao: "",
  componente: "História",
  ano_serie: "5º ano",
  etapa: "",
  tema: "Teste",
  bncc_codigos: ["EF05HI06"],
  tags: ["tag"],
  source_title: null,
  source_type: null,
  content_hash: "abc123",
  visibility: "community",
  is_published: true,
  published_at: "2026-01-01T00:00:00.000Z",
  usage_count: 7,
  author_display_name: "Prof. Silva",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
});
assert.equal(mapped.isCommunity, true);
assert.equal(mapped.usageCount, 7);
assert.equal(mapped.authorName, "Prof. Silva");

// --- extract + dedup ---
const extracted = extractQuestionsFromMaterialOutput(
  {
    titulo: "Prova",
    tipo: "prova",
    questoes: [
      { enunciado: "Qual a capital do Brasil?", tipo: "objetiva" },
      { enunciado: "Qual a capital do Brasil?", tipo: "objetiva" },
    ],
  },
  { componente: "Geografia" },
);
assert.equal(extracted.length, 2);
assert.equal(extracted[0].contentHash, extracted[1].contentHash);

const hashes = new Set(extracted.map((q) => q.contentHash));
assert.equal(hashes.size, 1);

// --- OCR split heuristics ---
const split = splitMultiStudentText("Aluno A\nResposta longa aqui...\n---\nAluno B\nOutra resposta longa...");
assert.ok(split.length >= 2);

// --- route files exist ---
const routeFiles = [
  "src/app/api/correcao/extrair/route.ts",
  "src/app/api/correcao/avaliar-lote/route.ts",
  "src/app/api/banco-questoes/itens/route.ts",
  "src/app/api/banco-questoes/itens/[id]/route.ts",
  "src/app/api/banco-questoes/publicar/route.ts",
  "src/app/api/banco-questoes/migrar-local/route.ts",
  "src/app/api/admin/banco-questoes/[id]/despublicar/route.ts",
  "src/server/correcao/correction-ocr-service.ts",
  "src/lib/banco-questoes/question-bank-sync.ts",
  "supabase/migrations/20260620_question_bank_items.sql",
  "scripts/seed-community-questions.mjs",
];

for (const file of routeFiles) {
  assert.ok(existsSync(join(root, file)), `missing ${file}`);
}

const geminiSource = readFileSync(join(root, "src/server/ai/gemini-client.ts"), "utf8");
assert.match(geminiSource, /generateGeminiTextFromMedia/);

console.log("verify:sprint3 OK — hash, mapper, dedup, rotas Sprint 3");
