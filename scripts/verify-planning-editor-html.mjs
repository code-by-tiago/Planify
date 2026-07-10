/**
 * Verifica HTML oficial do editor de planejamentos (anual + trimestral).
 * Run: npm run verify:planning-editor-html
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

function buildMatrix(conteudos, trimestre = 1) {
  return conteudos.map((conteudo, index) => ({
    conteudo,
    trimestre,
    numeroAula: index + 1,
    periodos: 1,
    aulaInicio: index + 1,
    aulaFim: index + 1,
    habilidades: [HABILIDADES[index % HABILIDADES.length]],
    objetivos: `Compreender ${conteudo.toLowerCase()} com leitura, análise e socialização em sala.`,
    metodologia:
      "Aula expositiva dialogada, leitura orientada, mapas e registros no caderno com mediação do professor.",
    recursos: "Livro didático, quadro, mapas, textos de apoio e caderno do estudante.",
    materiais: "Caderno, fichas de atividade e textos de apoio.",
    etapas: "1. Acolhimento.\n2. Investigação.\n3. Socialização.",
    avaliacao: "Participação, resolução das atividades e produção escrita com critérios claros.",
    evidencias: "Registros escritos, mapas preenchidos e participação nas discussões em grupo.",
  }));
}

const CONTEUDOS_ANUAL = [
  "Povos originários do Brasil",
  "Chegada dos portugueses e primeiros contatos",
  "Colonização e organização do território",
  "Cultura, memória e diversidade",
  "Fontes históricas e registros do passado",
  "Cidadania e participação social",
];

const basePayload = {
  escola: "Escola Teste Planify",
  professor: "Professor(a) Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "60 aulas",
};

function assertOfficialHtml(label, html, expectedLabels, forbiddenMarkers = []) {
  assert.ok(typeof html === "string" && html.length > 500, `${label}: HTML curto demais`);
  assert.ok(
    html.includes('data-planify-html-source="official-docx"') ||
      html.includes('data-planify-html-source="official-template"'),
    `${label}: sem marcador oficial`,
  );
  assert.ok(
    html.includes("planify-planning-official"),
    `${label}: sem classe planify-planning-official`,
  );
  assert.ok(!/<w:[a-z]/i.test(html), `${label}: HTML contém vazamento OOXML`);

  for (const expected of expectedLabels) {
    assert.ok(html.includes(expected), `${label}: rótulo oficial ausente (${expected})`);
  }

  for (const forbidden of forbiddenMarkers) {
    assert.ok(!html.includes(forbidden), `${label}: marcador simplificado encontrado (${forbidden})`);
  }
}

function main() {
  const { buildOfficialPlanningEditorHtml } = loadTsModule(
    "src/server/planejamentos/official-planning-editor-html.ts",
  );
  const { buildPlanningEditorHtml } = loadTsModule(
    "src/lib/planejamentos/planning-editor-html.ts",
  );

  const planningAnual = {
    tipoPlanejamento: "anual",
    titulo: "Planejamento anual — Formação histórica do Brasil",
    resumo: "Sequência anual.",
    conteudos: buildMatrix(CONTEUDOS_ANUAL, 1),
  };

  const anualHtml = buildOfficialPlanningEditorHtml({
    ...basePayload,
    tipoPlanejamento: "anual",
    matrizPlanejamento: planningAnual,
  }).html;

  assertOfficialHtml(
    "anual",
    anualHtml,
    [
      "Unidade Temática",
      "Objetos de",
      "Previsão de carga horária",
      "Aula nº",
      "1º trimestre",
      "Projetos interdisciplinares",
      "Instrumentos de avaliação",
    ],
    ["PLANEJAMENTO ANUAL", 'data-planify-html-source="simplified-fallback"'],
  );

  const CONTEUDOS_TRIMESTRAL = CONTEUDOS_ANUAL.slice(0, 3);
  const planningTrimestral = {
    tipoPlanejamento: "trimestral",
    titulo: "Planejamento trimestral — 1º trimestre",
    resumo: "Sequência trimestral.",
    conteudos: buildMatrix(CONTEUDOS_TRIMESTRAL, 1),
  };

  const trimestralHtml = buildOfficialPlanningEditorHtml({
    ...basePayload,
    tipoPlanejamento: "trimestral",
    trimestre: 1,
    matrizPlanejamento: planningTrimestral,
  }).html;

  assertOfficialHtml(
    "trimestral",
    trimestralHtml,
    [
      "Metodologia",
      "Materiais e recursos necessários",
      "Etapas dessa experiência",
      "Evidências de aprendizagem",
      "Instrumentos de avaliação",
      "Expectativas de aprendizagem",
    ],
    ["PLANEJAMENTO TRIMESTRAL", 'data-planify-html-source="simplified-fallback"'],
  );

  const simplifiedHtml = buildPlanningEditorHtml(
    {
      ...basePayload,
      tipoPlanejamento: "anual",
    },
    planningAnual,
  );

  assert.ok(
    simplifiedHtml.includes('data-planify-html-source="simplified-fallback"'),
    "fallback simplificado deve expor marcador simplified-fallback",
  );
  assert.ok(
    simplifiedHtml.includes("PLANEJAMENTO ANUAL"),
    "fallback simplificado deve manter título legado",
  );
  assert.ok(
    !simplifiedHtml.includes('data-planify-html-source="official-docx"') &&
      !simplifiedHtml.includes('data-planify-html-source="official-template"'),
    "fallback simplificado não deve parecer oficial",
  );

  console.log("verify-planning-editor-html: anual, trimestral e fallback OK");
}

main();
