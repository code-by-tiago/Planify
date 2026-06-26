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
const { getEngineOutputIssues } = loadTsModule(
  "src/server/materials/material-engine-quality.ts",
);
const { DISPLAY_FORMAT_CONTRACT } = loadTsModule(
  "src/server/materials/prova-engine-contract.ts",
);
const {
  containsMarkdownArtifacts,
  collectStructuredDisplayIssues,
  buildDisplayFormatContractForType,
} = loadTsModule("src/server/materials/structured-display-contract.ts");
const { normalizeMaterialEngineRequest } = loadTsModule(
  "src/server/materials/material-engine-validation.ts",
);
const { materialLayoutToEngineResponse } = loadTsModule(
  "src/server/materials/material-layout-adapter.ts",
);
const { validateMaterialLayout, containsForbiddenChitchat } = loadTsModule(
  "src/server/materials/validator.ts",
);
const { TIPO_FERRAMENTA_VALUES } = loadTsModule("src/server/materials/types.ts");
const { getMaterialLayoutSchema } = loadTsModule(
  "src/server/materials/material-layout-schema.ts",
);
const { resolveImagenModel } = loadTsModule("src/server/ai/imagen-client.ts");

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
    14,
    "MATERIAL_ENGINE_TYPES deve listar 14 tipos",
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
  const deprecatedTypes = new Set(["slides"]);

  for (const deepType of DEEP_GENERATION_TYPES) {
    assert.ok(!lightSet.has(deepType), `${deepType} não pode ser deep e light`);
  }

  for (const tipo of MATERIAL_ENGINE_TYPES) {
    if (deprecatedTypes.has(tipo)) {
      continue;
    }

    const deep = isDeepGenerationType(tipo);
    const tier = getModelTierForMaterialType(tipo);

    if (deepSet.has(tipo)) {
      assert.equal(deep, true, `${tipo} deve rotear como geração profunda (Pro)`);
      assert.equal(tier, "advanced", `${tipo} deve usar tier advanced`);
      continue;
    }

    if (lightSet.has(tipo)) {
      assert.equal(deep, true, `${tipo} deve contar na cota diária profunda (Pro universal)`);
      assert.equal(tier, "advanced", `${tipo} deve usar tier advanced (Pro)`);
      continue;
    }

    assert.fail(`${tipo} não está em DEEP_GENERATION_TYPES nem LIGHT_GENERATION_TYPES`);
  }

  assert.equal(
    DEEP_GENERATION_TYPES.length + LIGHT_GENERATION_TYPES.length,
    MATERIAL_ENGINE_TYPES.length - deprecatedTypes.size,
    "deep + light deve cobrir todos os tipos ativos",
  );

  assert.equal(isDeepGenerationType(PLANNING_DEEP_GENERATION_TYPE), true);
  assert.equal(isDeepGenerationType("planejamento-anual"), true);
  assert.equal(isDeepGenerationType("planejamento-trimestral"), true);
  assert.equal(isDeepGenerationType("flashcards"), true);
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

function testUnlimitedUsagePolicy() {
  const usagePolicyPath = join(root, "src/server/generation/usage-quota-policy.ts");
  const servicePath = join(root, "src/server/credits/daily-generation-service.ts");
  const creditServicePath = join(root, "src/server/credits/credit-service.ts");
  const usagePolicy = readFileSync(usagePolicyPath, "utf8");
  const service = readFileSync(servicePath, "utf8");
  const creditService = readFileSync(creditServicePath, "utf8");

  assert.match(usagePolicy, /return true;/);
  assert.match(service, /limit:\s*0/);
  assert.match(service, /return \{ status: "skipped" \}/);
  assert.doesNotMatch(service, /planify_(get|consume|refund)_deep_generation/);
  assert.match(creditService, /return 0;/);
  assert.match(creditService, /return \{ status: "skipped" \}/);
}

function testImagenModelResolution() {
  const previous = process.env.IMAGEN_MODEL;
  try {
    process.env.IMAGEN_MODEL = "imagen-4";
    assert.equal(resolveImagenModel(), "imagen-4.0-generate-001");

    process.env.IMAGEN_MODEL = "imagen-4-fast";
    assert.equal(resolveImagenModel(), "imagen-4.0-fast-generate-001");

    process.env.IMAGEN_MODEL = "imagen-4.0-ultra-generate-001";
    assert.equal(resolveImagenModel(), "imagen-4.0-ultra-generate-001");
  } finally {
    if (previous === undefined) delete process.env.IMAGEN_MODEL;
    else process.env.IMAGEN_MODEL = previous;
  }
}

function testStructuredDisplayContract() {
  assert.ok(
    DISPLAY_FORMAT_CONTRACT.includes("exam.questions"),
    "DISPLAY_FORMAT_CONTRACT deve mapear questões para exam.questions",
  );
  assert.ok(
    DISPLAY_FORMAT_CONTRACT.includes("planify-gabarito-table"),
    "DISPLAY_FORMAT_CONTRACT deve referenciar tabela de gabarito renderizada",
  );
  assert.ok(
    buildDisplayFormatContractForType("slides").includes("slides[]"),
    "contrato de slides deve orientar array slides[]",
  );

  assert.equal(
    containsMarkdownArtifacts("## Título"),
    "cabeçalho markdown (#)",
  );
  assert.equal(
    containsMarkdownArtifacts("| # | Resposta |"),
    "tabela markdown (|)",
  );
  assert.equal(containsMarkdownArtifacts("Enunciado direto."), null);

  const markdownOutput = {
    title: "Prova",
    subtitle: "",
    summary: "",
    sections: [],
    activities: [],
    answerKey: ["| 1 | x = 3 |"],
    teacherNotes: [],
    exam: {
      questions: [
        {
          number: 1,
          type: "multipla-escolha",
          statement: "Questão 1: Qual o valor de x?",
          options: ["a) x=2", "b) x=3", "c) x=4", "d) x=5"],
          answer: "x = 3",
        },
      ],
    },
  };

  const displayIssues = collectStructuredDisplayIssues(markdownOutput, {
    tipo: "prova",
    incluirGabarito: true,
  });
  assert.ok(
    displayIssues.some((issue) => issue.includes("Questão 1:")),
    "deve detectar prefixo Questão N: no enunciado",
  );
  assert.ok(
    displayIssues.some((issue) => issue.includes("prefixo a) b)")),
    "deve detectar prefixo de letra nas alternativas",
  );
  assert.ok(
    displayIssues.some((issue) => issue.includes("tabela markdown")),
    "deve detectar tabela markdown no answerKey",
  );
}

function testProvaListaQualityGate() {
  const baseInput = {
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "9º ano",
    componenteCurricular: "Matemática",
    tema: "Equações do 1º grau",
    objetivo: "Resolver equações",
    quantidade: 2,
    dificuldade: "media",
    incluirGabarito: true,
    habilidadesSelecionadas: [],
  };

  const request = normalizeMaterialEngineRequest({
    tipoMaterial: "prova",
    ...baseInput,
  });

  const weakOutput = {
    title: "Prova",
    subtitle: "",
    summary: "",
    sections: [],
    activities: [],
    answerKey: [],
    teacherNotes: ["Nota do professor"],
    exam: {
      questions: [
        {
          number: 1,
          type: "multipla-escolha",
          statement: "Explique o conteúdo estudado sobre o tema.",
          options: ["a", "b"],
          answer: "a",
        },
      ],
    },
  };

  const weakIssues = getEngineOutputIssues(request, weakOutput);
  assert.ok(weakIssues.length >= 3, "prova fraca deve acumular issues de qualidade");

  const strongOutput = {
    title: "Prova — Equações",
    subtitle: "9º ano",
    summary: "",
    sections: [],
    activities: [],
    answerKey: ["Questão 1: b) x = 3"],
    teacherNotes: [],
    exam: {
      questions: [
        {
          number: 1,
          type: "multipla-escolha",
          statement:
            "Em equações do 1º grau, qual valor de x resolve 2x + 4 = 10?",
          options: [
            "Substituindo x = 2 em 2x+4 obtemos 8, que não satisfaz a igualdade 10",
            "Substituindo x = 3 em 2x+4 obtemos 10, confirmando a solução da equação",
            "Substituindo x = 4 em 2x+4 obtemos 12, que não satisfaz a igualdade 10",
            "Substituindo x = 5 em 2x+4 obtemos 14, que não satisfaz a igualdade 10",
            "Substituindo x = 6 em 2x+4 obtemos 16, que não satisfaz a igualdade 10",
          ],
          answer: "x = 3, pois 2·3+4=10 confirma a equação do 1º grau.",
        },
        {
          number: 2,
          type: "dissertativa",
          statement:
            "Descreva os passos para resolver 5x - 7 = 18 em equações do 1º grau.",
          options: [],
          answer:
            "Somar 7 aos dois membros (5x=25), dividir por 5 e concluir x=5 verificando na equação original.",
        },
      ],
    },
  };

  const strongIssues = getEngineOutputIssues(request, strongOutput);
  assert.deepEqual(
    strongIssues,
    [],
    `prova forte deveria passar, recebido: ${strongIssues.join("; ")}`,
  );
}

function testAtividadeQualityGate() {
  const request = normalizeMaterialEngineRequest({
    tipoMaterial: "atividade",
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "9º ano",
    componenteCurricular: "Matemática",
    tema: "Equações do 1º grau",
    objetivo: "Resolver equações",
    quantidade: 2,
    dificuldade: "media",
    incluirGabarito: true,
    habilidadesSelecionadas: [],
  });

  const weakOutput = {
    title: "Atividade",
    subtitle: "9º ano",
    summary: "Atividade curta.",
    sections: [],
    activities: [
      {
        title: "Exercício rápido",
        objective: "Resolver equações.",
        estimatedTime: "10 min",
        materials: ["Caderno"],
        instructions: "Resolva as contas.",
        items: ["a) x + 2 = 8", "b) 3x = 21"],
        evaluation: "Participação.",
      },
    ],
    answerKey: [],
    teacherNotes: [],
  };

  const weakIssues = getEngineOutputIssues(request, weakOutput);
  assert.ok(
    weakIssues.some((issue) => issue.includes("esperado exatamente 2")),
    "atividade fraca deve exigir quantidade exata",
  );
  assert.ok(
    weakIssues.some((issue) => issue.includes("pelo menos 5 itens")),
    "atividade fraca deve exigir itens a)-e)",
  );

  const strongActivity = (title, seed) => ({
    title,
    objective:
      "Resolver equações do 1º grau em contexto escolar, registrando estratégias e justificativas matemáticas.",
    estimatedTime: "30 minutos",
    materials: ["Caderno de registro", "Cartões de equações", "Quadro branco"],
    instructions:
      "Organize os estudantes em duplas, apresente a situação, peça registro individual do raciocínio e finalize com comparação das estratégias usadas.",
    items: [
      `a) Leia a situação ${seed} e destaque os dados relevantes antes de calcular.`,
      `b) Interprete qual operação inversa ajuda a isolar a incógnita em ${seed}.`,
      `c) Resolva a equação de ${seed}, mostrando uma etapa por linha no caderno.`,
      `d) Justifique por que o valor encontrado mantém a igualdade verdadeira em ${seed}.`,
      `e) Produza um novo exemplo semelhante a ${seed} e explique a solução para um colega.`,
    ],
    evaluation:
      "Avaliar registro das etapas, coerência da justificativa, participação na dupla e qualidade do exemplo produzido.",
  });

  const strongOutput = {
    title: "Atividade — Equações",
    subtitle: "9º ano",
    summary: "Atividades orientadas sobre equações do 1º grau.",
    sections: [],
    activities: [
      strongActivity("Estação de resolução", "x + 4 = 11"),
      strongActivity("Desafio de aplicação", "3x = 21"),
    ],
    answerKey: [],
    teacherNotes: [],
  };

  const strongIssues = getEngineOutputIssues(request, strongOutput);
  assert.deepEqual(
    strongIssues,
    [],
    `atividade forte deveria passar, recebido: ${strongIssues.join("; ")}`,
  );
}

function testRedacaoQualityGate() {
  const request = normalizeMaterialEngineRequest({
    tipoMaterial: "redacao",
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "9º ano",
    componenteCurricular: "Língua Portuguesa",
    tema: "Educação financeira e cidadania",
    objetivo: "Produzir texto argumentativo",
    quantidade: 3,
    dificuldade: "media",
    incluirGabarito: false,
    habilidadesSelecionadas: [],
  });

  const weakOutput = {
    title: "Redação",
    subtitle: "9º ano",
    summary: "",
    sections: [
      { title: "Texto motivador 1", content: "Texto curto.", bullets: [] },
      { title: "Texto motivador 2", content: "Outro texto.", bullets: [] },
    ],
    activities: [],
    answerKey: [],
    teacherNotes: ["Avaliar."],
  };

  const weakIssues = getEngineOutputIssues(request, weakOutput);
  assert.ok(
    weakIssues.some((issue) => issue.includes("exatamente 3 textos motivadores")),
    "redação fraca deve exigir quantidade exata de motivadores",
  );
  assert.ok(
    weakIssues.some((issue) => issue.includes("tema e comando")),
    "redação fraca deve exigir seção de comando",
  );

  const strongOutput = {
    title: "Redação — Educação financeira e cidadania",
    subtitle: "9º ano",
    summary: "",
    sections: [
      {
        title: "Tema e comando",
        content:
          "Produza um texto dissertativo-argumentativo sobre a importância da educação financeira para escolhas cidadãs. Defenda um ponto de vista, mobilize repertório pertinente e conclua com encaminhamento coerente.",
        bullets: [
          "Gênero: texto dissertativo-argumentativo escolar",
          "Finalidade: defender uma tese com argumentos e exemplos",
        ],
      },
      {
        title: "Texto motivador 1",
        content:
          "Uma reportagem descreve famílias que usam planilhas simples para comparar renda, despesas fixas e gastos variáveis. O texto mostra que interpretar números ajuda a planejar prioridades e evitar decisões impulsivas no cotidiano.",
        bullets: [],
      },
      {
        title: "Texto motivador 2",
        content:
          "Uma charge apresenta um estudante calculando quanto precisa economizar para comprar um livro sem comprometer transporte e alimentação. A cena aproxima matemática, autonomia e responsabilidade nas escolhas de consumo.",
        bullets: [],
      },
      {
        title: "Texto motivador 3",
        content:
          "Um trecho de material didático afirma que educação financeira envolve analisar consequências, justificar escolhas e reconhecer limites. Nesse percurso, linguagem matemática e argumentação ajudam a transformar informação em cidadania.",
        bullets: [],
      },
    ],
    activities: [],
    answerKey: [],
    teacherNotes: [
      "Avaliar adequação ao tema, repertório usado na argumentação, coesão entre parágrafos, linguagem adequada ao gênero e conclusão coerente com a tese.",
    ],
  };

  const strongIssues = getEngineOutputIssues(request, strongOutput);
  assert.deepEqual(
    strongIssues,
    [],
    `redação forte deveria passar, recebido: ${strongIssues.join("; ")}`,
  );
}

function testUnifiedMaterialEngineContract() {
  assert.equal(TIPO_FERRAMENTA_VALUES.length, 17, "17 ferramentas no contrato unificado");
  assert.ok(getMaterialLayoutSchema().properties.secoes, "schema MaterialLayout presente");
  assert.equal(
    containsForbiddenChitchat("Aqui está seu material de prova"),
    true,
    "deve rejeitar vazamento conversacional",
  );

  const request = normalizeMaterialEngineRequest({
    tipoMaterial: "prova",
    etapa: "Ensino Fundamental",
    anoSerie: "8º ano",
    componenteCurricular: "História",
    tema: "Independência do Brasil",
    quantidade: 1,
    incluirGabarito: true,
  });

  const layout = {
    metadata: {
      tema: "Independência do Brasil",
      serie: "8º ano",
      habilidadeBNCC: "",
      codigoBNCC: "",
    },
    secoes: [
      {
        titulo: "Questões",
        tipo: "questoes",
        conteudo: {
          questoes: [
            {
              numero: 1,
              enunciado:
                "Qual documento formalizou a independência do Brasil em 1822?",
              tipo: "multipla-escolha",
              alternativas: [
                { letra: "A", texto: "Tratado de Tordesilhas de 1494" },
                { letra: "B", texto: "Grito do Ipiranga e ato simbólico de setembro" },
                { letra: "C", texto: "Lei Áurea de 1888 sobre escravatura" },
                { letra: "D", texto: "Constituição de 1988 pós-ditadura" },
                { letra: "E", texto: "Plano Real de estabilização econômica" },
              ],
              respostaCorreta: "B",
              justificativa: "O Grito do Ipiranga marcou a ruptura com Portugal.",
            },
          ],
        },
      },
    ],
  };

  const layoutIssues = validateMaterialLayout(
    {
      tipoFerramenta: "prova",
      etapa: request.etapa,
      anoSerie: request.anoSerie,
      componenteCurricular: request.componenteCurricular,
      tema: request.tema,
      quantidade: request.quantidade,
      dificuldade: request.dificuldade,
      incluirGabarito: true,
    },
    layout,
  );
  assert.deepEqual(layoutIssues, [], `layout prova válido: ${layoutIssues.join("; ")}`);

  const estrutura = materialLayoutToEngineResponse(layout, request);
  assert.ok(estrutura.exam?.questions?.length === 1, "adapter deve gerar exam.questions");
  assert.equal(estrutura.exam.questions[0].options.length, 5, "5 alternativas no renderer");
}

function testCronogramaTableRenderer() {
  const { renderCronogramaTables } = loadTsModule(
    "src/lib/materiais/material-document-layout.ts",
  );
  const { buildMaterialEngineHtmlFromStructure } = loadTsModule(
    "src/server/materials/material-engine-service.ts",
  );

  const html = renderCronogramaTables({
    scheduleTables: [
      {
        title: "Cronograma da aula",
        headers: ["Etapa", "Duração", "Atividade", "Recursos"],
        rows: [
          ["Abertura", "10 min", "Retomar conceitos", "Quadro"],
          ["Fechamento", "10 min", "Síntese", "Caderno"],
        ],
      },
    ],
  });

  assert.match(html, /planify-cronograma-table/);
  assert.match(html, /Abertura/);
  assert.match(html, /<th scope="col">Duração<\/th>/);

  const legacyHtml = buildMaterialEngineHtmlFromStructure(
    {
      tipoMaterial: "plano-aula",
      etapa: "Ensino Fundamental",
      anoSerie: "8º ano",
      componenteCurricular: "História",
      tema: "Independência",
      quantidade: 1,
    },
    {
      title: "Plano de aula",
      subtitle: "8º ano",
      summary: "Plano sobre Independência.",
      sections: [{ title: "Objetivos", content: "Compreender o processo.", bullets: [] }],
      activities: [],
      answerKey: [],
      teacherNotes: [],
      lessonPlan: {
        steps: [
          {
            stage: "Abertura",
            duration: "10 min",
            description: "Contextualizar o tema.",
            resources: ["Mapa"],
          },
        ],
      },
    },
  );

  assert.match(legacyHtml, /planify-cronograma-table/);
  assert.match(legacyHtml, /Contextualizar o tema/);
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

function testGameExportMarkup() {
  const { buildVisualGameMaterial } = loadTsModule("src/lib/materiais/game-builder.ts");
  const { PLANIFY_GAME_EXPORT_CSS } = loadTsModule("src/lib/materiais/game-export-styles.ts");
  const { PLANIFY_EXPORT_CSS } = loadTsModule("src/lib/editor/editor-print-html.ts");

  const output = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Sintaxe: Sintagmas",
    componenteCurricular: "Língua Portuguesa",
    anoSerie: "8º ano",
    etapa: "Ensino Fundamental",
  });

  const html = String(output.visualHtml || "");
  assert.match(html, /planify-game-table--crossword/);
  assert.match(html, /planify-game-cell--letter/);
  assert.match(html, /planify-game-clues-table/);
  assert.match(html, /planify-game-teacher-block/);
  assert.doesNotMatch(html, /width:100%.*planify-game-table/s);

  assert.match(PLANIFY_GAME_EXPORT_CSS, /planify-game-cell--letter/);
  assert.match(PLANIFY_EXPORT_CSS, /table:not\(\.planify-game-table\)/);
}

function testUnifiedQualityGate() {
  const {
    assessUnifiedQualityGate,
    passesExportQualityGate,
    UNIFIED_MIN_QUALITY_SCORE,
    isCriticalQualityIssue,
  } = loadTsModule("src/lib/materiais/unified-quality-gate.ts");

  assert.equal(UNIFIED_MIN_QUALITY_SCORE, 88);

  const pass = assessUnifiedQualityGate({
    qualityScore: 92,
    qualityIssues: [],
  });
  assert.equal(pass.pass, true);

  const low = assessUnifiedQualityGate({
    qualityScore: 70,
    qualityIssues: ["Conteúdo genérico demais."],
  });
  assert.equal(low.pass, false);
  assert.equal(low.code, "quality_score_low");

  assert.equal(
    isCriticalQualityIssue(
      "múltipla escolha exige pelo menos 5 alternativas distintas.",
    ),
    true,
  );
  const critical = assessUnifiedQualityGate({
    qualityScore: 95,
    qualityIssues: [
      "múltipla escolha exige pelo menos 5 alternativas distintas.",
    ],
  });
  assert.equal(critical.pass, false);
  assert.equal(critical.code, "critical_issues");

  assert.equal(passesExportQualityGate(null, []), true);
  assert.equal(passesExportQualityGate(70, ["pendência"]), false);
}

function testCompanionToolsQuality() {
  const { assessInclusaoQuality } = loadTsModule(
    "src/server/inclusao/inclusao-quality.ts",
  );
  const { assessCorrectionQuality } = loadTsModule(
    "src/server/correcao/correction-quality.ts",
  );
  const { assessPeiQuality } = loadTsModule("src/server/pei/pei-quality.ts");

  const goodPei = assessPeiQuality({
    perfil: "Estudante com TDAH em acompanhamento pedagógico.",
    suportes: ["Blocos curtos", "Checklist visual", "Pausas programadas"],
    acessibilidade: ["Material ampliado", "Tempo estendido"],
    curricularRows: [
      { conteudo: "Frações", habilidade: "EF05MA03" },
      { conteudo: "Problemas", habilidade: "EF05MA08" },
    ],
    planejamento: [
      { periodo: "Março", metodologia: "Roda de conversa" },
      { periodo: "Abril", metodologia: "Estações de aprendizagem" },
    ],
    parecer:
      "O estudante demonstra avanço na leitura de enunciados quando recebe apoio visual e tempo adicional. Recomenda-se manter estratégias de mediação e revisão colaborativa com a família e a equipe escolar, priorizando autonomia progressiva nas tarefas de matemática.",
    usedAI: true,
  });
  assert.equal(goodPei.pass, true);
  assert.ok(goodPei.qualityScore >= 72);

  const badPei = assessPeiQuality({
    perfil: "",
    suportes: [],
    acessibilidade: [],
    curricularRows: [],
    planejamento: [],
    parecer: "Ok.",
    usedAI: false,
  });
  assert.equal(badPei.pass, false);

  const goodInclusao = assessInclusaoQuality({
    modo: "adaptacao",
    sourceContent: "Atividade sobre frações para o 5º ano com exercícios de soma.",
    markdown: [
      "## Adaptações para TDAH",
      "- Dividir a atividade em blocos de 8 minutos.",
      "- Usar cartões visuais de frações antes dos exercícios escritos.",
      "- Oferecer checklist com passos numerados para cada questão.",
    ].join("\n"),
  });
  assert.equal(goodInclusao.pass, true);
  assert.ok(goodInclusao.qualityScore >= 80);

  const badInclusao = assessInclusaoQuality({
    modo: "adaptacao",
    sourceContent:
      "Atividade sobre frações para o 5º ano com exercícios de soma e representação pictórica.",
    markdown: "Atividade sobre frações para o 5º ano com exercícios de soma e representação pictórica.",
  });
  assert.equal(badInclusao.pass, false);

  const goodCorrection = assessCorrectionQuality({
    nota: 7,
    notaMaxima: 10,
    percentual: 70,
    feedbackGeral:
      "A resposta identifica corretamente a causa do fenômeno, mas falta exemplificar com o contexto local.",
    criterios: [
      {
        criterio: "Compreensão do conceito",
        atendido: true,
        pontos: 4,
        pontosMaximos: 5,
        comentario: "Explica o conceito com clareza parcial.",
      },
    ],
    pontosFortes: ["Usa vocabulário adequado do tema."],
    pontosMelhoria: ["Incluir um exemplo concreto da unidade em estudo."],
    sugestaoProfessor: "Peça um contraexemplo em dupla na próxima aula.",
  });
  assert.equal(goodCorrection.pass, true);

  const badCorrection = assessCorrectionQuality({
    nota: 8,
    notaMaxima: 10,
    percentual: 80,
    feedbackGeral: "Bom trabalho.",
    criterios: [],
    pontosFortes: [],
    pontosMelhoria: [],
    sugestaoProfessor: "",
  });
  assert.equal(badCorrection.pass, false);
}

function main() {
  const started = Date.now();

  runTest("material-engine-types", testMaterialEngineTypesCatalog);
  runTest("material-type-routing", testMaterialTypeRouting);
  runTest("discipline-seeds", testDisciplineSeeds);
  runTest("quality-score", testQualityScore);
  runTest("imagen-model", testImagenModelResolution);
  runTest("structured-display-contract", testStructuredDisplayContract);
  runTest("prova-lista-quality-gate", testProvaListaQualityGate);
  runTest("atividade-quality-gate", testAtividadeQualityGate);
  runTest("redacao-quality-gate", testRedacaoQualityGate);
  runTest("unified-material-engine", testUnifiedMaterialEngineContract);
  runTest("cronograma-table-renderer", testCronogramaTableRenderer);
  runTest("unified-quality-gate", testUnifiedQualityGate);
  runTest("game-export-markup", testGameExportMarkup);
  runTest("planning-quality", testPlanningQuality);
  runTest("unlimited-usage-policy", testUnlimitedUsagePolicy);
  runTest("generation-events-migration", testGenerationEventsMigrationContract);
  runTest("companion-tools-quality", testCompanionToolsQuality);

  const elapsedMs = Date.now() - started;
  console.log(
    `verify-material-quality: OK (${MATERIAL_ENGINE_TYPES.length} tipos, ${DISCIPLINE_SEED_CASES.length} seeds, planning, migration) — ${elapsedMs}ms`,
  );
}

main();
