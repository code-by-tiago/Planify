/**
 * Verifica parity editor HTML ↔ DOCX oficial e consonância anual↔trimestral.
 * Run: npm run verify:planning-parity
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
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    if (specifier.startsWith("@/")) {
      const resolved = join(root, "src", specifier.slice(2));
      for (const candidate of [`${resolved}.ts`, `${resolved}.tsx`, `${resolved}.js`]) {
        try {
          readFileSync(candidate);
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
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

const HABILIDADES = [
  {
    codigo: "EF05HI01",
    descricao:
      "Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado.",
  },
  {
    codigo: "EF05HI02",
    descricao:
      "Identificar os mecanismos de organização do poder político com vistas à compreensão da ideia de Estado.",
  },
];

const CONTEUDOS_ANUAL = [
  { conteudo: "Povos originários do Brasil", trimestre: 1 },
  { conteudo: "Chegada dos portugueses e primeiros contatos", trimestre: 1 },
  { conteudo: "Colonização e organização do território", trimestre: 2 },
  { conteudo: "Cultura, memória e diversidade", trimestre: 2 },
  { conteudo: "Fontes históricas e registros do passado", trimestre: 3 },
  { conteudo: "Cidadania e participação social", trimestre: 3 },
];

function buildMatrix(items) {
  return items.map((item, index) => ({
    conteudo: item.conteudo,
    trimestre: item.trimestre,
    numeroAula: index + 1,
    periodos: 2,
    aulaInicio: index * 2 + 1,
    aulaFim: index * 2 + 2,
    habilidades: [HABILIDADES[index % HABILIDADES.length]],
    objetivos: `Compreender ${item.conteudo.toLowerCase()} com leitura, análise e socialização.`,
    metodologia:
      "Aula expositiva dialogada, leitura orientada, mapas e registros no caderno.",
    recursos: "Livro didático, quadro, mapas, textos de apoio e caderno.",
    materiais: "Caderno, fichas de atividade e textos de apoio.",
    etapas: "1. Acolhimento.\n2. Investigação.\n3. Socialização.",
    avaliacao: "Participação, resolução das atividades e produção escrita.",
    evidencias: "Registros escritos, mapas preenchidos e participação em grupo.",
  }));
}

const basePayload = {
  escola: "Escola Teste Planify",
  professor: "Professor(a) Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "60 períodos",
};

function assertOfficialHtml(label, html) {
  assert.ok(typeof html === "string" && html.length > 500, `${label}: HTML curto demais`);
  assert.ok(
    html.includes('data-planify-html-source="official-docx"'),
    `${label}: sem marcador official-docx`,
  );
  assert.ok(
    html.includes("planify-planning-official"),
    `${label}: sem classe planify-planning-official`,
  );
  assert.ok(!/<w:[a-z]/i.test(html), `${label}: vazamento OOXML <w:`);
  assert.ok(!/&lt;w:[a-z]/i.test(html), `${label}: vazamento OOXML escapado`);
  assert.ok(
    !html.includes('data-planify-html-source="simplified-fallback"'),
    `${label}: não pode ser simplified-fallback`,
  );
  const tableCount = (html.match(/<table/g) || []).length;
  assert.ok(tableCount >= 2, `${label}: esperava ≥2 tabelas, got ${tableCount}`);
}

function skillKey(skill) {
  return `${String(skill?.codigo || "").trim()}|${String(skill?.descricao || "").trim()}`;
}

function contentFingerprint(items) {
  return items
    .map((item) => ({
      conteudo: String(item.conteudo || "").trim(),
      periodos: Number(item.periodos) || 0,
      skills: (item.habilidades || []).map(skillKey).sort().join(";"),
    }))
    .sort((a, b) => a.conteudo.localeCompare(b.conteudo));
}

function main() {
  for (const name of ["modelo-anual.docx", "modelo-trimestral.docx"]) {
    const path = join(root, "data", "modelos-oficiais", name);
    assert.ok(existsSync(path), `Template oficial ausente: ${path}`);
  }

  const { buildOfficialPlanningEditorHtml } = loadTsModule(
    "src/server/planejamentos/official-planning-editor-html.ts",
  );
  const { buildOfficialPlanningDocx } = loadTsModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );
  const {
    buildTrimestralPlansFromAnnual,
    resolveMatrixForDocument,
  } = loadTsModule("src/lib/planejamentos/planning-trimestral-from-annual.ts");

  const annualMatrix = buildMatrix(CONTEUDOS_ANUAL);
  const planningAnual = {
    tipoPlanejamento: "anual",
    titulo: "Planejamento anual — Formação histórica do Brasil",
    resumo: "Sequência anual de referência para parity.",
    conteudos: annualMatrix,
  };

  const anualHtml = buildOfficialPlanningEditorHtml({
    ...basePayload,
    tipoPlanejamento: "anual",
    matrizPlanejamento: planningAnual,
  }).html;
  assertOfficialHtml("anual", anualHtml);
  assert.ok(anualHtml.includes("1º trimestre"), "anual: falta 1º trimestre");
  assert.ok(anualHtml.includes("EF05HI01"), "anual: falta código BNCC");

  const anualDocx = buildOfficialPlanningDocx({
    ...basePayload,
    tipoPlanejamento: "anual",
    matrizPlanejamento: planningAnual,
  });
  assert.ok(Buffer.isBuffer(anualDocx) && anualDocx.length > 1000, "anual DOCX inválido");

  const trimestralPlans = buildTrimestralPlansFromAnnual(planningAnual, [1, 2, 3]);
  assert.equal(Object.keys(trimestralPlans).length, 3, "deve extrair 3 trimestres");

  const allTrimContents = [];
  for (const trimestre of [1, 2, 3]) {
    const trimPlan = trimestralPlans[trimestre];
    assert.ok(trimPlan?.conteudos?.length, `trim ${trimestre}: sem conteúdos`);

    const resolved = resolveMatrixForDocument({
      tipoPlanejamento: "trimestral",
      trimestre,
      matriz: annualMatrix,
      trimPlanMatrix: trimPlan.conteudos,
    });
    assert.equal(
      resolved.length,
      trimPlan.conteudos.length,
      `trim ${trimestre}: resolveMatrixForDocument divergiu do trimPlan`,
    );

    for (const item of trimPlan.conteudos) {
      allTrimContents.push(item);
      assert.equal(Number(item.trimestre), trimestre, `item deve estar no T${trimestre}`);
      assert.ok(
        annualMatrix.some((a) => a.conteudo === item.conteudo),
        `trim ${trimestre}: conteúdo "${item.conteudo}" não existe no anual`,
      );
      const annualItem = annualMatrix.find((a) => a.conteudo === item.conteudo);
      assert.deepEqual(
        (item.habilidades || []).map(skillKey).sort(),
        (annualItem.habilidades || []).map(skillKey).sort(),
        `trim ${trimestre}: habilidades divergem do anual para "${item.conteudo}"`,
      );
    }

    const trimHtml = buildOfficialPlanningEditorHtml(
      {
        ...basePayload,
        tipoPlanejamento: "trimestral",
        trimestre,
        cargaHoraria: `${trimPlan.conteudos.reduce((s, i) => s + (Number(i.periodos) || 0), 0)} períodos`,
        matrizPlanejamento: trimPlan,
      },
      {
        documentType: "planejamento:trimestral",
        documentId: `plan_parity_trim${trimestre}`,
      },
    ).html;

    assertOfficialHtml(`trimestral-T${trimestre}`, trimHtml);
    assert.ok(
      trimHtml.includes(trimPlan.conteudos[0].conteudo),
      `trim ${trimestre}: conteúdo principal ausente no HTML`,
    );
    assert.ok(trimHtml.includes("EF05HI"), `trim ${trimestre}: BNCC ausente no HTML`);
  }

  const annualFp = contentFingerprint(annualMatrix);
  const trimFp = contentFingerprint(allTrimContents);
  assert.deepEqual(
    trimFp.map((x) => x.conteudo).sort(),
    annualFp.map((x) => x.conteudo).sort(),
    "união dos trimestrais deve cobrir todos os conteúdos do anual",
  );

  const annualPeriodos = annualMatrix.reduce((s, i) => s + (Number(i.periodos) || 0), 0);
  const trimPeriodos = allTrimContents.reduce((s, i) => s + (Number(i.periodos) || 0), 0);
  assert.equal(
    trimPeriodos,
    annualPeriodos,
    `periodos trimestrais (${trimPeriodos}) ≠ anual (${annualPeriodos})`,
  );

  console.log(
    "verify-planning-parity: templates OK · anual+3 trimestrais official-docx · consonância OK",
  );
}

main();
