/**
 * Gera DOCX oficial offline (sem auth) + health check opcional do servidor local.
 * Run: npm run verify:planejamento-docx
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "tmp", "verify-planejamento-docx");
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
    aulaInicio: index * 2 + 1,
    aulaFim: index * 2 + 2,
    habilidades: [HABILIDADES[index % HABILIDADES.length]],
    objetivos: `Compreender ${conteudo.toLowerCase()} com leitura, análise e socialização em sala.`,
    metodologia:
      "Aula expositiva dialogada, leitura orientada, mapas e registros no caderno com mediação do professor.",
    recursos: "Livro didático, quadro, mapas, textos de apoio e caderno do estudante.",
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

const payloadAnual = {
  tipoPlanejamento: "anual",
  escola: "Escola Teste Planify",
  professor: "Professor(a) Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  cargaHoraria: "60 aulas",
  temaCentral: "Formação histórica do Brasil",
  conteudos: CONTEUDOS_ANUAL,
  habilidadesSelecionadas: HABILIDADES,
  matrizPlanejamento: {
    tipoPlanejamento: "anual",
    titulo: "Planejamento anual — Formação histórica do Brasil",
    resumo: "Sequência anual com foco em culturas, colonização e cidadania.",
    conteudos: buildMatrix(CONTEUDOS_ANUAL, 1),
  },
};

const CONTEUDOS_TRIMESTRAL = [
  "Povos originários do Brasil",
  "Chegada dos portugueses e primeiros contatos",
  "Colonização e organização do território",
];

const payloadTrimestral = {
  ...payloadAnual,
  tipoPlanejamento: "trimestral",
  trimestre: 1,
  cargaHoraria: "30 aulas",
  conteudos: CONTEUDOS_TRIMESTRAL,
  matrizPlanejamento: {
    tipoPlanejamento: "trimestral",
    titulo: "Planejamento trimestral — 1º trimestre",
    resumo: "Sequência do trimestre com foco em formação histórica do Brasil.",
    conteudos: buildMatrix(CONTEUDOS_TRIMESTRAL, 1),
  },
};

function assertDocxBuffer(label, buffer) {
  assert.ok(Buffer.isBuffer(buffer), `${label}: buffer inválido`);
  assert.ok(buffer.byteLength > 2000, `${label}: DOCX pequeno demais (${buffer.byteLength} bytes)`);
  assert.equal(buffer.subarray(0, 2).toString("utf8"), "PK", `${label}: não é ZIP/DOCX`);
}

async function testServerHealth() {
  const baseUrl = process.env.PLANIFY_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${baseUrl}/api/planejamentos/docx-oficial`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      console.log(`verify-planejamento-docx: servidor ${baseUrl} respondeu ${response.status} (health)`);
      return;
    }
    const json = await response.json();
    assert.equal(json.success, true);
    console.log(`verify-planejamento-docx: servidor local OK (${baseUrl})`);
  } catch {
    console.log("verify-planejamento-docx: servidor local indisponível (motor offline validado)");
  }
}

function main() {
  const { buildOfficialPlanningDocx, getOfficialPlanningFilename } = loadTsModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );

  mkdirSync(outputDir, { recursive: true });

  for (const [name, payload] of [
    ["anual", payloadAnual],
    ["trimestral", payloadTrimestral],
  ]) {
    const buffer = buildOfficialPlanningDocx(payload);
    assertDocxBuffer(name, buffer);
    const filename = `${getOfficialPlanningFilename(payload)}.docx`;
    const outputPath = join(outputDir, filename);
    writeFileSync(outputPath, buffer);
    console.log(`verify-planejamento-docx: ${name} → ${outputPath} (${buffer.byteLength} bytes)`);
  }
}

await testServerHealth();
main();
console.log("verify-planejamento-docx: OK");
