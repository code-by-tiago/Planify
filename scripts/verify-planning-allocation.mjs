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
    aulaInicio: index * Math.max(1, periodos) + 1,
    aulaFim: (index + 1) * Math.max(1, periodos),
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

function assertOneLessonPerContent(items, expectedContents, label) {
  assert.deepEqual(
    items.map((item) => item.conteudo),
    expectedContents,
    `${label}: conteudos divergem do input`,
  );
  assert.equal(matrixPeriodsTotal(items), expectedContents.length);

  items.forEach((item, index) => {
    assert.equal(item.numeroAula, index + 1, `${label}: numeroAula incorreto`);
    assert.equal(item.periodos, 1, `${label}: periodos deve ser 1`);
    assert.equal(item.aulaInicio, index + 1, `${label}: aulaInicio incorreto`);
    assert.equal(item.aulaFim, index + 1, `${label}: aulaFim incorreto`);
  });
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

console.log("verify-planning-allocation: contrato uma aula por conteudo");

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
assertOneLessonPerContent(finalizedMedio, conteudosMedio, "anual EM");
assertAnnualTrimestres(finalizedMedio, "anual EM");
console.log("OK: anual deduplica, remove extras e preserva a ordem do input");

const reversed = [...conteudosMedio]
  .reverse()
  .map((conteudo, index) => makeMatrixItem(conteudo, 8, index, 1));
const reordered = finalizeMatrixLessonAllocation(reversed, payloadMedio);
assertOneLessonPerContent(reordered, conteudosMedio, "ordem canonica");
console.log("OK: ordem do professor e fonte da verdade");

const payloadTrimestral = {
  ...payloadMedio,
  tipoPlanejamento: "trimestral",
  trimestre: 2,
  conteudos: conteudosMedio.slice(0, 3).join("\n"),
};
const trimestral = finalizeMatrixLessonAllocation(
  conteudosMedio.slice(0, 3).map((conteudo, index) => makeMatrixItem(conteudo, 10, index, 1)),
  payloadTrimestral,
);
assertOneLessonPerContent(trimestral, conteudosMedio.slice(0, 3), "trimestral");
assert.deepEqual(
  [...new Set(trimestral.map((item) => item.trimestre))],
  [2],
  "trimestral deve manter o trimestre selecionado",
);
console.log("OK: trimestral renumera dentro do trimestre selecionado");

const rebalanced = rebalanceMatrixPeriods(
  [
    makeMatrixItem("Conteudo A", 25, 0),
    makeMatrixItem("Conteudo B", 25, 1),
    makeMatrixItem("Conteudo C", 25, 2),
  ],
  80,
  "anual",
);
assertOneLessonPerContent(
  rebalanced,
  ["Conteudo A", "Conteudo B", "Conteudo C"],
  "rebalance",
);
assertAnnualTrimestres(rebalanced, "rebalance");
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
  rawIssues.some((issue) => /exatamente uma aula|repetidos|fora do contrato/i.test(issue)),
  `esperados issues de contrato, recebido: ${rawIssues.join("; ")}`,
);

const fixedIssues = getPlanningOutputIssues(payloadMedio, finalizedMedio);
const contractIssues = fixedIssues.filter((issue) =>
  /exatamente uma aula|repetidos|fora do contrato/i.test(issue),
);
assert.deepEqual(
  contractIssues,
  [],
  `matriz finalizada ainda tem issues de contrato: ${contractIssues.join("; ")}`,
);
console.log("OK: planning-quality detecta repeticao e absolve matriz corrigida");

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
  plan.conteudos.forEach((item, index) => {
    assert.equal(item.periodos, 1, `${trimestre}o trimestre: periodos deve ser 1`);
    assert.equal(item.numeroAula, index + 1, `${trimestre}o trimestre: numeroAula sequencial`);
  });
}
console.log("OK: trimestrais extraidos do anual mantem consonancia total");

console.log("\nTodos os testes de alocacao de planejamento passaram.");
