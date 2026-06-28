/**
 * Smoke tests for planejamento fill rules.
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
const { OFFICIAL_MAX_PERIODS_PER_ROW } = loadTsModule(
  "src/server/planejamentos/planning-official-contract.ts",
);
const { validatePlanningPayload } = loadTsModule(
  "src/server/planejamentos/planning-validation.ts",
);
const { getPlanningOutputIssues } = loadTsModule(
  "src/server/planejamentos/planning-quality.ts",
);
const { buildTrimestralPlansFromAnnual } = loadTsModule(
  "src/lib/planejamentos/planning-trimestral-from-annual.ts",
);

function makeMatrixItem(conteudo, periodos, index = 0, trimestre = 1) {
  return {
    conteudo,
    trimestre,
    numeroAula: index + 1,
    periodos,
    aulaInicio: 0,
    aulaFim: 0,
    habilidades: [{ codigo: "EM13LP01", descricao: "Habilidade de teste" }],
    objetivos: `Objetivos especificos sobre ${conteudo} com estrategias mensuraveis.`,
    metodologia: `Metodologia ativa para ${conteudo}: debate, leitura orientada e producao.`,
    materiais: "Caderno e fichas",
    recursos: "Quadro e projetor",
    etapas: "Contextualizacao, pratica e sintese",
    avaliacao: "Avaliacao formativa por registros e participacao",
    evidencias: "Registros escritos e producoes",
  };
}

function assertOfficialMatrix(items, expectedContents, carga, label) {
  assert.deepEqual(
    items.map((item) => item.conteudo),
    expectedContents,
    `${label}: conteudos divergem do input`,
  );
  assert.equal(
    matrixPeriodsTotal(items),
    carga,
    `${label}: soma de periodos deve ser ${carga}`,
  );

  const rowMax = Math.max(
    OFFICIAL_MAX_PERIODS_PER_ROW,
    Math.ceil(carga / Math.max(1, items.length)),
  );

  for (const item of items) {
    assert.ok(item.periodos >= 1, `${label}: periodos >= 1`);
    assert.ok(
      item.periodos <= rowMax,
      `${label}: periodos ${item.periodos} <= ${rowMax}`,
    );
    assert.equal(
      item.aulaFim - item.aulaInicio + 1,
      item.periodos,
      `${label}: faixa aula inconsistente`,
    );
  }

  const trimesterCounters = new Map();
  for (const item of items) {
    const next = (trimesterCounters.get(item.trimestre) || 0) + 1;
    trimesterCounters.set(item.trimestre, next);
    assert.equal(item.numeroAula, next, `${label}: numeroAula por trimestre`);
  }
}

function assertAnnualTrimestres(items, label) {
  if (items.length < 3) return;

  const trimestres = new Set(items.map((item) => item.trimestre));
  for (const trimestre of [1, 2, 3]) {
    assert.ok(
      trimestres.has(trimestre),
      `${label}: trimestre ${trimestre} ausente (${[...trimestres].sort().join(", ")})`,
    );
  }
}

console.log("verify-planning-allocation: contrato oficial (1 linha/conteudo + periodos variaveis)");

const conteudosMedio = [
  "Tipos de texto: descricao e narracao",
  "Estrutura dissertativa-argumentativa",
  "Competencias do ENEM: norma padrao",
  "Repertorio sociocultural em argumentos",
  "Producao e revisao de textos",
  "Analise de propostas de intervencao",
];

const payloadMedio = {
  tipoPlanejamento: "anual",
  etapa: "Ensino Medio",
  anoSerie: "3a serie",
  componenteCurricular: "Lingua Portuguesa",
  cargaHoraria: "80 periodos",
  conteudos: conteudosMedio.join("\n"),
  habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
};

const aiCoarseAndDuplicated = [
  makeMatrixItem("Figuras de Linguagem", 2, 0, 1),
  makeMatrixItem("Figuras de Linguagem - parte 2", 3, 1, 1),
  ...conteudosMedio.map((conteudo, index) =>
    makeMatrixItem(conteudo, index % 2 === 0 ? 4 : 2, index + 2, 1),
  ),
  makeMatrixItem("Conteudo extra que a IA inventou", 2, 99, 3),
];

const finalizedMedio = finalizeMatrixLessonAllocation(
  aiCoarseAndDuplicated,
  payloadMedio,
);
assertOfficialMatrix(finalizedMedio, conteudosMedio, 80, "anual EM 80p");
assertAnnualTrimestres(finalizedMedio, "anual EM");
assert.ok(
  finalizedMedio.some((item) => item.periodos > 1),
  "anual EM: deve haver linhas com mais de 1 periodo",
);
console.log(
  `OK: anual deduplica, distribui ${matrixPeriodsTotal(finalizedMedio)} periodos, max ${Math.max(...finalizedMedio.map((i) => i.periodos))}/linha`,
);

const payload120 = { ...payloadMedio, cargaHoraria: "120 periodos" };
const finalized120 = finalizeMatrixLessonAllocation(
  conteudosMedio.map((c) => makeMatrixItem(c, 1, 0)),
  payload120,
);
assertOfficialMatrix(finalized120, conteudosMedio, 120, "anual 120p");
console.log("OK: 6 conteudos / 120 periodos soma correta");

const reversed = [...conteudosMedio]
  .reverse()
  .map((conteudo, index) => makeMatrixItem(conteudo, 8, index, 1));
const reordered = finalizeMatrixLessonAllocation(reversed, payloadMedio);
assertOfficialMatrix(reordered, conteudosMedio, 80, "ordem canonica");
console.log("OK: ordem do professor e fonte da verdade");

const payloadTrimestral = {
  ...payloadMedio,
  tipoPlanejamento: "trimestral",
  trimestre: 2,
  cargaHoraria: "30 periodos",
  conteudos: conteudosMedio.slice(0, 3).join("\n"),
};
const trimestral = finalizeMatrixLessonAllocation(
  conteudosMedio.slice(0, 3).map((conteudo, index) => makeMatrixItem(conteudo, 1, index, 2)),
  payloadTrimestral,
);
assertOfficialMatrix(trimestral, conteudosMedio.slice(0, 3), 30, "trimestral");
assert.deepEqual(
  [...new Set(trimestral.map((item) => item.trimestre))],
  [2],
  "trimestral deve manter o trimestre selecionado",
);
console.log("OK: trimestral distribui periodos dentro do trimestre selecionado");

const rebalanced = rebalanceMatrixPeriods(
  [
    makeMatrixItem("Conteudo A", 0, 0),
    makeMatrixItem("Conteudo B", 0, 1),
    makeMatrixItem("Conteudo C", 0, 2),
  ],
  80,
  "anual",
);
assertOfficialMatrix(
  rebalanced,
  ["Conteudo A", "Conteudo B", "Conteudo C"],
  80,
  "rebalance",
);
assert.equal(rebalanced.length, 3, "rebalance nao duplica conteudo");
console.log("OK: rebalanceMatrixPeriods nao expande conteudo");

assert.match(
  validatePlanningPayload({
    etapa: "Ensino Medio",
    anoSerie: "3a serie",
    componenteCurricular: "Lingua Portuguesa",
    cargaHoraria: "",
    conteudos: "Tema A",
    habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
  }),
  /carga/i,
);

assert.equal(
  validatePlanningPayload({
    etapa: "Ensino Medio",
    anoSerie: "3a serie",
    componenteCurricular: "Lingua Portuguesa",
    cargaHoraria: "80 periodos",
    conteudos: "Tema A",
    habilidadesSelecionadas: [{ codigo: "EM13LP01", descricao: "Habilidade" }],
  }),
  null,
);
console.log("OK: validatePlanningPayload exige cargaHoraria parseavel");

const rawIssues = getPlanningOutputIssues(payloadMedio, aiCoarseAndDuplicated);
assert.ok(
  rawIssues.some((issue) => /repetidos|soma de periodos|uma linha/i.test(issue)),
  `esperados issues de contrato, recebido: ${rawIssues.join("; ")}`,
);

const fixedIssues = getPlanningOutputIssues(payloadMedio, finalizedMedio);
const contractIssues = fixedIssues.filter((issue) =>
  /repetidos|soma de periodos|uma linha|numeroAula|periodos fora/i.test(issue),
);
assert.deepEqual(
  contractIssues,
  [],
  `matriz finalizada ainda tem issues de contrato: ${contractIssues.join("; ")}`,
);
console.log("OK: planning-quality detecta violacoes e absolve matriz corrigida");

const annualForTrimestral = {
  titulo: "Planejamento anual de teste",
  resumo: "Matriz anual para consonancia trimestral.",
  conteudos: finalizedMedio,
};
const trimestraisFromAnnual = buildTrimestralPlansFromAnnual(annualForTrimestral, [1, 2, 3]);
for (const trimestre of [1, 2, 3]) {
  const plan = trimestraisFromAnnual[trimestre];
  const expected = finalizedMedio.filter((item) => item.trimestre === trimestre);
  assert.ok(plan, `${trimestre}o trimestre ausente na extracao do anual`);
  assert.deepEqual(
    plan.conteudos.map((item) => item.conteudo),
    expected.map((item) => item.conteudo),
    `${trimestre}o trimestre divergiu dos conteudos do anual`,
  );
  assert.equal(
    matrixPeriodsTotal(plan.conteudos),
    matrixPeriodsTotal(expected),
    `${trimestre}o trimestre divergiu na carga horaria`,
  );
}
console.log("OK: trimestrais extraidos do anual mantem consonancia total");

console.log("\nTodos os testes de alocacao de planejamento passaram.");
