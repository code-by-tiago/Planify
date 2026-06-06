/**
 * Deploy-gate smoke suite: seeds, routing, quality scores, migration contract.
 * No live API calls. Run: npm run verify:material-quality
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

const { MATERIAL_ENGINE_TYPES } = loadTsModule(
  "src/server/materials/material-engine-types.ts",
);
const {
  DEEP_GENERATION_TYPES,
  LIGHT_GENERATION_TYPES,
  PLANNING_DEEP_GENERATION_TYPE,
  isDeepGenerationType,
  getModelTierForMaterialType,
} = loadTsModule("src/lib/ai/material-generation-policy.ts");
const { resolveDisciplineTopicGuidance } = loadTsModule(
  "src/lib/materiais/discipline-topic-seeds.ts",
);
const {
  computeQualityScore,
  describeQualityScore,
  buildElevateQualityObservacoes,
} = loadTsModule("src/lib/materiais/material-quality-score.ts");
const {
  computePlanningQualityScore,
  getPlanningOutputIssues,
  buildPlanningQualityRetryNote,
} = loadTsModule("src/server/planejamentos/planning-quality.ts");

const DISCIPLINE_SEED_CASES = [
  {
    tema: "Uso da crase",
    componente: "Língua Portuguesa",
    seedId: "lp-crase",
    pattern: /crase/i,
  },
  {
    tema: "Regência do verbo transitivo",
    componente: "Língua Portuguesa",
    seedId: "lp-regencia",
    pattern: /regência/i,
  },
  {
    tema: "Coesão referencial e anáfora",
    componente: "Língua Portuguesa",
    seedId: "lp-coesao",
    pattern: /coesão|coesao/i,
  },
  {
    tema: "Interpretação de texto literário",
    componente: "Língua Portuguesa",
    seedId: "lp-interpretacao",
    pattern: /interpret/i,
  },
  {
    tema: "Operações com frações equivalentes",
    componente: "Matemática",
    seedId: "mat-fracoes",
    pattern: /fraç/i,
  },
  {
    tema: "Equações do 1º grau",
    componente: "Matemática",
    seedId: "mat-equacoes",
    pattern: /equaç/i,
  },
  {
    tema: "Porcentagem e juros simples",
    componente: "Matemática",
    seedId: "mat-porcentagem",
    pattern: /porcent/i,
  },
  {
    tema: "Teorema de Pitágoras no triângulo retângulo",
    componente: "Matemática",
    seedId: "mat-geometria",
    pattern: /Pitágoras|pitagor|geometria/i,
  },
  {
    tema: "Processo de fotossíntese nas plantas",
    componente: "Ciências",
    seedId: "ciencias-fotossintese",
    pattern: /fotossíntese|clorof/i,
  },
  {
    tema: "Revolução Industrial na Inglaterra",
    componente: "História",
    seedId: "historia-revolucao-industrial",
    pattern: /Revolução Industrial|industrial/i,
  },
];

function runTest(name, fn) {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`verify-material-quality FAIL [${name}]: ${message}`);
    process.exit(1);
  }
}

function testMaterialEngineTypesCatalog() {
  assert.equal(
    MATERIAL_ENGINE_TYPES.length,
    13,
    "MATERIAL_ENGINE_TYPES deve listar 13 tipos",
  );
  assert.deepEqual(
    [...new Set(MATERIAL_ENGINE_TYPES)].length,
    MATERIAL_ENGINE_TYPES.length,
    "tipos duplicados em MATERIAL_ENGINE_TYPES",
  );
}

function testMaterialTypeRouting() {
  const deepSet = new Set(DEEP_GENERATION_TYPES);
  const lightSet = new Set(LIGHT_GENERATION_TYPES);

  for (const deepType of DEEP_GENERATION_TYPES) {
    assert.ok(!lightSet.has(deepType), `${deepType} não pode ser deep e light`);
  }

  for (const tipo of MATERIAL_ENGINE_TYPES) {
    const deep = isDeepGenerationType(tipo);
    const tier = getModelTierForMaterialType(tipo);

    if (deepSet.has(tipo)) {
      assert.equal(deep, true, `${tipo} deve rotear como geração profunda (Pro)`);
      assert.equal(tier, "advanced", `${tipo} deve usar tier advanced`);
      continue;
    }

    if (lightSet.has(tipo)) {
      assert.equal(deep, false, `${tipo} deve rotear como geração leve (Flash)`);
      assert.equal(tier, "default", `${tipo} deve usar tier default`);
      continue;
    }

    assert.fail(`${tipo} não está em DEEP_GENERATION_TYPES nem LIGHT_GENERATION_TYPES`);
  }

  assert.equal(
    DEEP_GENERATION_TYPES.length + LIGHT_GENERATION_TYPES.length,
    MATERIAL_ENGINE_TYPES.length,
    "deep + light deve cobrir todos os 13 tipos",
  );

  assert.equal(isDeepGenerationType(PLANNING_DEEP_GENERATION_TYPE), true);
  assert.equal(isDeepGenerationType("planejamento-anual"), true);
  assert.equal(isDeepGenerationType("planejamento-trimestral"), true);
  assert.equal(isDeepGenerationType("flashcards"), false);
  assert.equal(isDeepGenerationType("prova"), true);
}

function testDisciplineSeeds() {
  for (const item of DISCIPLINE_SEED_CASES) {
    const guidance = resolveDisciplineTopicGuidance({
      tema: item.tema,
      componenteCurricular: item.componente,
    });

    assert.ok(guidance, `${item.seedId}: nenhum seed para "${item.tema}"`);
    assert.equal(
      guidance.seedId,
      item.seedId,
      `${item.tema}: esperado ${item.seedId}, recebido ${guidance.seedId}`,
    );
    assert.ok(
      guidance.promptBlock?.trim().length > 40,
      `${item.seedId}: promptBlock vazio ou curto demais`,
    );

    if (item.pattern) {
      assert.match(
        guidance.promptBlock,
        item.pattern,
        `${item.seedId}: promptBlock não contém termo esperado`,
      );
    }
  }
}

function testQualityScore() {
  assert.equal(computeQualityScore([]), 100);
  assert.equal(describeQualityScore(100).label, "Excelente");

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

  const retryNote = buildPlanningQualityRetryNote(issues.slice(0, 2));
  assert.match(retryNote, /CORREÇÃO OBRIGATÓRIA/);
  assert.ok(retryNote.includes(issues[0]), "retry note deve citar o primeiro issue");

  const elevateNote = buildElevateQualityObservacoes([
    "Metodologia genérica repetida em todas as linhas.",
  ]);
  assert.match(elevateNote, /MODO ELEVAR QUALIDADE/);
  assert.match(elevateNote, /Metodologia genérica/);
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

function testGenerationEventsMigrationContract() {
  const migrationPath = join(
    root,
    "supabase/migrations/20260607_generation_events.sql",
  );
  const telemetryPath = join(root, "src/server/telemetry/generation-telemetry.ts");
  const migration = readFileSync(migrationPath, "utf8");
  const telemetry = readFileSync(telemetryPath, "utf8");

  assert.match(migration, /generation_events/);
  assert.match(migration, /quality_score_bucket/);
  assert.match(telemetry, /generation_events/);
  assert.match(telemetry, /elevar_qualidade/);
}

function main() {
  const started = Date.now();

  runTest("material-engine-types", testMaterialEngineTypesCatalog);
  runTest("material-type-routing", testMaterialTypeRouting);
  runTest("discipline-seeds", testDisciplineSeeds);
  runTest("quality-score", testQualityScore);
  runTest("planning-quality", testPlanningQuality);
  runTest("daily-quota-migration", testDailyQuotaMigrationContract);
  runTest("generation-events-migration", testGenerationEventsMigrationContract);

  const elapsedMs = Date.now() - started;
  console.log(
    `verify-material-quality: OK (${MATERIAL_ENGINE_TYPES.length} tipos, ${DISCIPLINE_SEED_CASES.length} seeds, planning, migration) — ${elapsedMs}ms`,
  );
}

main();
