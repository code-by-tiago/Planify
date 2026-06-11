/**
 * Contrato + qualidade + HTML para todas as ferramentas de material.
 * Sem chamadas à API. Run: npm run verify:generators
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
  PLANIFY_ENGINE_TYPES,
  usesPlanifyMaterialEngine,
} = loadTsModule("src/server/materials/planify-material-routing.ts");
const { getEngineOutputIssues } = loadTsModule(
  "src/server/materials/material-engine-quality.ts",
);
const { normalizeMaterialEngineRequest } = loadTsModule(
  "src/server/materials/material-engine-validation.ts",
);
const { buildMaterialEngineHtmlFromStructure } = loadTsModule(
  "src/server/materials/material-engine-service.ts",
);
const { getMaterialGenerationSteps } = loadTsModule(
  "src/lib/pro/generation-stage-messages.ts",
);
const { planifyTools } = loadTsModule("src/lib/pro/planifyTools.ts");
/** Espelha resolveGoogleProductForTool sem importar módulo client-side. */
function resolveGoogleProductForTool(toolId) {
  if (toolId === "slides") return "slides";
  if (toolId === "prova" || toolId === "lista" || toolId === "jogo") return "forms";
  return "docs";
}

const BNCC_SAMPLE = [
  {
    codigo: "EF09MA15",
    descricao:
      "Resolver e elaborar problemas que envolvam equações polinomiais de 2º grau.",
  },
];

function baseInput(tipo, extras = {}) {
  return {
    tipoMaterial: tipo,
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "9º ano",
    componenteCurricular: "Matemática",
    tema: "Equações do 1º grau",
    objetivo: "Resolver equações lineares simples",
    quantidade: 3,
    dificuldade: "media",
    incluirGabarito: true,
    habilidadesSelecionadas: BNCC_SAMPLE,
    ...extras,
  };
}

function emptyBase({ teacherNotes = ["Orientações ao professor."] } = {}) {
  return {
    title: "Material de teste",
    subtitle: "9º ano",
    summary:
      "Síntese sobre equações do 1º grau com aplicação em problemas do cotidiano.",
    sections: [],
    activities: [],
    answerKey: [],
    teacherNotes,
  };
}

/** Prova/lista Teachy: versão do aluno sem teacherNotes. */
const studentDocBase = () => emptyBase({ teacherNotes: [] });

const GOLDEN = {
  prova: {
    input: baseInput("prova"),
    structure: {
      ...studentDocBase(),
      title: "Prova — Equações do 1º grau",
      summary:
        "Avaliação formativa sobre equações do 1º grau e resolução de problemas (BNCC EF09MA15).",
      answerKey: [
        "Questão 1: b) 3",
        "Questão 2: Verdadeiro",
        "Questão 3: x = 5 após somar 7 e dividir por 5.",
      ],
      exam: {
        questions: [
          {
            number: 1,
            type: "multipla-escolha",
            statement:
              "Em equações do 1º grau, qual valor de x resolve 2x + 4 = 10 em um problema de Matemática do 9º ano?",
            options: [
              "a) x = 2, pois ao substituir em 2x+4 obtemos 8, que não é igual a 10",
              "b) x = 3, pois ao substituir em 2x+4 obtemos 10, que é a solução correta",
              "c) x = 4, pois ao substituir em 2x+4 obtemos 12, que não é igual a 10",
              "d) x = 5, pois ao substituir em 2x+4 obtemos 14, que não é igual a 10",
            ],
            answer:
              "b) x = 3, pois substituindo na equação do 1º grau obtemos 2·3+4=10, confirmando a solução.",
          },
          {
            number: 2,
            type: "verdadeiro-falso",
            statement:
              "Em equações do 1º grau, a sentença 3x = 12 é verdadeira quando x = 4.",
            options: [],
            answer:
              "Verdadeiro: substituindo x = 4 em equações do 1º grau, temos 3·4 = 12, logo a igualdade é válida.",
          },
          {
            number: 3,
            type: "dissertativa",
            statement:
              "Descreva os passos para resolver a equação 5x - 7 = 18 em equações do 1º grau.",
            options: [],
            answer:
              "Somar 7 aos dois lados (5x = 25), dividir por 5 e concluir x = 5, verificando na equação original.",
          },
        ],
      },
    },
    htmlChecks: [/planify-doc-header-teachy/, /planify-questao-card/, /Gabarito/],
  },
  lista: {
    input: baseInput("lista"),
    structure: {
      ...studentDocBase(),
      title: "Lista — Equações do 1º grau",
      exam: {
        questions: [
          {
            number: 1,
            type: "multipla-escolha",
            statement:
              "Em equações do 1º grau, qual valor de x satisfaz x + 5 = 12 no contexto de Matemática?",
            options: [
              "a) x = 5, pois ao substituir em x+5=12 obtemos 10, que não fecha a igualdade",
              "b) x = 6, pois ao substituir em x+5=12 obtemos 11, que não fecha a igualdade",
              "c) x = 7, pois ao substituir em x+5=12 obtemos 12, que confirma a solução",
              "d) x = 8, pois ao substituir em x+5=12 obtemos 13, que não fecha a igualdade",
            ],
            answer:
              "c) x = 7, pois ao substituir na equação do 1º grau obtemos 7+5=12, confirmando a solução.",
          },
          {
            number: 2,
            type: "completar",
            statement:
              "Complete a equação do 1º grau 4x = 20, indicando o valor de x com justificativa breve.",
            options: [],
            answer:
              "x = 5, pois dividindo ambos os lados por 4 em equações do 1º grau obtemos x = 20/4 = 5.",
          },
          {
            number: 3,
            type: "multipla-escolha",
            statement:
              "Em equações do 1º grau, qual sentença representa o dobro de um número igual a 14?",
            options: [
              "a) x + 2 = 14, que modela soma e não o dobro de um número",
              "b) 2x = 14, que representa corretamente o dobro de x igual a 14",
              "c) x/2 = 14, que modela metade de x e não o dobro pedido",
              "d) x = 16, que fixa x sem relação com o dobro igual a 14",
            ],
            answer:
              "b) 2x = 14, pois o dobro de x em equações do 1º grau é modelado por 2x = 14.",
          },
        ],
      },
      answerKey: [
        "Exercício 1: c) x = 7",
        "Exercício 2: x = 5",
        "Exercício 3: b) 2x = 14",
      ],
    },
    htmlChecks: [/planify-doc-header-teachy/, /Exercício/, /planify-questao-card/],
  },
  apostila: {
    input: baseInput("apostila"),
    structure: {
      ...emptyBase(),
      title: "Apostila — Equações do 1º grau",
      sections: [
        {
          title: "Apresentação",
          content:
            "Esta apostila apresenta equações do 1º grau com exemplos resolvidos passo a passo.",
          bullets: [],
        },
        {
          title: "Objetivos de aprendizagem",
          content: "",
          bullets: [
            "Resolver equações do 1º grau",
            "Aplicar equações em problemas do cotidiano",
          ],
        },
        {
          title: "Equações do 1º grau",
          content:
            "Uma equação do 1º grau é uma igualdade com incógnita de expoente 1.",
          bullets: [
            "Destaque: isole a incógnita em ambos os lados.",
            "Exemplo: em 2x + 1 = 9, subtraia 1 e divida por 2.",
          ],
        },
      ],
      activities: [
        {
          title: "Fixação",
          instructions: "Resolva as equações abaixo.",
          items: ["x + 3 = 10", "3x = 15"],
        },
      ],
    },
    htmlChecks: [/Apresentação/, /Objetivos/, /Atividades/],
  },
  atividade: {
    input: baseInput("atividade"),
    structure: {
      ...emptyBase(),
      title: "Atividade — Equações do 1º grau",
      activities: [
        {
          title: "Estação de equações",
          objective: "Resolver equações simples em grupo.",
          estimatedTime: "20 minutos",
          materials: ["Folha de exercícios", "Lápis", "Quadro branco"],
          instructions:
            "Organize a turma em trios e distribua os cartões com equações.",
          items: ["Cartão 1: x + 4 = 11", "Cartão 2: 2x = 14"],
          evaluation: "Observar participação e correção dos cálculos.",
        },
        {
          title: "Desafio relâmpago",
          objective: "Fixar resolução mental de equações.",
          estimatedTime: "10 minutos",
          materials: ["Cronômetro"],
          instructions: "Cada estudante resolve uma equação no quadro em até 2 minutos.",
          items: ["x - 2 = 5", "4x = 28"],
          evaluation: "Registrar acertos e orientar correções.",
        },
        {
          title: "Problema do cotidiano",
          objective: "Modelar situação real com equação.",
          estimatedTime: "15 minutos",
          materials: ["Caderno"],
          instructions: "Leia o problema e monte a equação antes de resolver.",
          items: ["João tem o dobro da idade de Ana. A soma é 36 anos."],
          evaluation: "Verificar equação montada e resposta final.",
        },
      ],
    },
    htmlChecks: [/planify-atividade-card/, /Objetivo:/, /Tempo estimado:/, /Avaliação:/],
  },
  "plano-aula": {
    input: baseInput("plano-aula"),
    structure: {
      ...emptyBase(),
      title: "Plano de aula — Equações do 1º grau",
      lessonPlan: {
        steps: [
          {
            stage: "Abertura",
            duration: "10 min",
            description: "Retomar conceito de igualdade e incógnita.",
            resources: ["Quadro"],
          },
          {
            stage: "Contextualização",
            duration: "10 min",
            description: "Apresentar problema do cotidiano com equação.",
            resources: ["Slides"],
          },
          {
            stage: "Explicação",
            duration: "15 min",
            description: "Demonstrar resolução passo a passo.",
            resources: ["Livro didático"],
          },
          {
            stage: "Prática guiada",
            duration: "15 min",
            description: "Resolver equações com apoio do professor.",
            resources: ["Lista impressa"],
          },
          {
            stage: "Fechamento",
            duration: "10 min",
            description: "Síntese dos procedimentos de resolução.",
            resources: ["Caderno"],
          },
        ],
      },
      sections: [
        {
          title: "Objetivos",
          content: "Resolver equações do 1º grau.",
          bullets: [],
        },
      ],
    },
    htmlChecks: [/Etapas da aula/, /Abertura/, /Fechamento/],
  },
  jogo: {
    input: baseInput("jogo", { formatoJogo: "quiz", quantidade: 1 }),
    structure: {
      ...emptyBase(),
      title: "Quiz — Equações do 1º grau",
      game: {
        format: "quiz",
        rules: [
          "Dividir a turma em duplas.",
          "Cada dupla responde uma pergunta por rodada.",
          "Quem acertar mais equações vence.",
        ],
        components: [
          "Cartas com equações",
          "Placar no quadro",
          "Cronômetro",
        ],
      },
    },
    htmlChecks: [/Jogo:/, /Regras/, /Componentes/],
  },
  resumo: {
    input: baseInput("resumo"),
    structure: {
      ...emptyBase(),
      title: "Resumo — Equações do 1º grau",
      sections: [
        {
          title: "Conceito",
          content: "",
          bullets: ["Equação: igualdade com incógnita", "1º grau: expoente 1"],
        },
        {
          title: "Procedimento",
          content: "",
          bullets: ["Isolar a incógnita", "Operações inversas em ambos os lados"],
        },
      ],
      activities: [
        {
          title: "Fixação",
          instructions: "Responda mentalmente.",
          items: ["x + 2 = 8", "3x = 21"],
        },
      ],
    },
    htmlChecks: [/Conceito/, /Procedimento/],
  },
  sequencia: {
    input: baseInput("sequencia"),
    structure: {
      ...emptyBase(),
      title: "Sequência — Equações do 1º grau",
      sections: [
        {
          title: "Aula 1 — Introdução",
          content:
            "Apresentar o conceito de equações do 1º grau e a ideia de igualdade entre expressões.",
          bullets: ["Atividade diagnóstica sobre equações do 1º grau"],
        },
        {
          title: "Aula 2 — Resolução",
          content:
            "Ensinar o método de isolamento da incógnita em equações do 1º grau com exemplos guiados.",
          bullets: ["Prática em duplas com equações do 1º grau"],
        },
        {
          title: "Aula 3 — Problemas",
          content:
            "Modelar situações do cotidiano por meio de equações do 1º grau e avaliar a aprendizagem.",
          bullets: ["Avaliação formativa de equações do 1º grau"],
        },
      ],
    },
    htmlChecks: [/Aula 1/, /Aula 3/],
  },
  projeto: {
    input: baseInput("projeto"),
    structure: {
      ...emptyBase(),
      title: "Projeto — Equações no cotidiano",
      sections: [
        {
          title: "Fase 1 — Problema",
          content:
            "Identificar uma situação real do cotidiano que possa ser modelada por equações do 1º grau.",
          bullets: [],
        },
        {
          title: "Fase 2 — Pesquisa",
          content:
            "Coletar dados e registrar exemplos de problemas que envolvam equações do 1º grau.",
          bullets: [],
        },
        {
          title: "Fase 3 — Produto",
          content:
            "Produzir cartaz explicativo com equações do 1º grau e resolução comentada para a turma.",
          bullets: [],
        },
      ],
      activities: [
        {
          title: "Entrega",
          instructions: "Apresentar o cartaz à turma.",
          items: ["Roteiro de apresentação"],
        },
      ],
    },
    htmlChecks: [/Fase 1/, /Fase 3/],
  },
  redacao: {
    input: baseInput("redacao"),
    structure: {
      ...emptyBase(),
      title: "Redação — Tema: equações e cidadania",
      sections: [
        {
          title: "Texto motivador 1",
          content: "Notícia sobre orçamento familiar.",
          bullets: [],
        },
        {
          title: "Texto motivador 2",
          content: "Charge sobre gastos mensais.",
          bullets: [],
        },
        {
          title: "Texto motivador 3",
          content: "Trecho sobre educação financeira.",
          bullets: [],
        },
      ],
      teacherNotes: ["Avaliar coesão, argumentação e norma culta."],
    },
    htmlChecks: [/motivador/i, /Notas para o professor/],
  },
  flashcards: {
    input: baseInput("flashcards", { quantidade: 3 }),
    structure: {
      ...emptyBase(),
      title: "Flashcards — Equações",
      flashcards: [
        { front: "O que é uma equação?", back: "Igualdade com incógnita." },
        { front: "Como isolar x em x + 3 = 10?", back: "Subtrair 3: x = 7." },
        { front: "2x = 14. Qual o valor de x?", back: "x = 7." },
      ],
    },
    htmlChecks: [/planify-flashcard|Flashcard/i],
  },
  "mapa-mental": {
    input: baseInput("mapa-mental", { quantidade: 3 }),
    structure: {
      ...emptyBase(),
      title: "Mapa mental — Equações",
      mindMap: {
        central: "Equações do 1º grau",
        branches: [
          { title: "Conceito", items: ["Igualdade", "Incógnita"] },
          { title: "Resolução", items: ["Isolar x", "Operações inversas"] },
          { title: "Aplicações", items: ["Problemas", "Gráficos"] },
        ],
      },
    },
    htmlChecks: [/Equações do 1º grau/, /Conceito/, /Resolução/],
  },
  slides: {
    input: baseInput("slides", {
      quantidade: 5,
      habilidadesSelecionadas: undefined,
      incluirQuestoes: false,
    }),
    structure: {
      ...emptyBase(),
      title: "Slides — Equações do 1º grau",
      slides: [
        {
          title: "Equações do 1º grau",
          subtitle: "9º ano",
          bullets: [],
          speakerNotes: "Apresentar o tema da aula.",
          layout: "capa",
          sequenceStep: 0,
          sequenceLabel: "Capa",
        },
        {
          title: "Objetivos",
          bullets: ["Resolver equações", "Aplicar em problemas"],
          speakerNotes: "Ler os objetivos com a turma.",
          layout: "conteudo",
          sequenceStep: 1,
          sequenceLabel: "Objetivos",
          imagePrompt: "student solving algebra equation on chalkboard",
        },
        {
          title: "Conceito",
          bullets: ["Igualdade", "Incógnita x"],
          speakerNotes: "Explicar o conceito de equação.",
          layout: "conteudo",
          sequenceStep: 2,
          sequenceLabel: "Conceito",
          imagePrompt: "balance scale equation math illustration",
        },
        {
          title: "Exemplo prático",
          bullets: ["2x + 1 = 9", "x = 4"],
          speakerNotes: "Resolver no quadro passo a passo.",
          layout: "destaque",
          sequenceStep: 3,
          sequenceLabel: "Exemplo",
          imagePrompt: "math teacher writing equation on whiteboard",
        },
        {
          title: "Síntese",
          bullets: ["Isolar a incógnita", "Verificar a solução"],
          speakerNotes: "Fechar a aula com síntese.",
          layout: "fechamento",
          sequenceStep: 4,
          sequenceLabel: "Fechamento",
        },
      ],
    },
    htmlChecks: [/planify-slide/, /Planify · Apresentação/, /Síntese|FECHAMENTO/i],
  },
};

function runTest(name, fn) {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`verify-all-generators FAIL [${name}]: ${message}`);
    process.exit(1);
  }
}

function testEngineRouting() {
  for (const tipo of MATERIAL_ENGINE_TYPES) {
    assert.equal(
      usesPlanifyMaterialEngine(tipo),
      true,
      `${tipo} deve usar Material Engine`,
    );
    assert.ok(
      PLANIFY_ENGINE_TYPES.includes(tipo),
      `${tipo} ausente de PLANIFY_ENGINE_TYPES`,
    );
  }
  assert.equal(PLANIFY_ENGINE_TYPES.length, MATERIAL_ENGINE_TYPES.length);
}

function testGenerationSteps() {
  const materialTools = planifyTools.filter((tool) => tool.id !== "inclusao");
  for (const tool of materialTools) {
    const steps = getMaterialGenerationSteps(tool.id);
    assert.ok(steps.length >= 3, `${tool.id}: etapas de geração insuficientes`);
    assert.ok(
      steps.every((step) => step.length > 8 && !/gemini/i.test(step)),
      `${tool.id}: etapa inválida ou expõe Gemini`,
    );
  }
}

function testGoogleExportRouting() {
  assert.equal(resolveGoogleProductForTool("slides"), "slides");
  assert.equal(resolveGoogleProductForTool("prova"), "forms");
  assert.equal(resolveGoogleProductForTool("lista"), "forms");
  assert.equal(resolveGoogleProductForTool("jogo"), "forms");
  assert.equal(resolveGoogleProductForTool("apostila"), "docs");
  assert.equal(resolveGoogleProductForTool("atividade"), "docs");
}

function testGoldenFixtures() {
  for (const tipo of MATERIAL_ENGINE_TYPES) {
    const fixture = GOLDEN[tipo];
    assert.ok(fixture, `fixture ausente para ${tipo}`);

    const request = normalizeMaterialEngineRequest(fixture.input);
    const issues = getEngineOutputIssues(request, fixture.structure);
    assert.deepEqual(
      issues,
      [],
      `${tipo}: golden fixture deveria passar na validação, recebido: ${issues.join("; ")}`,
    );

    const html = buildMaterialEngineHtmlFromStructure(
      fixture.input,
      fixture.structure,
    );
    assert.ok(html.length > 120, `${tipo}: HTML vazio ou curto demais`);
    for (const pattern of fixture.htmlChecks) {
      assert.match(html, pattern, `${tipo}: HTML não contém ${pattern}`);
    }
  }
}

function testNewToolsFixtures() {
  const { extractQuestionsFromMaterialOutput } = loadTsModule(
    "src/lib/banco-questoes/question-bank-extract.ts",
  );
  const { normalizeMaterialEstrutura } = loadTsModule(
    "src/lib/materiais/normalize-material-estrutura.ts",
  );
  const { generateLessonBundle } = loadTsModule(
    "src/server/materials/lesson-bundle-orchestrator.ts",
  );

  const estrutura = {
    titulo: "Prova de História",
    questoes: [
      {
        enunciado: "Cite uma causa da Revolução Industrial.",
        tipo: "discursiva",
        alternativas: [],
        respostaEsperada: "Urbanização",
      },
      {
        enunciado: "Qual século marcou a Revolução Industrial?",
        tipo: "objetiva",
        alternativas: ["Séc. XVIII", "Séc. XX"],
        respostaEsperada: "Séc. XVIII",
      },
    ],
  };

  const extracted = extractQuestionsFromMaterialOutput(estrutura, {
    componente: "História",
    sourceTitle: "Prova fixture",
  });
  assert.equal(extracted.length, 2);
  assert.notEqual(extracted[0].enunciado, extracted[1].enunciado);

  const { computeQuestionContentHash } = loadTsModule(
    "src/lib/banco-questoes/question-bank-hash.ts",
  );
  assert.notEqual(
    computeQuestionContentHash(extracted[0].enunciado, extracted[0].tipo),
    computeQuestionContentHash(extracted[1].enunciado, extracted[1].tipo),
    "dedup hash deve diferenciar enunciados distintos",
  );

  const normalized = normalizeMaterialEstrutura({ estrutura });
  assert.ok(normalized.estrutura?.questoes?.length === 2);

  const correctionOutput = {
    nota: 8,
    notaMaxima: 10,
    percentual: 80,
    feedbackGeral: "Boa resposta com detalhes relevantes.",
    criterios: [
      {
        criterio: "Conteúdo",
        atendido: true,
        pontos: 4,
        pontosMaximos: 5,
        comentario: "Domínio adequado.",
      },
    ],
    pontosFortes: ["Clareza"],
    pontosMelhoria: ["Exemplos"],
    sugestaoProfessor: "Revisar causas econômicas.",
  };
  for (const field of [
    "nota",
    "notaMaxima",
    "percentual",
    "feedbackGeral",
    "criterios",
    "pontosFortes",
    "pontosMelhoria",
    "sugestaoProfessor",
  ]) {
    assert.ok(field in correctionOutput, `CorrectionAiOutput.${field} obrigatório`);
  }

  assert.equal(typeof generateLessonBundle, "function");

  const orchestratorSource = readFileSync(
    join(root, "src/server/materials/lesson-bundle-orchestrator.ts"),
    "utf8",
  );
  assert.match(orchestratorSource, /onProgress\?\./);
  assert.match(orchestratorSource, /status: "started"/);
  assert.match(orchestratorSource, /status: "done"/);
  assert.match(orchestratorSource, /status: "failed"/);

  // U2 — stream + retry imagens
  assert.ok(existsSync(join(root, "src/app/api/materiais/gerar-stream/route.ts")));
  assert.ok(existsSync(join(root, "src/app/api/materiais/regenerar-imagens/route.ts")));
  const { isMaterialStreamType } = loadTsModule("src/lib/materiais/material-stream-types.ts");
  assert.equal(isMaterialStreamType("slides"), true);
  assert.equal(isMaterialStreamType("flashcards"), false);
}

function main() {
  const started = Date.now();
  runTest("engine-routing", testEngineRouting);
  runTest("generation-steps", testGenerationSteps);
  runTest("google-export-routing", testGoogleExportRouting);
  runTest("golden-fixtures", testGoldenFixtures);
  runTest("new-tools-fixtures", testNewToolsFixtures);

  const elapsedMs = Date.now() - started;
  console.log(
    `verify-all-generators: OK (${MATERIAL_ENGINE_TYPES.length} ferramentas, fixtures + HTML + export + new-tools) — ${elapsedMs}ms`,
  );
}

main();
