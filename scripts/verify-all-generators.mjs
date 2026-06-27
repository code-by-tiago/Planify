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
const { resolvePreparedExportBody, buildEditorExportHtmlForProfile } =
  loadTsModule("src/server/export/editor-html-export-service.ts");
const { htmlBodyToWordXmlParts } = loadTsModule(
  "src/server/docx/html-to-native-docx.ts",
);
const { parseQuizQuestionsFromHtml } = loadTsModule(
  "src/server/google/parse-quiz-from-html.ts",
);
const { stripTeacherOnlyExportBlocks } = loadTsModule(
  "src/server/editor/prepare-export-html.ts",
);
const { parseSlidesFromPlanifyHtml, extractSlideThemeFromHtml } = loadTsModule(
  "src/server/materials/slide-html-parser.ts",
);
const { resolveClassroomExportForHtml } = loadTsModule(
  "src/lib/export/classroom-export-format.ts",
);
const { materialExportAllows } = loadTsModule(
  "src/lib/export/material-export-policy.ts",
);
/** Espelha resolveGoogleProductForTool sem importar módulo client-side. */
function resolveGoogleProductForTool(toolId) {
  if (toolId === "slides") return "slides";
  if (toolId === "prova" || toolId === "lista") return "forms";
  const PDF_ONLY = new Set(["jogo", "cruzadinha", "flashcards", "mapa-mental"]);
  if (PDF_ONLY.has(toolId)) return null;
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
              "Substituindo x = 2 em 2x+4 obtemos 8, que não é igual a 10",
              "Substituindo x = 3 em 2x+4 obtemos 10, que confirma a solução correta",
              "Substituindo x = 4 em 2x+4 obtemos 12, que não é igual a 10",
              "Substituindo x = 5 em 2x+4 obtemos 14, que não é igual a 10",
              "Substituindo x = 6 em 2x+4 obtemos 16, que não é igual a 10",
            ],
            answer:
              "x = 3, pois substituindo na equação do 1º grau obtemos 2·3+4=10, confirmando a solução.",
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
              "Substituindo x = 5 em x+5=12 obtemos 10, que não fecha a igualdade",
              "Substituindo x = 6 em x+5=12 obtemos 11, que não fecha a igualdade",
              "Substituindo x = 7 em x+5=12 obtemos 12, que confirma a solução",
              "Substituindo x = 8 em x+5=12 obtemos 13, que não fecha a igualdade",
              "Substituindo x = 9 em x+5=12 obtemos 14, que não fecha a igualdade",
            ],
            answer:
              "x = 7, pois ao substituir na equação do 1º grau obtemos 7+5=12, confirmando a solução.",
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
              "x + 2 = 14, que modela soma e não o dobro de um número",
              "2x = 14, que representa corretamente o dobro de x igual a 14",
              "x/2 = 14, que modela metade de x e não o dobro pedido",
              "x = 16, que fixa x sem relação com o dobro igual a 14",
              "2x = 7, que não representa o dobro de x igual a 14",
            ],
            answer:
              "2x = 14, pois o dobro de x em equações do 1º grau é modelado por 2x = 14.",
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
          objective:
            "Resolver equações do 1º grau em grupo, registrando estratégias e justificativas matemáticas.",
          estimatedTime: "20 minutos",
          materials: ["Folha de exercícios", "Lápis", "Quadro branco"],
          instructions:
            "Organize a turma em trios, distribua cartões com equações e peça que cada grupo registre o procedimento antes de socializar uma estratégia.",
          items: [
            "a) Observe o cartão 1: x + 4 = 11 e identifique a operação que precisa ser desfeita.",
            "b) Interprete o cartão 2: 2x = 14 e explique qual operação inversa resolve a equação.",
            "c) Resolva cada cartão registrando uma etapa por linha no caderno.",
            "d) Justifique por que a solução encontrada mantém a igualdade verdadeira.",
            "e) Produza um novo cartão de equação e entregue a outro trio para resolver.",
          ],
          evaluation:
            "Observar participação, registro das etapas, uso correto das operações inversas e clareza da justificativa apresentada.",
        },
        {
          title: "Desafio relâmpago",
          objective:
            "Fixar a resolução mental de equações simples sem perder o registro do raciocínio utilizado.",
          estimatedTime: "10 minutos",
          materials: ["Cronômetro", "Quadro branco", "Pincel"],
          instructions:
            "Chame estudantes em rodadas curtas, apresente uma equação por vez e peça que todos registrem mentalmente a estratégia antes da resposta no quadro.",
          items: [
            "a) Leia x - 2 = 5 e diga qual número precisa ser somado aos dois membros.",
            "b) Compare com 4x = 28 e identifique a operação inversa necessária.",
            "c) Resolva as duas equações e confira substituindo o valor de x.",
            "d) Justifique oralmente uma das respostas usando a ideia de equilíbrio.",
            "e) Crie uma equação relâmpago para um colega resolver em até 2 minutos.",
          ],
          evaluation:
            "Registrar acertos, identificar erros de operação inversa e orientar correções com base na explicação do estudante.",
        },
        {
          title: "Problema do cotidiano",
          objective:
            "Modelar uma situação cotidiana com equação do 1º grau, resolvendo e interpretando a resposta final.",
          estimatedTime: "15 minutos",
          materials: ["Caderno", "Lápis", "Ficha do problema"],
          instructions:
            "Apresente a situação, peça leitura silenciosa, destaque dos dados e montagem da equação antes de qualquer cálculo numérico.",
          items: [
            "a) Leia: João tem o dobro da idade de Ana e a soma das idades é 36 anos.",
            "b) Identifique a incógnita e represente a idade de cada pessoa com expressões algébricas.",
            "c) Monte a equação correspondente e resolva passo a passo.",
            "d) Justifique se a resposta faz sentido dentro da situação apresentada.",
            "e) Produza um novo problema de idade que possa ser resolvido por equação do 1º grau.",
          ],
          evaluation:
            "Verificar modelagem, resolução, interpretação da resposta e coerência do problema criado pelo estudante.",
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
            description:
              "Professor demonstra resolução passo a passo no quadro; estudantes registram procedimentos no caderno.",
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
            description:
              "Professor sintetiza procedimentos de resolução; estudantes registram aprendizagens no caderno.",
            resources: ["Caderno"],
          },
        ],
      },
      sections: [
        {
          title: "Objetivos",
          content: "Resolver equações do 1º grau com procedimentos algébricos.",
          bullets: ["Identificar incógnita", "Aplicar propriedades da igualdade"],
        },
        {
          title: "Desenvolvimento",
          content: "Sequência de explicação, prática guiada e autônoma.",
          bullets: [],
        },
        {
          title: "Recursos e avaliação",
          content: "Observação formativa durante a prática e registro no caderno.",
          bullets: [],
        },
      ],
      activities: [
        {
          title: "Prática em duplas",
          objective: "Resolver equações do 1º grau aplicando propriedades da igualdade.",
          estimatedTime: "15 min",
          materials: ["Lista impressa", "Lápis", "Caderno"],
          instructions:
            "Orientar duplas a resolver três equações com apoio do professor e registro no caderno.",
          items: [
            "a) Leiam o enunciado e identifiquem a incógnita.",
            "b) Isolem o termo com a incógnita.",
            "c) Apliquem a operação inversa em ambos os lados.",
            "d) Verifiquem a solução substituindo na equação original.",
            "e) Registrem o procedimento usado em cada passo.",
          ],
          evaluation: "Observar clareza do procedimento e participação nas duplas.",
        },
      ],
      scheduleTables: [
        {
          title: "Cronograma da aula",
          headers: ["Etapa", "Duração", "Atividade", "Recursos"],
          rows: [
            ["Abertura", "10 min", "Retomar conceitos", "Quadro"],
            ["Explicação", "15 min", "Modelagem passo a passo", "Slides"],
            ["Prática", "15 min", "Resolver equações", "Lista"],
            ["Fechamento", "10 min", "Síntese", "Caderno"],
          ],
        },
      ],
    },
    htmlChecks: [/planify-cronograma-table/, /Cronograma da aula/, /Abertura/, /Fechamento/],
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
  cruzadinha: {
    input: baseInput("cruzadinha", { quantidade: 10, formatoJogo: "cruzadinha" }),
    structure: {
      ...emptyBase(),
      title: "Cruzadinha — Equações do 1º grau",
      game: {
        format: "cruzadinha",
        rules: ["Individual ou dupla", "Conferir em correção coletiva"],
        components: [
          "EQUACAO: Igualdade com incognita de primeiro grau",
          "INCOGNITA: Letra que representa valor desconhecido",
          "COEFICIENTE: Numero que multiplica a incognita",
          "SOLUCAO: Valor que torna a igualdade verdadeira",
          "IGUALDADE: Relacao entre duas expressoes equivalentes",
          "ADICAO: Operacao usada para isolar termos positivos",
          "SUBTRACAO: Operacao inversa da adicao",
          "MULTIPLICACAO: Operacao para resolver coeficientes",
          "DIVISAO: Operacao inversa da multiplicacao",
          "VERIFICACAO: Substituir o valor encontrado na equacao original",
        ],
      },
    },
    htmlChecks: [
      /planify-jogo-visual/,
      /planify-game-table--crossword/,
      /Cruzadinha/,
    ],
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
          title: "Tema e comando",
          content:
            "Produza um texto dissertativo-argumentativo sobre o uso de equações e educação financeira na vida cidadã. Defenda um ponto de vista, use repertório pertinente e proponha uma conclusão coerente para estudantes do 9º ano.",
          bullets: [
            "Gênero: texto dissertativo-argumentativo escolar",
            "Finalidade: defender uma ideia com argumentos e exemplos",
          ],
        },
        {
          title: "Texto motivador 1",
          content:
            "Uma reportagem sobre orçamento familiar mostra que muitas famílias registram gastos mensais em tabelas para comparar renda, despesas fixas e compras variáveis. Quando os estudantes compreendem relações entre valores, conseguem planejar escolhas financeiras com mais autonomia.",
          bullets: [],
        },
        {
          title: "Texto motivador 2",
          content:
            "Uma charge apresenta um jovem tentando descobrir quanto pode economizar por mês depois de separar transporte, alimentação e lazer. A situação evidencia como a linguagem matemática pode apoiar decisões cotidianas e evitar consumo por impulso.",
          bullets: [],
        },
        {
          title: "Texto motivador 3",
          content:
            "Um trecho de material escolar afirma que educação financeira não se resume a calcular dinheiro, mas envolve interpretar problemas, justificar escolhas e avaliar consequências. Nesse processo, equações simples ajudam a representar metas e limites.",
          bullets: [],
        },
      ],
      teacherNotes: [
        "Avaliar adequação ao tema, repertório usado para sustentar a argumentação, coesão entre parágrafos, linguagem adequada ao gênero e conclusão coerente com a tese.",
      ],
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

/**
 * Tokens que DEVEM sobreviver à conversão de cada ferramenta.
 * docxText: substrings no texto extraído do XML WordML (mirror do pipeline real).
 * pdfText: substrings no texto do HTML de exportação PDF.
 * pdfHtml: substrings no markup bruto do HTML de exportação PDF (classes/estrutura visual).
 * profile: perfil de PDF esperado.
 */
const EXPORT_FIDELITY = {
  prova: {
    profile: "document",
    docxText: ["2x + 4 = 10", "Gabarito"],
    pdfText: ["2x + 4 = 10"],
    pdfHtml: ["planify-questao"],
  },
  lista: {
    profile: "document",
    docxText: ["x + 5 = 12", "Gabarito"],
    pdfText: ["x + 5 = 12"],
    pdfHtml: ["planify-questao"],
  },
  apostila: {
    profile: "document",
    docxText: ["isole a inc", "Resolver equa", "Resolva as equa"],
    pdfText: ["isole a inc"],
  },
  atividade: {
    profile: "document",
    docxText: ["Quadro branco", "Organize a turma em trios", "x + 4 = 11", "Objetivo:"],
    pdfText: ["Quadro branco"],
  },
  "plano-aula": {
    profile: "document",
    docxText: ["Abertura", "Fechamento", "Retomar conceito", "10 min"],
    pdfText: ["Abertura"],
    pdfHtml: ["planify-cronograma-table"],
  },
  jogo: {
    profile: "document",
    docxText: ["Regras", "Dividir a turma em duplas", "Componentes", "Cartas com equa"],
    pdfText: ["Dividir a turma em duplas"],
  },
  cruzadinha: {
    profile: "document",
    docxText: ["EQUACAO", "Igualdade com incognita"],
    pdfText: ["EQUACAO"],
    pdfHtml: ["planify-game-table--crossword"],
  },
  resumo: {
    profile: "document",
    docxText: ["Conceito", "Procedimento", "Isolar a inc"],
    pdfText: ["Conceito"],
  },
  sequencia: {
    profile: "document",
    docxText: ["Aula 1", "Aula 3", "Apresentar o conceito"],
    pdfText: ["Aula 1"],
  },
  projeto: {
    profile: "document",
    docxText: ["Fase 1", "Fase 3", "Identificar uma situa"],
    pdfText: ["Fase 1"],
  },
  redacao: {
    profile: "document",
    docxText: ["motivador", "familiar"],
    pdfText: ["motivador"],
  },
  flashcards: {
    profile: "document",
    docxText: ["O que", "Igualdade com inc", "Subtrair 3: x = 7."],
    pdfText: ["Subtrair 3: x = 7."],
    pdfHtml: ["planify-flashcard"],
  },
  "mapa-mental": {
    profile: "document",
    docxText: ["Conceito", "Resolu", "Aplica", "Isolar x"],
    pdfText: ["Conceito"],
    pdfHtml: ["planify-mindmap"],
  },
  slides: {
    profile: "slides",
    docxText: ["Objetivos", "Conceito", "Exemplo pr", "Resolver equa"],
    pdfText: ["Objetivos"],
    pdfHtml: ["planify-slide"],
  },
};

function wordXmlText(parts) {
  const xml = parts.join("");
  const matches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  return decodeEntities(
    matches
      .map((segment) => segment.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
      .join(" "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToText(html) {
  return decodeEntities(
    String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ");
}

function testExportFidelity() {
  for (const tipo of MATERIAL_ENGINE_TYPES) {
    const fixture = GOLDEN[tipo];
    const expectations = EXPORT_FIDELITY[tipo];
    assert.ok(expectations, `fidelidade de exportação ausente para ${tipo}`);

    const html = buildMaterialEngineHtmlFromStructure(
      fixture.input,
      fixture.structure,
    );
    const documentType = `material:${tipo}`;

    // DOCX (Google Docs / Drive / Classroom documento) — mirror do pipeline real.
    const docxBody = resolvePreparedExportBody(html, documentType, "docx");
    const docxText = wordXmlText(htmlBodyToWordXmlParts(docxBody));
    assert.ok(
      docxText.length > 40,
      `${tipo}: DOCX produziu texto vazio ou curto demais`,
    );
    for (const token of expectations.docxText ?? []) {
      assert.ok(
        docxText.includes(token),
        `${tipo}: DOCX perdeu conteúdo "${token}"`,
      );
    }
    // DOCX não deve vazar fragmentos crus de HTML/estilo.
    assert.ok(
      !/style=|class=|<div|<span/i.test(docxText),
      `${tipo}: DOCX vazou markup HTML no texto`,
    );

    // PDF (Classroom anexo / download) — perfil + conteúdo.
    const { exportHtml, pdfProfile } = buildEditorExportHtmlForProfile(
      fixture.structure.title || "Material",
      html,
      documentType,
    );
    assert.equal(
      pdfProfile,
      expectations.profile,
      `${tipo}: perfil de PDF incorreto (esperado ${expectations.profile})`,
    );
    const pdfText = htmlToText(exportHtml);
    for (const token of expectations.pdfText ?? []) {
      assert.ok(
        pdfText.includes(token),
        `${tipo}: PDF perdeu conteúdo "${token}"`,
      );
    }
    for (const token of expectations.pdfHtml ?? []) {
      assert.ok(
        exportHtml.includes(token),
        `${tipo}: PDF perdeu estrutura visual "${token}"`,
      );
    }
  }
}

/** Google Forms (prova/lista): parsing das questões a partir do HTML gerado. */
function testFormsFidelity() {
  for (const tipo of ["prova", "lista"]) {
    const fixture = GOLDEN[tipo];
    const html = buildMaterialEngineHtmlFromStructure(
      fixture.input,
      fixture.structure,
    );
    const questions = parseQuizQuestionsFromHtml(stripTeacherOnlyExportBlocks(html));
    const expected = fixture.structure.exam.questions;

    assert.equal(
      questions.length,
      expected.length,
      `${tipo}: Forms recuperou ${questions.length} questões (esperado ${expected.length})`,
    );

    questions.forEach((question, index) => {
      assert.ok(
        question.statement.length > 8,
        `${tipo}: questão ${index + 1} sem enunciado no Forms`,
      );
    });

    // Primeira é múltipla-escolha com todas as alternativas preservadas.
    assert.equal(
      questions[0].type,
      "multipla-escolha",
      `${tipo}: 1ª questão deveria ser múltipla-escolha no Forms`,
    );
    assert.equal(
      questions[0].options.length,
      expected[0].options.length,
      `${tipo}: alternativas perdidas no Forms (${questions[0].options.length}/${expected[0].options.length})`,
    );
  }
}

/** PPTX (Google Slides / download): parsing dos slides a partir do HTML gerado. */
function testPptxFidelity() {
  const fixture = GOLDEN.slides;
  const html = buildMaterialEngineHtmlFromStructure(
    fixture.input,
    fixture.structure,
  );
  const slides = parseSlidesFromPlanifyHtml(html);

  assert.equal(
    slides.length,
    fixture.structure.slides.length,
    `slides: PPTX recuperou ${slides.length} slides (esperado ${fixture.structure.slides.length})`,
  );

  const titles = slides.map((slide) => slide.title).join(" | ");
  for (const token of ["Objetivos", "Conceito", "Exemplo pr"]) {
    assert.ok(
      titles.includes(token),
      `slides: PPTX perdeu o título "${token}" (recebido: ${titles})`,
    );
  }

  const objetivos = slides.find((slide) => slide.title.startsWith("Objetivos"));
  assert.ok(objetivos, "slides: slide Objetivos ausente no PPTX");
  assert.ok(
    objetivos.bullets.join(" ").includes("Resolver equa"),
    `slides: bullets do slide Objetivos perdidos no PPTX (${objetivos.bullets.join(" / ")})`,
  );

  assert.equal(
    extractSlideThemeFromHtml(html) !== undefined,
    true,
    "slides: tema de design não embutido no HTML (PPTX usaria fallback)",
  );
}

/**
 * Classroom / Drive: formato de arquivo por ferramenta.
 * Visuais e layout-fixo → PDF (preserva layout). Documentos de texto → DOCX editável.
 */
const CLASSROOM_FORMAT = {
  slides: "pdf",
  prova: "pdf",
  lista: "pdf",
  jogo: "pdf",
  cruzadinha: "pdf",
  flashcards: "pdf",
  "mapa-mental": "pdf",
  apostila: "docx",
  atividade: "docx",
  resumo: "docx",
  sequencia: "docx",
  projeto: "docx",
  "plano-aula": "docx",
  redacao: "docx",
};

function testClassroomRouting() {
  for (const tipo of MATERIAL_ENGINE_TYPES) {
    const fixture = GOLDEN[tipo];
    const expected = CLASSROOM_FORMAT[tipo];
    assert.ok(expected, `formato Classroom ausente para ${tipo}`);

    const html = buildMaterialEngineHtmlFromStructure(
      fixture.input,
      fixture.structure,
    );
    const format = resolveClassroomExportForHtml(html, `material:${tipo}`);
    assert.equal(
      format,
      expected,
      `${tipo}: Classroom deveria anexar ${expected}, recebido ${format}`,
    );
  }
}

function testExportPolicyChannels() {
  assert.equal(
    materialExportAllows("google-docs", "material:cruzadinha"),
    false,
    "cruzadinha não deve exportar para Google Docs",
  );
  assert.equal(
    materialExportAllows("google-drive", "material:cruzadinha"),
    true,
    "cruzadinha deve permitir Drive em PDF",
  );
  assert.equal(
    materialExportAllows("pdf-download", "material:cruzadinha"),
    true,
    "cruzadinha deve permitir download PDF",
  );
  assert.equal(
    materialExportAllows("google-docs", "material:apostila"),
    true,
    "apostila deve permitir Google Docs",
  );
  assert.equal(
    materialExportAllows("google-forms", "material:prova"),
    true,
    "prova deve permitir Google Forms",
  );
  assert.equal(
    materialExportAllows("google-docs", "material:prova"),
    false,
    "prova não deve usar Google Docs",
  );
  assert.equal(
    materialExportAllows("google-drive", "material:lista"),
    true,
    "lista deve sempre permitir Google Drive",
  );
  assert.equal(
    materialExportAllows("google-drive", "material:slides"),
    true,
    "slides legado deve permitir Google Drive (PDF)",
  );
  assert.equal(
    materialExportAllows("google-slides", "material:slides"),
    false,
    "slides descontinuado — sem Google Slides",
  );
}

function testHistoryDocumentTypeResolution() {
  const cruzadinhaItem = {
    id: "x",
    title: "Cruzadinha teste",
    source: "material",
    type: "material:cruzadinha",
    status: "rascunho",
    contentPreview: "",
    content: '<div class="planify-game-table--crossword">grid</div>',
    createdAt: "",
    updatedAt: "",
  };

  const { resolveDocumentTypeFromHistoryItem } = loadTsModule(
    "src/lib/documents/document-export-context.ts",
  );

  assert.equal(
    resolveDocumentTypeFromHistoryItem(cruzadinhaItem),
    "material:cruzadinha",
    "histórico deve preservar material:cruzadinha",
  );

  const legacyItem = {
    ...cruzadinhaItem,
    type: "editor",
    raw: { toolId: "cruzadinha" },
  };
  assert.equal(
    resolveDocumentTypeFromHistoryItem(legacyItem),
    "material:cruzadinha",
    "histórico legado deve resolver toolId do raw",
  );

  const { resolveDocumentTypeFromMarketplaceItem } = loadTsModule(
    "src/lib/documents/document-export-context.ts",
  );
  assert.equal(
    resolveDocumentTypeFromMarketplaceItem({ tipoMaterial: "Cruzadinha" }),
    "material:cruzadinha",
    "comunidade deve mapear tipo Cruzadinha",
  );
}

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
  const deprecatedTypes = new Set(["slides"]);

  for (const tipo of MATERIAL_ENGINE_TYPES) {
    if (deprecatedTypes.has(tipo)) {
      assert.equal(
        usesPlanifyMaterialEngine(tipo),
        false,
        `${tipo} descontinuado — não deve gerar via engine ativo`,
      );
      assert.ok(
        !PLANIFY_ENGINE_TYPES.includes(tipo),
        `${tipo} descontinuado — ausente de PLANIFY_ENGINE_TYPES`,
      );
      continue;
    }

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
  assert.equal(
    PLANIFY_ENGINE_TYPES.length,
    MATERIAL_ENGINE_TYPES.length - deprecatedTypes.size,
  );
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
  assert.equal(resolveGoogleProductForTool("prova"), "forms");
  assert.equal(resolveGoogleProductForTool("lista"), "forms");
  assert.equal(resolveGoogleProductForTool("jogo"), null);
  assert.equal(resolveGoogleProductForTool("cruzadinha"), null);
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
  assert.equal(isMaterialStreamType("slides"), false);
  assert.equal(isMaterialStreamType("flashcards"), true);
}

function main() {
  const started = Date.now();
  runTest("engine-routing", testEngineRouting);
  runTest("generation-steps", testGenerationSteps);
  runTest("google-export-routing", testGoogleExportRouting);
  runTest("golden-fixtures", testGoldenFixtures);
  runTest("export-policy-channels", testExportPolicyChannels);
  runTest("history-document-type", testHistoryDocumentTypeResolution);
  runTest("export-fidelity", testExportFidelity);
  runTest("forms-fidelity", testFormsFidelity);
  runTest("pptx-fidelity", testPptxFidelity);
  runTest("classroom-routing", testClassroomRouting);
  runTest("new-tools-fixtures", testNewToolsFixtures);

  const elapsedMs = Date.now() - started;
  console.log(
    `verify-all-generators: OK (${MATERIAL_ENGINE_TYPES.length} ferramentas, fixtures + HTML + DOCX/PDF/Forms/PPTX/Classroom-fidelity + new-tools) — ${elapsedMs}ms`,
  );
}

main();
