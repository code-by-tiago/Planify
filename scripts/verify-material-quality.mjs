/**
 * Smoke tests for discipline seeds and quality scoring (no live API).
 * Run: node scripts/verify-material-quality.mjs
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

const { resolveDisciplineTopicGuidance } = loadTsModule(
  "src/lib/materiais/discipline-topic-seeds.ts",
);
const { computeQualityScore, describeQualityScore } = loadTsModule(
  "src/lib/materiais/material-quality-score.ts",
);
const {
  computePlanningQualityScore,
  getPlanningOutputIssues,
} = loadTsModule("src/server/planejamentos/planning-quality.ts");

function testCraseSeed() {
  const guidance = resolveDisciplineTopicGuidance({
    tema: "Uso da crase",
    componenteCurricular: "Língua Portuguesa",
  });

  assert.ok(guidance, "crase + LP deve resolver um seed");
  assert.equal(guidance.seedId, "lp-crase");
  assert.match(guidance.promptBlock, /crase/i);
  assert.match(guidance.promptBlock, /locução adverbial/i);
}

function testExpandedSeeds() {
  const cases = [
    {
      tema: "Regência do verbo transitivo",
      componente: "Língua Portuguesa",
      seedId: "lp-regencia",
    },
    {
      tema: "Coesão referencial",
      componente: "Língua Portuguesa",
      seedId: "lp-coesao",
    },
    {
      tema: "Funções afim e gráfico cartesiano",
      componente: "Matemática",
      seedId: "mat-funcoes",
    },
    {
      tema: "Área do triângulo retângulo",
      componente: "Matemática",
      seedId: "mat-geometria",
    },
    {
      tema: "Fotossíntese",
      componente: "Ciências",
      seedId: "ciencias-fotossintese",
    },
    {
      tema: "Revolução Industrial",
      componente: "História",
      seedId: "historia-revolucao-industrial",
    },
  ];

  for (const item of cases) {
    const guidance = resolveDisciplineTopicGuidance({
      tema: item.tema,
      componenteCurricular: item.componente,
    });
    assert.ok(guidance, `${item.seedId} deve casar com ${item.tema}`);
    assert.equal(guidance.seedId, item.seedId);
  }
}

function testQualityScore() {
  assert.equal(computeQualityScore([]), 100);

  const genericIssues = [
    "Enunciado genérico: explique o conteúdo estudado.",
    "Enunciado não referencia o tema crase.",
    "Gabarito/resposta esperada vago ou genérico.",
    "Alternativas fracas ou genéricas.",
  ];

  const score = computeQualityScore(genericIssues);
  assert.ok(score < 70, `score genérico deve ser < 70, recebido ${score}`);

  const meta = describeQualityScore(score);
  assert.ok(["Regular", "Precisa melhorar"].includes(meta.label));
}

function testPlanningQuality() {
  const issues = getPlanningOutputIssues(
    {
      tipoPlanejamento: "anual",
      conteudos: "Crase\nInterpretação de texto",
      habilidadesSelecionadas: [{ codigo: "EF09LP01", descricao: "Teste" }],
    },
    [],
  );

  assert.ok(issues.length > 0, "matriz vazia deve gerar issues de planejamento");

  const planningScore = computePlanningQualityScore(issues);
  assert.ok(planningScore < 100);
  assert.equal(computePlanningQualityScore([]), 100);
}

function testDailyQuotaMigrationContract() {
  const migrationPath = join(
    root,
    "supabase/migrations/20260606_daily_deep_generations.sql",
  );
  const servicePath = join(root, "src/server/credits/daily-generation-service.ts");
  const migration = readFileSync(migrationPath, "utf8");
  const service = readFileSync(servicePath, "utf8");

  assert.match(migration, /daily_deep_generations/);
  assert.match(migration, /planify_brazil_today/);

  for (const rpc of [
    "planify_get_deep_generation_usage",
    "planify_consume_deep_generation",
    "planify_refund_deep_generation",
  ]) {
    assert.match(migration, new RegExp(rpc));
    assert.match(service, new RegExp(`"${rpc}"`));
  }
}

function testSeedPromptBlocks() {
  const regencia = resolveDisciplineTopicGuidance({
    tema: "Regência do verbo transitivo",
    componenteCurricular: "Língua Portuguesa",
  });
  assert.ok(regencia);
  assert.equal(regencia.seedId, "lp-regencia");
  assert.match(regencia.promptBlock, /regência/i);

  const fotossintese = resolveDisciplineTopicGuidance({
    tema: "Processo de fotossíntese nas plantas",
    componenteCurricular: "Ciências",
  });
  assert.ok(fotossintese);
  assert.equal(fotossintese.seedId, "ciencias-fotossintese");
  assert.match(fotossintese.promptBlock, /fotossíntese|clorof/i);
}

function main() {
  testCraseSeed();
  testExpandedSeeds();
  testSeedPromptBlocks();
  testQualityScore();
  testPlanningQuality();
  testDailyQuotaMigrationContract();
  console.log(
    "verify-material-quality: OK (seeds, quality score, planning, migration contract)",
  );
}

main();
