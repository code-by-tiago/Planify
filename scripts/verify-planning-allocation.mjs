/**
 * Smoke tests for official period distribution in planejamentos.
 * Run: npm run verify:planning-allocation
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
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
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

const {
  finalizeMatrixLessonAllocation,
  matrixPeriodsTotal,
  rebalanceMatrixPeriods,
} = loadTsModule("src/server/planejamentos/planning-lesson-allocation.ts");
const {
  assessDistributionCoarseness,
  computeIdealRowCount,
  OFFICIAL_MAX_PERIODS_PER_ROW,
  OFFICIAL_PERIODS_PER_EXPERIENCE,
} = loadTsModule("src/server/planejamentos/planning-official-contract.ts");
const { validatePlanningPayload } = loadTsModule(
  "src/server/planejamentos/planning-validation.ts",
);
const { getPlanningOutputIssues } = loadTsModule(
  "src/server/planejamentos/planning-quality.ts",
);

function makeMatrixItem(conteudo, periodos, index = 0) {
  return {
    conteudo,
    trimestre: 1,
    numeroAula: index + 1,
    periodos,
    aulaInicio: 0,
    aulaFim: 0,
    habilidades: [{ codigo: "EM13LP01", descricao: "Habilidade de teste" }],
    objetivos: `Objetivos específicos sobre ${conteudo} com estratégias mensuráveis.`,
    metodologia: `Metodologia ativa para ${conteudo}: debate, leitura orientada e produção.`,
    materiais: "Caderno e fichas",
    recursos: "Quadro e projetor",
    etapas: "Contextualização, prática e síntese",
    avaliacao: "Avaliação formativa por registros e participação",
    evidencias: "Registros escritos e produções",
  };
}

function assertOfficialDistribution(items, carga) {
  const total = matrixPeriodsTotal(items);
  assert.equal(total, carga, `soma de períodos deve ser ${carga}, recebido ${total}`);

  for (const item of items) {
    assert.ok(item.periodos > 0, "cada linha deve ter periodos > 0");
    assert.ok(
      item.periodos <= OFFICIAL_MAX_PERIODS_PER_ROW,
      `linha "${item.conteudo}" excede máximo (${item.periodos} > ${OFFICIAL_MAX_PERIODS_PER_ROW})`,
    );
  }

  const distribution = assessDistributionCoarseness(items, carga);
  assert.equal(
    distribution.coarse,
    false,
    `distribuição ainda grosseira: ${items.length} linhas, ideal ~${distribution.idealRowCount}`,
  );
}

console.log("verify-planning-allocation: contrato oficial");

assert.equal(OFFICIAL_PERIODS_PER_EXPERIENCE, 2);
assert.equal(OFFICIAL_MAX_PERIODS_PER_ROW, 4);
assert.equal(computeIdealRowCount(80), 40);
assert.equal(computeIdealRowCount(60), 30);

console.log("OK: constantes e computeIdealRowCount");

const conteudosMedio = [
  "Tipos de texto: descrição e narração",
  "Estrutura dissertativa-argumentativa",
  "Competências do ENEM: norma padrão",
  "Repertório sociocultural em argumentos",
];

const coarseMedio = conteudosMedio.map((conteudo, index) =>
  makeMatrixItem(conteudo, 20, index),
);

const payloadMedio = {
  tipoPlanejamento: "anual",
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  componenteCurricular: "Língua Portuguesa",
  cargaHoraria: "80 períodos",
  conteudos: conteudosMedio.join("\n"),
  habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
};

const finalizedMedio = finalizeMatrixLessonAllocation(coarseMedio, payloadMedio);
assertOfficialDistribution(finalizedMedio, 80);
assert.ok(
  finalizedMedio.length >= 20,
  `esperadas muitas linhas para 80 períodos, recebido ${finalizedMedio.length}`,
);
assert.ok(
  finalizedMedio.every((item) => item.periodos <= 4),
  "nenhuma linha deve ter mais de 4 períodos após finalize",
);

console.log(
  `OK: médio 4 conteúdos / 80 períodos → ${finalizedMedio.length} experiências (max ${Math.max(...finalizedMedio.map((i) => i.periodos))} períodos/linha)`,
);

const conteudosOficial = Array.from({ length: 6 }, (_, index) => `Conteúdo ${index + 1}`);
const coarseOficial = conteudosOficial.map((conteudo, index) =>
  makeMatrixItem(conteudo, 10, index),
);

const payloadOficial = {
  tipoPlanejamento: "anual",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  cargaHoraria: "60",
  conteudos: conteudosOficial.join("\n"),
  habilidadesSelecionadas: [{ codigo: "EF05HI01", descricao: "Habilidade" }],
};

const finalizedOficial = finalizeMatrixLessonAllocation(coarseOficial, payloadOficial);
assertOfficialDistribution(finalizedOficial, 60);

console.log(
  `OK: padrão oficial 6 conteúdos / 60 períodos → ${finalizedOficial.length} experiências`,
);

const rebalanceBugInput = [
  makeMatrixItem("Conteúdo A", 25, 0),
  makeMatrixItem("Conteúdo B", 25, 1),
  makeMatrixItem("Conteúdo C", 25, 2),
  makeMatrixItem("Conteúdo D", 5, 3),
];

const rebalanced = rebalanceMatrixPeriods(rebalanceBugInput, 80, "anual");
assertOfficialDistribution(rebalanced, 80);
assert.notEqual(
  rebalanced[0].periodos,
  25,
  "rebalanceMatrixPeriods não deve preservar 25 períodos por linha",
);

console.log("OK: rebalanceMatrixPeriods corrige bug de preservação cega da IA");

assert.equal(
  validatePlanningPayload({
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "",
    conteudos: "Tema A",
    habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
  }),
  "Informe a carga horária em períodos (ex.: 80 períodos).",
);

assert.equal(
  validatePlanningPayload({
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "80 períodos",
    conteudos: "Tema A",
    habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
  }),
  null,
);

console.log("OK: validatePlanningPayload exige cargaHoraria parseável");

const qualityIssues = getPlanningOutputIssues(payloadMedio, coarseMedio);
assert.ok(
  qualityIssues.some((issue) => /distribui[cç][aã]o grosseira|mais de 4 per[ií]odos/i.test(issue)),
  `esperados issues de distribuição grosseira, recebido: ${qualityIssues.join("; ")}`,
);

const qualityIssuesAfter = getPlanningOutputIssues(payloadMedio, finalizedMedio);
const distributionIssues = qualityIssuesAfter.filter(
  (issue) =>
    /distribui[cç][aã]o grosseira|mais de 4 per[ií]odos/i.test(issue),
);
assert.equal(
  distributionIssues.length,
  0,
  `matriz finalizada não deve ter issues de distribuição: ${distributionIssues.join("; ")}`,
);

console.log("OK: planning-quality detecta e absolve distribuição corrigida");

console.log("\nTodos os testes de alocação de planejamento passaram.");
