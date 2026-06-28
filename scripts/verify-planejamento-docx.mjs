/**
 * Gera DOCX oficial offline (sem auth) + health check opcional do servidor local.
 * Run: npm run verify:planejamento-docx
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { inflateRawSync } from "node:zlib";

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

function readDocxDocumentXml(buffer) {
  let eocdOffset = -1;

  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  assert.ok(eocdOffset >= 0, "DOCX sem diretório ZIP");
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    offset += 46 + fileNameLength + extraLength + commentLength;
    if (fileName !== "word/document.xml") continue;

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    return (compression === 0 ? compressed : inflateRawSync(compressed)).toString("utf8");
  }

  throw new Error("word/document.xml não encontrado");
}

function normalizeDocxText(value) {
  return value
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function assertWithoutReferenceInstructions(label, text) {
  const instructions = [
    "[de acordo com a matriz",
    "[a partir da matriz",
    "[indique",
    "[descreva",
    "[livros, impressos",
    "[data de inicio e fim]",
  ];

  const remaining = instructions.filter((instruction) => text.includes(instruction));
  assert.deepEqual(remaining, [], `${label}: instruções do modelo não foram preenchidas`);
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

function verifyReferenceTemplates(buildOfficialPlanningDocx, buildTrimestralPlansFromAnnual) {
  const matrix = [
    [1, "Conteúdo T1-A", "EF05HI01"],
    [1, "Conteúdo T1-B", "EF05HI02"],
    [2, "Conteúdo T2-A", "EF05HI03"],
    [2, "Conteúdo T2-B", "EF05HI04"],
    [3, "Conteúdo T3-A", "EF05HI05"],
    [3, "Conteúdo T3-B", "EF05HI06"],
  ].map(([trimestre, conteudo, codigo], index) => ({
    trimestre,
    conteudo,
    numeroAula: index + 1,
    periodos: 1,
    aulaInicio: index + 1,
    aulaFim: index + 1,
    habilidades: [{ codigo, descricao: `Habilidade ${codigo}` }],
    objetivos: `Objetivo de aprendizagem para ${conteudo}.`,
    metodologia: `Metodologia ativa para ${conteudo} com investigação e socialização.`,
    materiais: "Caderno, fichas de atividade e textos de apoio.",
    recursos: "Quadro, projetor e livro didático.",
    etapas: "1. Acolhimento e contextualização.\n2. Investigação orientada.\n3. Produção e socialização.",
    evidencias: `Registros e produções sobre ${conteudo}.`,
    avaliacao: `Rubrica, participação e devolutiva sobre ${conteudo}.`,
  }));

  const basePayload = {
    escola: "Escola Modelo Planify",
    professor: "Prof. Modelo",
    turma: "5º A",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    areaConhecimento: "Ciências Humanas",
    componenteCurricular: "História",
    cargaHoraria: "12 períodos",
    matrizPlanejamento: { conteudos: matrix },
  };

  const annual = buildOfficialPlanningDocx({
    ...basePayload,
    tipoPlanejamento: "anual",
  });
  const annualText = normalizeDocxText(readDocxDocumentXml(annual));

  [
    "prof. modelo",
    "5º ano",
    "12 periodos",
    "1 periodo",
    "conteudo t1-a",
    "conteudo t2-a",
    "conteudo t3-a",
  ].forEach((expected) =>
    assert.ok(annualText.includes(normalizeDocxText(expected)), `anual: campo ausente (${expected})`),
  );
  assertWithoutReferenceInstructions("anual", annualText);

  const trimestrais = buildTrimestralPlansFromAnnual(
    {
      titulo: "Planejamento anual de referência",
      resumo: "Matriz anual de referência.",
      conteudos: matrix,
    },
    [1, 2, 3],
  );

  for (const trimestre of [1, 2, 3]) {
    const trimestral = trimestrais[trimestre];
    const expectedItems = matrix.filter((item) => item.trimestre === trimestre);

    assert.ok(trimestral, `${trimestre}º trimestre não foi extraído do anual`);
    assert.deepEqual(
      trimestral.conteudos.map((item) => item.conteudo),
      expectedItems.map((item) => item.conteudo),
      `${trimestre}º trimestre divergiu dos conteúdos do anual`,
    );
    assert.deepEqual(
      trimestral.conteudos.flatMap((item) => item.habilidades.map((skill) => skill.codigo)),
      expectedItems.flatMap((item) => item.habilidades.map((skill) => skill.codigo)),
      `${trimestre}º trimestre divergiu das habilidades do anual`,
    );

    const trimestralDocx = buildOfficialPlanningDocx({
      ...basePayload,
      tipoPlanejamento: "trimestral",
      trimestre,
      cargaHoraria: "4 períodos",
      matrizPlanejamento: { conteudos: trimestral.conteudos },
    });
    const trimestralText = normalizeDocxText(readDocxDocumentXml(trimestralDocx));

    expectedItems.forEach((item) =>
      assert.ok(
        trimestralText.includes(normalizeDocxText(item.conteudo)),
        `${trimestre}º trimestre não contém ${item.conteudo}`,
      ),
    );
    matrix
      .filter((item) => item.trimestre !== trimestre)
      .forEach((item) =>
        assert.ok(
          !trimestralText.includes(normalizeDocxText(item.conteudo)),
          `${trimestre}º trimestre contém conteúdo de outro período (${item.conteudo})`,
        ),
      );
    [
      "semana 1 (1 periodo)",
      "metodologia",
      "materiais e recursos necessarios",
      "etapas dessa experiencia",
      "instrumentos de avaliacao",
    ]
      .forEach((expected) =>
        assert.ok(
          trimestralText.includes(expected),
          `${trimestre}º trimestre: campo de referência ausente (${expected})`,
        ),
      );
    assert.ok(
      !trimestralText.includes("organizacao da turma"),
      `${trimestre}º trimestre: estrutura antiga de experiências permaneceu no modelo`,
    );
    assert.ok(
      !trimestralText.includes("momentos/etapas dessa experiencia"),
      `${trimestre}º trimestre: rótulo antigo de etapas permaneceu no modelo`,
    );
    assertWithoutReferenceInstructions(`${trimestre}º trimestre`, trimestralText);
  }

  console.log("verify-planejamento-docx: modelos de referência e consonância anual/trimestral OK");
}

function main() {
  const { buildOfficialPlanningDocx, getOfficialPlanningFilename } = loadTsModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );
  const { buildTrimestralPlansFromAnnual } = loadTsModule(
    "src/lib/planejamentos/planning-trimestral-from-annual.ts",
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

  verifyReferenceTemplates(buildOfficialPlanningDocx, buildTrimestralPlansFromAnnual);
}

await testServerHealth();
main();
console.log("verify-planejamento-docx: OK");
