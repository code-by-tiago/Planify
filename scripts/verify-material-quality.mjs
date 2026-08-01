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

function testPlanoAulaQualityGate() {
  const request = normalizeMaterialEngineRequest({
    tipoMaterial: "plano-aula",
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "8º ano",
    componenteCurricular: "História",
    tema: "Independência do Brasil",
    quantidade: 1,
    incluirGabarito: false,
    habilidadesSelecionadas: [],
  });

  const weakOutput = {
    title: "Plano de aula",
    subtitle: "8º ano",
    summary: "Plano genérico sobre tema estudado.",
    sections: [{ title: "Objetivos", content: "Estudar o tema.", bullets: [] }],
    activities: [],
    answerKey: [],
    teacherNotes: [],
    lessonPlan: {
      steps: [
        {
          stage: "Aula",
          duration: "50 min",
          description: "Trabalhar o conteúdo.",
          resources: [],
        },
      ],
    },
  };

  const weakIssues = getEngineOutputIssues(request, weakOutput);
  assert.ok(
    weakIssues.some((issue) => issue.includes("5 etapas") || issue.includes("4+ linhas")),
    "plano fraco deve exigir cronograma completo",
  );
  assert.ok(
    weakIssues.some((issue) => issue.includes("atividade pedagógica")),
    "plano fraco deve exigir atividade",
  );

  const strongOutput = {
    title: "Plano de aula — Independência do Brasil",
    subtitle: "8º ano",
    summary: "Plano para analisar causas e consequências da Independência do Brasil.",
    sections: [
      {
        title: "Objetivos",
        content: "Compreender o processo de independência e suas consequências políticas.",
        bullets: ["EF08HI01"],
      },
      {
        title: "Desenvolvimento",
        content: "Sequência de contextualização, análise de documentos e síntese.",
        bullets: [],
      },
      {
        title: "Recursos e avaliação",
        content: "Observação formativa e registro escrito.",
        bullets: [],
      },
    ],
    activities: [
      {
        title: "Análise de documento",
        objective: "Interpretar um trecho do Manifesto do Dia 7 de Setembro.",
        estimatedTime: "20 min",
        materials: ["Cartaz", "Caderno"],
        instructions:
          "Orientar leitura guiada, identificação de argumentos e produção de síntese em grupo.",
        items: [
          "a) Leiam o documento e circulem palavras-chave.",
          "b) Identifiquem a tese defendida no texto.",
          "c) Relacionem o documento ao contexto político da época.",
          "d) Registrem uma consequência histórica citada.",
          "e) Apresentem a síntese do grupo em 1 minuto.",
        ],
        evaluation: "Clareza da interpretação e participação nas duplas.",
      },
    ],
    answerKey: [],
    teacherNotes: [],
    lessonPlan: {
      steps: [
        {
          stage: "Abertura",
          duration: "10 min",
          description:
            "Professor retoma conhecimentos sobre Colônia e apresenta pergunta norteadora; estudantes registram hipóteses.",
          resources: ["Quadro", "Caderno"],
        },
        {
          stage: "Contextualização",
          duration: "10 min",
          description:
            "Professor explica o contexto político; estudantes completam linha do tempo inicial.",
          resources: ["Linha do tempo"],
        },
        {
          stage: "Análise",
          duration: "15 min",
          description:
            "Estudantes analisam documento em duplas; professor circula mediando interpretações.",
          resources: ["Cartaz histórico"],
        },
        {
          stage: "Prática",
          duration: "10 min",
          description:
            "Duplas produzem síntese escrita; professor registra dúvidas no quadro.",
          resources: ["Caderno"],
        },
        {
          stage: "Fechamento",
          duration: "5 min",
          description:
            "Professor sistematiza causas e consequências; estudantes registram aprendizagens.",
          resources: ["Caderno"],
        },
      ],
    },
  };

  const strongIssues = getEngineOutputIssues(request, strongOutput);
  assert.deepEqual(
    strongIssues,
    [],
    `plano forte deveria passar, recebido: ${strongIssues.join("; ")}`,
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
  assert.match(html, /planify-crossword-page--student/);
  assert.match(html, /planify-crossword-page--answer/);
  assert.doesNotMatch(html, /width:100%.*planify-game-table/s);

  assert.match(PLANIFY_GAME_EXPORT_CSS, /planify-game-cell--letter/);
  assert.match(PLANIFY_EXPORT_CSS, /table:not\(\.planify-game-table\)/);
  assert.match(PLANIFY_EXPORT_CSS, /planify-doc-brand/);
  assert.match(PLANIFY_EXPORT_CSS, /planify-doc-brand-mark/);

  const robustOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Divisão celular",
    componenteCurricular: "Ciências",
    anoSerie: "7º ano",
    etapa: "Ensino Fundamental",
    quantidade: 10,
    conteudos:
      "Palavras sugeridas pelo professor: MITOSE, MEIOSE, CROMOSSOMO, CELULA, NUCLEO, DNA, GENETICA, CITOPLASMA, PROFASE, METAFASE",
  });
  const robustHtml = String(robustOutput.visualHtml || "");
  assert.ok(
    (robustOutput.gabarito || []).length >= 8,
    "cruzadinha deve posicionar termos suficientes na grade",
  );
  assert.ok(
    (robustOutput.gabarito || []).length <= 20,
    "cruzadinha deve respeitar o máximo de 20 termos",
  );
  assert.match(robustHtml, /Mitose|Meiose|Cromossomo|GenÃ©tica|GENETICA/i);
  assert.doesNotMatch(robustHtml, /PALAVRAS SUGERIDAS/);
  assert.match(robustHtml, /Grade com[\s\S]*termos/);
  assert.match(robustHtml, /planify-game-cell--void/);
  assert.match(robustHtml, /<h3>HORIZONTAL<\/h3>/);
  assert.match(robustHtml, /<h3>VERTICAL<\/h3>/);
  assert.doesNotMatch(robustHtml, /Cruzadinha\s+[—-]/);

  const aiSeededOutput = buildVisualGameMaterial(
    {
      tipo: "jogo",
      modeloJogo: "cruzadinha",
      tema: "Fotossintese",
      componenteCurricular: "Ciências",
      anoSerie: "6º ano",
      etapa: "Ensino Fundamental",
      quantidade: 8,
    },
    {
      termosDoJogo: [
        { termo: "FOTOSSINTESE", pista: "Processo em que plantas produzem alimento usando luz, água e gás carbônico." },
        { termo: "CLOROFILA", pista: "Pigmento verde que participa da captação de energia luminosa nas folhas." },
        { termo: "GLICOSE", pista: "Açúcar produzido pela planta como fonte de energia para suas células." },
        { termo: "OXIGENIO", pista: "Gás liberado para o ambiente durante esse processo realizado pelas plantas." },
        { termo: "CARBONO", pista: "Elemento presente no gás carbônico usado como matéria-prima pela planta." },
        { termo: "LUZ", pista: "Fonte de energia necessária para iniciar a produção de alimento vegetal." },
        { termo: "FOLHA", pista: "Órgão vegetal em que ocorre grande parte da produção de alimento." },
        { termo: "RAIZ", pista: "Parte da planta que absorve água e sais minerais do solo." },
      ],
    },
  );
  const aiSeededKey = (aiSeededOutput.gabarito || []).join("\n");
  assert.match(aiSeededKey, /Fotossintese|Clorofila|Glicose|Oxigenio/i);
  assert.doesNotMatch(aiSeededKey, /Conceito|Exemplo/);

  const intertextualityOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Tipos de Intertextualidade",
    componenteCurricular: "LÃ­ngua Portuguesa",
    anoSerie: "9Âº ano",
    etapa: "Ensino Fundamental",
    quantidade: 10,
    conteudos: [
      "EPIGRAFE: Frase ou pensamento colocado no inicio de uma obra ou capitulo para introduzir o tema.",
      "INTERTEXTO: Relacao que um texto estabelece com outros textos ja existentes.",
      "DIALOGO: Interacao entre textos que se complementam ou se contrapoe.",
      "REFERENCIA: Ato de mencionar ou remeter a algo ja existente em outro contexto.",
      "PASTICHE: Imitacao do estilo de um autor ou obra, sem intencao de critica, mas de homenagem ou exercicio.",
      "PARODIA: Recriacao de um texto original com intencao humoristica ou critica.",
      "CITACAO: Insercao de um trecho de outro texto, geralmente entre aspas e com indicacao da fonte.",
      "RELEITURA: Nova interpretacao ou versao de uma obra ja conhecida.",
      "ADAPTACAO: Transformacao de uma obra para outro formato ou publico, mantendo a essencia.",
      "ALUSAO: Referencia indireta a um texto, personagem ou evento conhecido, sem citar explicitamente.",
    ].join("\n"),
  });
  const intertextualityKey = (intertextualityOutput.gabarito || []).join("\n");
  assert.equal(
    (intertextualityOutput.gabarito || []).length,
    10,
    "cruzadinha solicitada com 10 termos deve retornar 10 respostas no gabarito",
  );
  for (let index = 1; index <= 10; index++) {
    assert.match(intertextualityKey, new RegExp(`^${index}\\.`, "m"));
  }
  assert.match(intertextualityKey, /Ep\u00edgrafe|Cita\u00e7\u00e3o|Adapta\u00e7\u00e3o|Alus\u00e3o/);
  assert.match(String(intertextualityOutput.visualHtml || ""), /in\u00edcio|rela\u00e7\u00e3o|inten\u00e7\u00e3o|recria\u00e7\u00e3o/);

  const internalInstructionOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Divisão celular",
    componenteCurricular: "Ciências",
    anoSerie: "7º ano",
    etapa: "Ensino Fundamental",
    quantidade: 10,
    observacoes:
      "Qualidade obrigatória da cruzadinha: priorize termos centrais do conteúdo, crie pistas contextualizadas e garanta gabarito confiável.",
  });
  assert.doesNotMatch(
    String(internalInstructionOutput.visualHtml || ""),
    /QUALIDADE|OBRIGATORIA|GABARITO CONFIAVEL/i,
    "instruções internas não podem virar conteúdo da cruzadinha",
  );

  const smallOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Divisão celular",
    componenteCurricular: "Ciências",
    anoSerie: "7º ano",
    etapa: "Ensino Fundamental",
    quantidade: 5,
    conteudos:
      "Palavras sugeridas pelo professor: MITOSE, MEIOSE, CELULA, NUCLEO, DNA",
  });
  assert.ok(
    (smallOutput.gabarito || []).length >= 5,
    "cruzadinha deve aceitar 5 palavras",
  );

  const largeOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Sistema solar",
    componenteCurricular: "Ciências",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    quantidade: 20,
    conteudos:
      "Palavras sugeridas pelo professor: SOL, LUA, TERRA, MARTE, VENUS, JUPITER, SATURNO, URANO, NETUNO, MERCURIO, ORBITA, PLANETA, COMETA, ASTEROIDE, GALAXIA, ESTRELA, GRAVIDADE, ECLIPSE, ROTACAO, TRANSLACAO",
  });
  assert.ok(
    (largeOutput.gabarito || []).length >= 15,
    "cruzadinha deve aceitar grades maiores quando o professor escolher 20 palavras",
  );
  assert.ok(
    (largeOutput.gabarito || []).length <= 20,
    "cruzadinha grande não deve ultrapassar 20 palavras",
  );
  assert.match(
    String(largeOutput.visualHtml || ""),
    /planify-crossword-print--large|planify-crossword-print--xl/,
  );

  const scopedOutput = buildVisualGameMaterial({
    tipo: "jogo",
    modeloJogo: "cruzadinha",
    tema: "Ciclo da água",
    componenteCurricular: "Ciências",
    anoSerie: "6º ano",
    etapa: "Ensino Fundamental",
    quantidade: 10,
    conteudos:
      "Palavras sugeridas pelo professor: EVAPORACAO, CONDENSACAO, PRECIPITACAO, INFILTRACAO",
  });
  const allowedScopedTerms = new Set([
    "EVAPORACAO",
    "CONDENSACAO",
    "PRECIPITACAO",
    "INFILTRACAO",
  ]);
  const scopedTerms = (scopedOutput.gabarito || [])
    .map((entry) =>
      String(entry)
        .match(/^\d+\.\s+(.+?)\s+-/)?.[1]
        ?.normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase(),
    )
    .filter(Boolean);
  assert.ok(scopedTerms.length > 0, "cruzadinha deve usar termos do conteúdo informado");
  assert.ok(
    scopedTerms.every((term) => allowedScopedTerms.has(term)),
    `cruzadinha não pode misturar conteúdos: ${scopedTerms.join(", ")}`,
  );

  const cruzadinhaRequest = {
    tipoMaterial: "cruzadinha",
    quantidade: 8,
    tema: "Divisão celular",
  };
  const strongIssues = getEngineOutputIssues(cruzadinhaRequest, {
    game: {
      components: [
        "MITOSE: Divisão celular que origina células com mesmo conjunto genético.",
        "MEIOSE: Processo que reduz pela metade o número de cromossomos nos gametas.",
        "NUCLEO: Estrutura central que guarda material genético e coordena atividades.",
        "DNA: Molécula que armazena instruções hereditárias dos seres vivos.",
        "GENETICA: Área que estuda hereditariedade e variação entre organismos.",
        "CROMOSSOMO: Estrutura condensada formada por material genético e proteínas.",
        "PROFASE: Etapa em que os cromossomos ficam visíveis no início da divisão.",
        "CELULA: Unidade básica dos seres vivos, com estruturas que executam funções.",
      ],
      rules: ["Resolver individualmente.", "Corrigir coletivamente com justificativas."],
    },
  });
  assert.deepEqual(strongIssues, []);

  const weakIssues = getEngineOutputIssues(cruzadinhaRequest, {
    game: {
      components: [
        "CONCEITO: conceito",
        "EXEMPLO: exemplo",
        "MEIOSE: pista que entrega meiose literalmente",
      ],
      rules: [],
    },
  });
  assert.ok(weakIssues.some((issue) => /termos distintos/i.test(issue)));
  assert.ok(weakIssues.some((issue) => /gen[eé]ricos/i.test(issue)));
  assert.ok(weakIssues.some((issue) => /entreg|resposta/i.test(issue)));
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
  const { UNIFIED_MIN_QUALITY_SCORE } = loadTsModule(
    "src/lib/materiais/unified-quality-gate.ts",
  );

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
  assert.ok(goodPei.qualityScore >= UNIFIED_MIN_QUALITY_SCORE);

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
  assert.ok(goodInclusao.qualityScore >= UNIFIED_MIN_QUALITY_SCORE);

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
  assert.ok(goodCorrection.qualityScore >= UNIFIED_MIN_QUALITY_SCORE);

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
  runTest("plano-aula-quality-gate", testPlanoAulaQualityGate);
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
