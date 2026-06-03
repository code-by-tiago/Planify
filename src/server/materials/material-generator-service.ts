import crypto from "node:crypto";
import { getMaterialCreditCost, getMaterialTypeLabel } from "../../config/material-credits";
import { getMaterialGameFormatRule, normalizeGameItemCount } from "../../config/material-game-types";
import type {
  MaterialGeneratedActivity,
  MaterialGeneratedAnswer,
  MaterialGeneratedQuestion,
  MaterialGeneratedSection,
  MaterialGeneratorBNCCSkill,
  MaterialGeneratorGameOptions,
  MaterialGeneratorRequest,
  PlanifyGeneratedMaterial,
} from "../../types/material-generator";
import { generateGeminiJSON } from "../ai/gemini-client";
import { buildMaterialHtml, sanitizeMaterialHtml } from "./material-html";
import {
  buildGameMaterialFromBlueprint,
  type MaterialGameBlueprint,
} from "./game-generators/game-engine";
import { buildDeterministicGameBlueprint } from "./game-generators/game-blueprint-fallback";


const GAME_BLUEPRINT_SCHEMA = {
  type: "OBJECT",
  properties: {
    titulo: { type: "STRING" },
    subtitulo: { type: "STRING" },
    resumo: { type: "STRING" },
    objetivoPedagogico: { type: "STRING" },
    contextualizacao: { type: "STRING" },
    formato: { type: "STRING" },
    tempoEstimado: { type: "STRING" },
    organizacao: { type: "STRING" },
    materiais: { type: "ARRAY", items: { type: "STRING" } },
    preparacao: { type: "ARRAY", items: { type: "STRING" } },
    regras: { type: "ARRAY", items: { type: "STRING" } },
    comoJogar: { type: "ARRAY", items: { type: "STRING" } },
    pontuacao: { type: "ARRAY", items: { type: "STRING" } },
    fechamento: { type: "ARRAY", items: { type: "STRING" } },
    adaptacoesInclusivas: { type: "ARRAY", items: { type: "STRING" } },
    criteriosAvaliacao: { type: "ARRAY", items: { type: "STRING" } },
    itens: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          termo: { type: "STRING" },
          resposta: { type: "STRING" },
          pista: { type: "STRING" },
          definicao: { type: "STRING" },
          pergunta: { type: "STRING" },
          alternativas: { type: "ARRAY", items: { type: "STRING" } },
          respostaCorreta: { type: "STRING" },
          desafio: { type: "STRING" },
          categoria: { type: "STRING" },
          justificativa: { type: "STRING" },
        },
        required: ["termo", "definicao", "pista", "pergunta", "respostaCorreta", "desafio", "categoria"],
      },
    },
  },
  required: [
    "titulo",
    "resumo",
    "objetivoPedagogico",
    "contextualizacao",
    "formato",
    "materiais",
    "preparacao",
    "regras",
    "comoJogar",
    "pontuacao",
    "fechamento",
    "adaptacoesInclusivas",
    "criteriosAvaliacao",
    "itens",
  ],
};

const MATERIAL_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    metadata: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING" },
        tipoMaterial: { type: "STRING" },
        etapaEnsino: { type: "STRING" },
        anoSerie: { type: "STRING" },
        componenteCurricular: { type: "STRING" },
        temaCentral: { type: "STRING" },
        nivelDificuldade: { type: "STRING" },
        tempoEstimado: { type: "STRING" },
        bncc: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              codigo: { type: "STRING" },
              descricao: { type: "STRING" },
              etapa: { type: "STRING" },
              anoSerie: { type: "STRING" },
              componente: { type: "STRING" },
              area: { type: "STRING" },
              conteudo: { type: "STRING" },
            },
            required: ["codigo", "descricao"],
          },
        },
      },
      required: [
        "titulo",
        "tipoMaterial",
        "etapaEnsino",
        "anoSerie",
        "componenteCurricular",
        "temaCentral",
        "nivelDificuldade",
        "tempoEstimado",
        "bncc",
      ],
    },
    capa: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING" },
        subtitulo: { type: "STRING" },
        descricao: { type: "STRING" },
      },
      required: ["titulo", "subtitulo", "descricao"],
    },
    introducao: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING" },
      },
      required: ["texto"],
    },
    objetivosAprendizagem: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    secoes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          ordem: { type: "NUMBER" },
          titulo: { type: "STRING" },
          tipo: { type: "STRING" },
          conteudo: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                tipoBloco: { type: "STRING" },
                texto: { type: "STRING" },
                itens: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["tipoBloco", "texto"],
            },
          },
        },
        required: ["ordem", "titulo", "tipo", "conteudo"],
      },
    },
    atividades: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          titulo: { type: "STRING" },
          instrucoes: { type: "STRING" },
          questoes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                numero: { type: "NUMBER" },
                tipo: { type: "STRING" },
                enunciado: { type: "STRING" },
                alternativas: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                respostaEsperada: { type: "STRING" },
                habilidadeBncc: { type: "STRING" },
                nivel: { type: "STRING" },
              },
              required: [
                "numero",
                "tipo",
                "enunciado",
                "alternativas",
                "respostaEsperada",
                "habilidadeBncc",
                "nivel",
              ],
            },
          },
        },
        required: ["titulo", "instrucoes", "questoes"],
      },
    },
    gabarito: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questao: { type: "NUMBER" },
          resposta: { type: "STRING" },
        },
        required: ["questao", "resposta"],
      },
    },
    criteriosAvaliacao: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    sugestoesUsoProfessor: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    htmlEditor: { type: "STRING" },
  },
  required: [
    "metadata",
    "capa",
    "introducao",
    "objetivosAprendizagem",
    "secoes",
    "atividades",
    "gabarito",
    "criteriosAvaliacao",
    "sugestoesUsoProfessor",
    "htmlEditor",
  ],
};

function toText(value: unknown, fallback = ""): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function toNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function compactStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeSkill(skill: Partial<MaterialGeneratorBNCCSkill>): MaterialGeneratorBNCCSkill | null {
  const codigo = toText(skill.codigo).toUpperCase();
  const descricao = toText(skill.descricao || (skill as { habilidade?: string }).habilidade);

  if (!codigo || !descricao) {
    return null;
  }

  return {
    codigo,
    descricao,
    etapa: toText(skill.etapa),
    anoSerie: toText(skill.anoSerie),
    componente: toText(skill.componente),
    area: toText(skill.area),
    conteudo: toText(skill.conteudo),
  };
}

function normalizeGameOptions(value: unknown): MaterialGeneratorGameOptions | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as MaterialGeneratorGameOptions;
  const result: MaterialGeneratorGameOptions = {
    formato: toText(input.formato),
    organizacao: toText(input.organizacao),
    duracao: toText(input.duracao),
    participantes: toText(input.participantes),
    materiais: toText(input.materiais),
    regrasDesejadas: toText(input.regrasDesejadas),
    produtoFinal: toText(input.produtoFinal),
    nivelMovimento: toText(input.nivelMovimento),
    quantidadeItens: Math.max(0, Math.min(60, toNumber(input.quantidadeItens, 0))),
    gerarVersaoImpressao: input.gerarVersaoImpressao !== false,
  };

  return Object.values(result).some(Boolean) ? result : null;
}

export function normalizeMaterialRequest(body: unknown): MaterialGeneratorRequest {
  const input = (body || {}) as Partial<MaterialGeneratorRequest> & Record<string, unknown>;

  return {
    idempotencyKey: toText(input.idempotencyKey),
    escola: toText(input.escola),
    professor: toText(input.professor),
    turma: toText(input.turma),
    tipoMaterial: toText(input.tipoMaterial, "atividade") as MaterialGeneratorRequest["tipoMaterial"],
    etapaEnsino: toText(input.etapaEnsino),
    anoSerie: toText(input.anoSerie),
    areaConhecimento: toText(input.areaConhecimento),
    componenteCurricular: toText(input.componenteCurricular),
    temaCentral: toText(input.temaCentral),
    objetivo: toText(input.objetivo, "ensinar"),
    tamanho: toText(input.tamanho, "medio") as MaterialGeneratorRequest["tamanho"],
    nivelDificuldade: toText(input.nivelDificuldade, "intermediario"),
    quantidadeQuestoes: Math.max(0, Math.min(60, toNumber(input.quantidadeQuestoes, 8))),
    tiposQuestao: asArray(input.tiposQuestao).map((item) => toText(item)) as MaterialGeneratorRequest["tiposQuestao"],
    habilidadesBncc: asArray<Partial<MaterialGeneratorBNCCSkill>>(input.habilidadesBncc)
      .map(normalizeSkill)
      .filter((skill): skill is MaterialGeneratorBNCCSkill => Boolean(skill)),
    gerarGabarito: input.gerarGabarito !== false,
    gerarVersaoProfessor: input.gerarVersaoProfessor !== false,
    recursosDisponiveis: toText(input.recursosDisponiveis),
    inclusaoAcessibilidade: toText(input.inclusaoAcessibilidade),
    tomLinguagem: toText(input.tomLinguagem, "claro, profissional e adequado à turma"),
    observacoes: toText(input.observacoes),
    jogoDinamica: normalizeGameOptions(input.jogoDinamica),
  };
}

export function validateMaterialRequest(input: MaterialGeneratorRequest): string[] {
  const errors: string[] = [];

  if (!input.tipoMaterial) errors.push("Selecione o tipo de material.");
  if (!input.etapaEnsino) errors.push("Selecione a etapa de ensino.");
  if (!input.anoSerie) errors.push("Selecione o ano/série.");
  if (!input.componenteCurricular) errors.push("Selecione o componente curricular.");
  if (!input.temaCentral) errors.push("Informe o tema central.");
  if (input.temaCentral.length > 180) errors.push("O tema central está muito longo.");
  if ((input.quantidadeQuestoes || 0) > 60) errors.push("A quantidade máxima é 60 questões.");
  if (input.tipoMaterial === "jogo" && !input.jogoDinamica?.formato) {
    errors.push("Selecione o formato do jogo ou dinâmica.");
  }

  return errors;
}

function systemInstruction(): string {
  return [
    "Você é uma IA pedagógica sênior do Planify, especialista em Educação Básica brasileira, BNCC, avaliação escolar, design instrucional e materiais didáticos editoriais.",
    "Responda exclusivamente em JSON válido e completo, seguindo o schema recebido.",
    "Não escreva markdown, comentários, explicações técnicas ou texto fora do JSON.",
    "Não invente habilidades BNCC. Use somente as habilidades enviadas pelo servidor. Se nenhuma for enviada, não cite código BNCC inventado.",
    "Obedeça rigorosamente ao tipo de material solicitado: apostila ensina; prova avalia; atividade pratica; lista treina; resumo sintetiza; sequência didática organiza aulas; projeto investiga e produz; jogo/dinâmica só aparece quando solicitado.",
    "Nunca transforme tema de Geografia, História, Ciências, Matemática, Filosofia, Sociologia ou Ensino Religioso em atividade de Língua Portuguesa, salvo quando o componente escolhido for linguagem ou o professor pedir interdisciplinaridade.",
    "Nunca crie jogo, brincadeira ou dinâmica se o tipoMaterial não for jogo.",
    "Quando o tipoMaterial for jogo, gere blueprint pedagógico consistente. O motor do Planify transformará esse blueprint em caça-palavras, cruzadinha, bingo, memória, dominó, trilha, cartas, quiz, roleta, associação, escape room ou dinâmica conforme o formato escolhido. Não entregue lista de exercícios disfarçada de jogo.",
    "Não repita parágrafos, comandos, questões, objetivos, habilidades ou seções.",
    "A entrega deve ser pronta para professor usar, editar, imprimir e exportar.",
    "Use linguagem adequada à etapa, ano/série, componente, nível e objetivo.",
    "Para questões objetivas, crie alternativas plausíveis e apenas uma correta. O gabarito deve ficar separado.",
    "Para respostas abertas, traga resposta esperada, critérios e exemplos aceitáveis, sem empobrecer com 'resposta pessoal' sem orientação.",
    "O htmlEditor deve conter HTML limpo e editável: article, h1, h2, h3, p, ul, ol, li, blockquote e table quando necessário. Não inclua scripts, estilos, iframes ou eventos.",
  ].join("\n");
}

function buildPrompt(input: MaterialGeneratorRequest, creditCost: number): string {
  const typeLabel = getMaterialTypeLabel(input.tipoMaterial);
  const bnccText = input.habilidadesBncc?.length
    ? JSON.stringify(input.habilidadesBncc, null, 2)
    : "[]";
  const gameOptionsText = input.tipoMaterial === "jogo"
    ? JSON.stringify(input.jogoDinamica || {}, null, 2)
    : "Não se aplica.";

  return `
Gere um material didático de altíssima qualidade para o Planify.

DADOS DO PROFESSOR:
Escola: ${input.escola || "Não informado"}
Professor: ${input.professor || "Não informado"}
Turma: ${input.turma || "Não informado"}

CONFIGURAÇÃO DO MATERIAL:
Tipo técnico: ${input.tipoMaterial}
Tipo pedagógico: ${typeLabel}
Etapa: ${input.etapaEnsino}
Ano/Série: ${input.anoSerie}
Área do conhecimento: ${input.areaConhecimento || "Não informado"}
Componente curricular: ${input.componenteCurricular}
Tema central: ${input.temaCentral}
Objetivo: ${input.objetivo}
Tamanho: ${input.tamanho}
Nível de dificuldade: ${input.nivelDificuldade}
Quantidade de questões/exercícios: ${input.quantidadeQuestoes || "Não se aplica"}
Tipos de questão desejados: ${(input.tiposQuestao || []).join(", ") || "variar conforme o tipo"}
Gerar gabarito: ${input.gerarGabarito ? "Sim" : "Não"}
Gerar versão do professor: ${input.gerarVersaoProfessor ? "Sim" : "Não"}
Recursos disponíveis: ${input.recursosDisponiveis || "Não informado"}
Acessibilidade/inclusão: ${input.inclusaoAcessibilidade || "Não informado"}
Tom de linguagem: ${input.tomLinguagem || "claro, profissional e adequado"}
Observações do professor: ${input.observacoes || "Nenhuma"}
Créditos consumidos pelo sistema: ${creditCost}

CONFIGURAÇÃO ESPECIAL PARA JOGO/DINÂMICA:
${gameOptionsText}

HABILIDADES BNCC OFICIAIS AUTORIZADAS PELO SERVIDOR:
${bnccText}

REGRAS DE QUALIDADE:
1. Gere um único material coerente e completo, não vários materiais desconectados.
2. Se o tema for amplo, organize em seções progressivas e realmente ligadas ao tema.
3. O material precisa ter profundidade suficiente para professor não precisar reescrever do zero.
4. Para apostila: capa, introdução, capítulos curtos, conceitos, exemplos, box de destaque, atividades e síntese.
5. Para prova/simulado/lista/atividade: questões numeradas, comandos claros, gabarito separado e critérios.
6. Para resumo: síntese organizada, conceitos essenciais, exemplos curtos e atividade de checagem.
7. Para sequência didática: aulas/momentos, tempo, recursos, metodologia, avaliação e evidências.
8. Para projeto: problema norteador, etapas, produto final, investigação, socialização e avaliação.
9. Para jogo/dinâmica: entregar mecânica completa, objetivo pedagógico, materiais, preparação, organização da turma, tempo, passo a passo, regras, rodadas, cartas/desafios prontos para imprimir quando cabível, pontuação ou cooperação, mediação do professor, adaptação inclusiva, variações e fechamento pedagógico.
10. Nunca inclua placeholders como "insira aqui", "complete depois" ou "a critério do professor".
11. Nunca mencione bastidores técnicos como prompt, JSON, token, sistema, schema, validação ou fallback.
12. O campo gabarito deve ficar vazio apenas se gerarGabarito for falso.
13. O campo atividades deve conter questão real quando o tipo exigir prática ou avaliação.
14. O campo htmlEditor deve representar todo o material com formatação limpa para editor estilo Word.
15. Se tipoMaterial for jogo, as seções devem incluir obrigatoriamente: Visão geral, Objetivo pedagógico, Materiais, Preparação, Como jogar, Regras, Cartas/desafios, Pontuação ou cooperação, Papel do professor, Fechamento e avaliação.
16. Se tipoMaterial não for jogo, não inclua essas seções de jogo/dinâmica.
`.trim();
}

function createRequestHash(input: MaterialGeneratorRequest): string {
  const stable = {
    ...input,
    idempotencyKey: undefined,
  };

  return crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

function normalizeQuestion(question: Partial<MaterialGeneratedQuestion>, index: number): MaterialGeneratedQuestion {
  return {
    numero: toNumber(question.numero, index + 1),
    tipo: toText(question.tipo, "discursiva"),
    enunciado: toText(question.enunciado, `Questão ${index + 1}`),
    alternativas: compactStringArray(question.alternativas),
    respostaEsperada: toText(question.respostaEsperada),
    habilidadeBncc: toText(question.habilidadeBncc),
    nivel: toText(question.nivel, "intermediario"),
  };
}

function flattenQuestions(activities: MaterialGeneratedActivity[]): Partial<MaterialGeneratedQuestion>[] {
  return activities.flatMap((activity) => asArray<Partial<MaterialGeneratedQuestion>>(activity.questoes));
}

function normalizeSections(value: unknown): MaterialGeneratedSection[] {
  return asArray<Partial<MaterialGeneratedSection>>(value).map((section, index) => ({
    ordem: toNumber(section.ordem, index + 1),
    titulo: toText(section.titulo, `Seção ${index + 1}`),
    tipo: toText(section.tipo, "conteudo"),
    conteudo: asArray(section.conteudo).map((block) => {
      const record = block as { tipoBloco?: unknown; texto?: unknown; itens?: unknown };
      return {
        tipoBloco: toText(record.tipoBloco, "paragrafo"),
        texto: toText(record.texto),
        itens: compactStringArray(record.itens),
      };
    }),
  }));
}

function normalizeActivities(value: unknown): MaterialGeneratedActivity[] {
  return asArray<Partial<MaterialGeneratedActivity>>(value).map((activity, activityIndex) => ({
    titulo: toText(activity.titulo, `Atividade ${activityIndex + 1}`),
    instrucoes: toText(activity.instrucoes, "Leia com atenção e responda."),
    questoes: asArray<Partial<MaterialGeneratedQuestion>>(activity.questoes).map(normalizeQuestion),
  }));
}

function normalizeAnswers(value: unknown): MaterialGeneratedAnswer[] {
  return asArray<Partial<MaterialGeneratedAnswer>>(value).map((answer, index) => ({
    questao: toNumber(answer.questao, index + 1),
    resposta: toText(answer.resposta),
  }));
}

export function normalizeGeneratedMaterial(
  raw: Partial<PlanifyGeneratedMaterial>,
  input: MaterialGeneratorRequest,
  creditCost: number,
): PlanifyGeneratedMaterial {
  const metadata = raw.metadata || ({} as PlanifyGeneratedMaterial["metadata"]);
  const title = toText(metadata.titulo || raw.titulo || raw.capa?.titulo, `${getMaterialTypeLabel(input.tipoMaterial)} — ${input.temaCentral}`);
  const subtitle = toText(raw.capa?.subtitulo || raw.subtitulo, `${input.componenteCurricular} • ${input.anoSerie}`);
  const resumo = toText(raw.capa?.descricao || raw.resumo || raw.introducao?.texto, `Material didático sobre ${input.temaCentral}.`);
  const secoes = normalizeSections(raw.secoes);
  const atividades = normalizeActivities(raw.atividades);
  const questoes = flattenQuestions(atividades).map(normalizeQuestion);
  const gabarito = normalizeAnswers(raw.gabarito);
  const criterios = compactStringArray(raw.criteriosAvaliacao);
  const sugestoes = compactStringArray(raw.sugestoesUsoProfessor);
  const objetivos = compactStringArray(raw.objetivosAprendizagem || raw.objetivos);
  const material: PlanifyGeneratedMaterial = {
    metadata: {
      titulo: title,
      tipoMaterial: toText(metadata.tipoMaterial, input.tipoMaterial),
      etapaEnsino: toText(metadata.etapaEnsino, input.etapaEnsino),
      anoSerie: toText(metadata.anoSerie, input.anoSerie),
      componenteCurricular: toText(metadata.componenteCurricular, input.componenteCurricular),
      temaCentral: toText(metadata.temaCentral, input.temaCentral),
      nivelDificuldade: toText(metadata.nivelDificuldade, input.nivelDificuldade),
      tempoEstimado: toText(metadata.tempoEstimado, input.tamanho === "completo" ? "2 a 4 aulas" : "1 a 2 aulas"),
      creditCost,
      bncc: (input.habilidadesBncc || []).length ? input.habilidadesBncc || [] : asArray<Partial<MaterialGeneratorBNCCSkill>>(metadata.bncc).map(normalizeSkill).filter((skill): skill is MaterialGeneratorBNCCSkill => Boolean(skill)),
    },
    capa: {
      titulo: title,
      subtitulo: subtitle,
      descricao: resumo,
    },
    introducao: {
      texto: toText(raw.introducao?.texto, resumo),
    },
    objetivosAprendizagem: objetivos.length ? objetivos : [`Compreender o tema ${input.temaCentral} de forma adequada ao ${input.anoSerie}.`],
    secoes,
    atividades,
    gabarito,
    criteriosAvaliacao: criterios.length ? criterios : ["Compreensão do conteúdo.", "Clareza nas respostas.", "Uso adequado dos conceitos estudados."],
    sugestoesUsoProfessor: sugestoes.length ? sugestoes : ["Apresentar os objetivos antes da aplicação.", "Acompanhar dúvidas durante a atividade.", "Finalizar com correção comentada."],
    htmlEditor: "",
    titulo: title,
    subtitulo: subtitle,
    tipo: getMaterialTypeLabel(input.tipoMaterial),
    resumo,
    dadosGerais: {
      escola: input.escola,
      professor: input.professor,
      turma: input.turma,
      etapa: input.etapaEnsino,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento,
      componenteCurricular: input.componenteCurricular,
      tema: input.temaCentral,
      duracao: toText(metadata.tempoEstimado),
    },
    objetivos: objetivos.length ? objetivos : [`Compreender o tema ${input.temaCentral}.`],
    conteudos: secoes.map((section) => section.titulo).filter(Boolean),
    orientacoesProfessor: sugestoes.length ? sugestoes : ["Use o material como base editável no Planify Editor."],
    orientacoesAluno: ["Leia os comandos com atenção.", "Responda com clareza.", "Revise antes de entregar."],
    questoes,
    sugestoesUso: sugestoes,
    alertas: [],
  };

  material.htmlEditor = buildMaterialHtml(material);

  return material;
}


function gameSystemInstruction(): string {
  return [
    "Você é o Motor Premium de Jogos Pedagógicos do Planify.",
    "Responda exclusivamente em JSON válido seguindo o schema recebido.",
    "Sua função é criar um blueprint pedagógico preciso para o servidor montar jogos reais, imprimíveis e confiáveis.",
    "Não entregue texto genérico. Gere termos, pistas, definições, perguntas, desafios e respostas corretas coerentes com o tema, ano/série, componente curricular e formato escolhido.",
    "Não invente BNCC. Use apenas as habilidades enviadas pelo servidor como contexto pedagógico.",
    "Para caça-palavras, gere termos curtos, relevantes e sem frases longas. Cada termo deve ter definição pedagógica.",
    "Para cruzadinha, gere respostas curtas e pistas claras, sem resposta óbvia no enunciado da pista.",
    "Para bingo, gere conceitos e definições que possam ser sorteados pelo professor.",
    "Para memória, dominó e associação, gere pares conceito-definição realmente associáveis.",
    "Para trilha, cartas, quiz, roleta e escape room, gere desafios progressivos, gabarito e justificativa.",
    "Não misture componente curricular. Geografia precisa sair como Geografia, Matemática como Matemática, História como História, e assim por diante.",
    "O material deve ser seguro, aplicável em sala, inclusivo, com regras claras e fechamento pedagógico.",
  ].join("\n");
}

function buildGamePrompt(input: MaterialGeneratorRequest, creditCost: number): string {
  const rule = getMaterialGameFormatRule(input.jogoDinamica?.formato);
  const targetItems = normalizeGameItemCount(rule.value, input.quantidadeQuestoes || input.jogoDinamica?.quantidadeItens, input.tamanho);
  const bnccText = input.habilidadesBncc?.length
    ? JSON.stringify(input.habilidadesBncc, null, 2)
    : "[]";

  return `
Crie o blueprint premium de um jogo pedagógico para o Planify.

FORMATO OBRIGATÓRIO:
${rule.label} (${rule.value})

DESCRIÇÃO DO FORMATO:
${rule.description}

ENTREGÁVEIS ESPERADOS:
${rule.teacherDeliverables.join(", ")}

DADOS PEDAGÓGICOS:
Etapa: ${input.etapaEnsino}
Ano/Série: ${input.anoSerie}
Área do conhecimento: ${input.areaConhecimento || "Não informado"}
Componente curricular: ${input.componenteCurricular}
Tema central: ${input.temaCentral}
Objetivo do professor: ${input.objetivo}
Tamanho: ${input.tamanho}
Nível de dificuldade: ${input.nivelDificuldade}
Quantidade mínima de itens no blueprint: ${targetItems}
Créditos do sistema: ${creditCost}

CONFIGURAÇÃO DO JOGO:
Organização: ${input.jogoDinamica?.organizacao || "grupos"}
Duração: ${input.jogoDinamica?.duracao || "30 a 50 minutos"}
Participantes: ${input.jogoDinamica?.participantes || "turma inteira"}
Materiais disponíveis: ${input.jogoDinamica?.materiais || input.recursosDisponiveis || "papel, quadro e canetas"}
Regras/preferências do professor: ${input.jogoDinamica?.regrasDesejadas || "regras claras, participação de todos e mediação do professor"}
Produto final: ${input.jogoDinamica?.produtoFinal || "registro e socialização"}
Movimento: ${input.jogoDinamica?.nivelMovimento || "baixo a moderado"}
Acessibilidade: ${input.inclusaoAcessibilidade || "linguagem clara e instruções objetivas"}
Observações: ${input.observacoes || "Nenhuma"}

BNCC AUTORIZADA PELO SERVIDOR:
${bnccText}

REGRAS CRÍTICAS:
1. Gere no mínimo ${targetItems} itens úteis, variados e não repetidos.
2. Cada item deve ter termo, definição, pista, pergunta, resposta correta, desafio, categoria e justificativa.
3. Para cruzadinha e caça-palavras, termo/resposta deve ser curto, sem pontuação e sem frase extensa.
4. Para bingo, termo deve caber numa cartela e definição deve servir como chamada de sorteio.
5. Para escape room, cada item deve funcionar como enigma com pista e solução.
6. Não use placeholders. Não escreva "complete depois".
7. Não diga que não consegue montar grade, cartela ou jogo. O servidor vai montar isso a partir do blueprint.
8. Garanta coerência total com ${input.componenteCurricular}, ${input.anoSerie} e ${input.temaCentral}.
`.trim();
}

async function generateGameMaterial(input: MaterialGeneratorRequest, creditCost: number): Promise<PlanifyGeneratedMaterial> {
  try {
    const blueprint = await generateGeminiJSON<MaterialGameBlueprint>({
      systemInstruction: gameSystemInstruction(),
      prompt: buildGamePrompt(input, creditCost),
      temperature: 0.18,
      topP: 0.78,
      maxOutputTokens: input.tamanho === "completo" ? 12000 : 9000,
      responseSchema: GAME_BLUEPRINT_SCHEMA,
    });

    return buildGameMaterialFromBlueprint(blueprint, input, creditCost);
  } catch (error) {
    const fallbackBlueprint = buildDeterministicGameBlueprint(input);
    const material = buildGameMaterialFromBlueprint(fallbackBlueprint, input, creditCost);

    material.alertas = [
      ...(material.alertas || []),
      "O Planify usou o construtor premium seguro de jogos para garantir uma entrega estruturada, imprimível e editável.",
    ];

    material.sugestoesUsoProfessor = [
      ...(material.sugestoesUsoProfessor || []),
      "Revise rapidamente os termos do jogo no editor antes da impressão, especialmente quando o tema for muito específico.",
    ];

    return material;
  }
}

export async function generateMaterial(input: MaterialGeneratorRequest): Promise<{
  material: PlanifyGeneratedMaterial;
  requestHash: string;
  idempotencyKey: string;
  creditCost: number;
}> {
  const creditCost = getMaterialCreditCost(input.tipoMaterial, input.tamanho);
  const requestHash = createRequestHash(input);
  const idempotencyKey = input.idempotencyKey || crypto.randomUUID();

  if (input.tipoMaterial === "jogo") {
    return {
      material: await generateGameMaterial(input, creditCost),
      requestHash,
      idempotencyKey,
      creditCost,
    };
  }

  const generated = await generateGeminiJSON<Partial<PlanifyGeneratedMaterial>>({
    systemInstruction: systemInstruction(),
    prompt: buildPrompt(input, creditCost),
    temperature: 0.28,
    topP: 0.86,
    maxOutputTokens: input.tamanho === "completo" ? 18000 : 12000,
    responseSchema: MATERIAL_RESPONSE_SCHEMA,
  });

  return {
    material: normalizeGeneratedMaterial(generated, input, creditCost),
    requestHash,
    idempotencyKey,
    creditCost,
  };
}

export function getMaterialRequestHash(input: MaterialGeneratorRequest): string {
  return createRequestHash(input);
}
