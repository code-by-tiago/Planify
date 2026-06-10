/**
 * Verificação estática Sprint 2 — normalizeMaterialEstrutura + perfil correção.
 * Run: npm run verify:sprint2
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
        try {
          readFileSync(join(root, candidate));
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
  normalizeMaterialEstrutura,
  countQuestionsInResponseJson,
} = loadTsModule("src/lib/materiais/normalize-material-estrutura.ts");

const {
  sanitizeCorrectionProfile,
  mergeCorrectionProfiles,
  DEFAULT_CORRECTION_PROFILE,
} = loadTsModule("src/server/correcao/correction-profile-service.ts");

// --- normalizeMaterialEstrutura fixtures ---

const nestedFixture = {
  estrutura: {
    titulo: "Prova aninhada",
    questoes: [{ enunciado: "Questão 1 da prova aninhada?" }],
  },
};

const rootFixture = {
  titulo: "Lista root",
  tipo: "lista",
  questoes: [
    { enunciado: "Questão 1 da lista root?" },
    { enunciado: "Questão 2 da lista root?" },
  ],
};

const emptyFixture = { titulo: "Slides sem questões", secoes: [] };

const nested = normalizeMaterialEstrutura(nestedFixture);
assert.equal(nested.hasQuestions, true);
assert.equal(nested.estrutura?.titulo, "Prova aninhada");
assert.equal(nested.estrutura?.questoes?.length, 1);

const rootResult = normalizeMaterialEstrutura(rootFixture);
assert.equal(rootResult.hasQuestions, true);
assert.equal(rootResult.estrutura?.tipo, "lista");
assert.equal(countQuestionsInResponseJson(rootFixture), 2);

const empty = normalizeMaterialEstrutura(emptyFixture);
assert.equal(empty.hasQuestions, false);
assert.equal(empty.estrutura, null);
assert.equal(countQuestionsInResponseJson(null), 0);

// --- TeacherCorrectionProfile schema ---

const sanitized = sanitizeCorrectionProfile({
  tom: "direto",
  rigor: "rigoroso",
  foco: ["clareza"],
  exemplosFeedback: ["a".repeat(400)],
  updatedAt: "2026-01-01T00:00:00.000Z",
});
assert.equal(sanitized.tom, "direto");
assert.equal(sanitized.rigor, "rigoroso");
assert.equal(sanitized.exemplosFeedback[0].length, 280);

const invalid = sanitizeCorrectionProfile({ tom: "invalido", rigor: "x" });
assert.equal(invalid.tom, DEFAULT_CORRECTION_PROFILE.tom);
assert.equal(invalid.rigor, DEFAULT_CORRECTION_PROFILE.rigor);

const local = {
  ...DEFAULT_CORRECTION_PROFILE,
  tom: "direto",
  updatedAt: "2026-06-01T00:00:00.000Z",
};
const remote = {
  ...DEFAULT_CORRECTION_PROFILE,
  tom: "detalhado",
  updatedAt: "2026-06-02T00:00:00.000Z",
};
const merged = mergeCorrectionProfiles(local, remote);
assert.equal(merged.tom, "detalhado");

const mergedLocalWins = mergeCorrectionProfiles(remote, local);
assert.equal(mergedLocalWins.tom, "detalhado");

console.log("verify:sprint2 OK — normalizeMaterialEstrutura + correction profile");
