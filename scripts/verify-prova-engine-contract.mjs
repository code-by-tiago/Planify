/**
 * Smoke suite for prova engine prompt contract and output validation.
 * Run: npm run verify:prova-engine-contract
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

const {
  buildProvaBnccRagAnchor,
  buildProvaEngineSystemInstruction,
  sanitizeProvaGeminiRawText,
  validateProvaEngineOutput,
} = loadTsModule("src/server/materials/prova-engine-contract.ts");

const baseRequest = {
  tipoMaterial: "prova",
  etapa: "Ensino Fundamental",
  anoSerie: "9º ano",
  componenteCurricular: "Matemática",
  tema: "Equações do 1º grau",
  objetivo: "Resolver equações",
  quantidade: 2,
  dificuldade: "media",
  incluirGabarito: true,
  habilidadesSelecionadas: [
    {
      codigo: "EF09MA08",
      descricao: "Resolver e elaborar problemas que envolvem equações do 2º grau.",
      conteudo: "Equações do 1º grau",
    },
  ],
};

function strongOutput() {
  return {
    title: "Prova — Equações",
    subtitle: "9º ano",
    summary: "",
    sections: [],
    activities: [],
    answerKey: ["Questão 1: b", "Questão 2: passos descritos"],
    teacherNotes: [],
    exam: {
      questions: [
        {
          number: 1,
          type: "multipla-escolha",
          statement:
            "Em equações do 1º grau, qual valor de x resolve 2x + 4 = 10?",
          options: [
            "Substituindo x = 2 em 2x+4 obtemos 8, que não satisfaz a igualdade 10",
            "Substituindo x = 3 em 2x+4 obtemos 10, confirmando a solução da equação",
            "Substituindo x = 4 em 2x+4 obtemos 12, que não satisfaz a igualdade 10",
            "Substituindo x = 5 em 2x+4 obtemos 14, que não satisfaz a igualdade 10",
            "Substituindo x = 6 em 2x+4 obtemos 16, que não satisfaz a igualdade 10",
          ],
          answer: "x = 3, pois 2·3+4=10 confirma a equação do 1º grau.",
        },
        {
          number: 2,
          type: "dissertativa",
          statement:
            "Descreva os passos para resolver 5x - 7 = 18 em equações do 1º grau.",
          options: [],
          answer:
            "Somar 7 aos dois membros (5x=25), dividir por 5 e concluir x=5 verificando na equação original.",
        },
      ],
    },
  };
}

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

test("system instruction forbids chitchat and requires JSON", () => {
  const text = buildProvaEngineSystemInstruction();
  assert.match(text, /Especialista Pedagógico/i);
  assert.match(text, /JSON válido/i);
  assert.match(text, /PROIBIDO.*inventar códigos BNCC/i);
});

test("BNCC RAG anchor includes literal codes", () => {
  const anchor = buildProvaBnccRagAnchor(baseRequest.habilidadesSelecionadas);
  assert.match(anchor, /EF09MA08/);
  assert.match(anchor, /CÓDIGO_LITERAL/);
  assert.match(anchor, /NÃO INVENTE/i);
});

test("BNCC absent anchor forbids inventing codes", () => {
  const anchor = buildProvaBnccRagAnchor(undefined);
  assert.match(anchor, /PROIBIDO inventar/i);
});

test("sanitize strips markdown and preamble", () => {
  const raw =
    'Aqui está sua prova:\n```json\n{"title":"Prova","exam":{"questions":[]}}\n```';
  const cleaned = sanitizeProvaGeminiRawText(raw);
  assert.doesNotMatch(cleaned, /Aqui está/i);
  assert.match(cleaned, /^\{/);
  assert.match(cleaned, /\}$/);
});

test("validate accepts strong prova output", () => {
  const issues = validateProvaEngineOutput(baseRequest, strongOutput());
  assert.deepEqual(issues, []);
});

test("validate rejects chitchat summary", () => {
  const output = { ...strongOutput(), summary: "Aqui está sua prova sobre equações." };
  const issues = validateProvaEngineOutput(baseRequest, output);
  assert.ok(issues.some((issue) => /conversacional/i.test(issue)));
});

test("validate rejects invented BNCC code", () => {
  const output = {
    ...strongOutput(),
    title: "Prova EF07LP06 sobre equações",
  };
  const issues = validateProvaEngineOutput(baseRequest, output);
  assert.ok(issues.some((issue) => /inventado|não autorizado/i.test(issue)));
});

test("validate rejects teacherNotes and sections", () => {
  const output = {
    ...strongOutput(),
    teacherNotes: ["Orientação"],
    sections: [{ title: "Intro", content: "", bullets: [] }],
  };
  const issues = validateProvaEngineOutput(baseRequest, output);
  assert.ok(issues.some((issue) => /teacherNotes/i.test(issue)));
  assert.ok(issues.some((issue) => /sections/i.test(issue)));
});

console.log(`\nverify-prova-engine-contract: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
