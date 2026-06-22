/**
 * Motor central de prompts — engine unificada para as 16 ferramentas Planify.
 * Injeta RAG BNCC literal, guardrails fixos e regras especializadas por tipo.
 */

import { resolveSlideTheme } from "./slide-design-themes";
import type {
  BnccSkillAnchor,
  PromptEngineInput,
  TipoFerramenta,
} from "./types";

// ---------------------------------------------------------------------------
// Rótulos pedagógicos
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<TipoFerramenta, string> = {
  slides: "apresentação em slides",
  prova: "prova avaliativa",
  lista: "lista de exercícios",
  "plano-aula": "plano de aula",
  sequencia: "sequência didática",
  apostila: "apostila didática",
  atividade: "atividade pedagógica",
  jogo: "jogo pedagógico",
  cruzadinha: "cruzadinha pedagógica",
  projeto: "projeto pedagógico",
  resumo: "resumo guiado",
  flashcards: "flashcards",
  redacao: "proposta de redação",
  "mapa-mental": "mapa mental",
  inclusao: "adaptação curricular inclusiva",
  "aula-completa": "pacote de aula completa",
  "correcao-ia": "correção de prova com rubrica",
};

// ---------------------------------------------------------------------------
// Guardrails fixos (todas as ferramentas)
// ---------------------------------------------------------------------------

const GOLDEN_RULES = `
REGRA DE OURO — INVIOLÁVEL:
- ZERO conversas, saudações, justificativas ou meta-comentários fora do JSON.
- PROIBIDO: "Aqui está seu material", "Segue a prova", "Claro!", "Com certeza", "Espero que ajude".
- PROIBIDO: markdown literal (cercas de codigo, #, | tabelas markdown), HTML, blocos de codigo.
- PROIBIDO: inventar códigos BNCC — use SOMENTE os fornecidos na âncora RAG.
- A resposta da API é EXCLUSIVAMENTE um objeto JSON válido no schema MaterialLayout.
`.trim();

const ROLE_INSTRUCTION = `
PAPEL: Especialista Pedagógico BNCC de elite — referência Teachy em qualidade, contexto e aplicabilidade em sala.
MISSÃO: Produzir material pronto para o professor brasileiro da Educação Básica, sem texto introdutório.
`.trim();

// ---------------------------------------------------------------------------
// Âncora RAG BNCC (texto literal do Supabase)
// ---------------------------------------------------------------------------

export function buildBnccRagAnchor(skills: BnccSkillAnchor[] | undefined): string {
  if (!skills?.length) {
    return `
ÂNCORA BNCC (ausente):
- Nenhuma habilidade confirmada pelo professor nesta solicitação.
- PROIBIDO inventar ou citar códigos BNCC (EF**, EM**, EI**).
- Preencha metadata.codigoBNCC e metadata.habilidadeBNCC com string vazia "".
- Foque exclusivamente no TEMA, COMPONENTE e SÉRIE informados.`.trim();
  }

  const primary = skills[0];
  const lines = skills
    .map((skill) => {
      const codigo = String(skill.codigo || "").trim().toUpperCase();
      const descricao = String(skill.descricao || "").trim();
      const conteudo = String(skill.conteudo || "").trim();
      return [
        `CÓDIGO_LITERAL: ${codigo}`,
        `DESCRIÇÃO_LITERAL: ${descricao}`,
        conteudo ? `CONTEÚDO_LITERAL: ${conteudo}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `
ÂNCORA BNCC — DADOS OFICIAIS (RAG Supabase). USE APENAS ESTES REGISTROS:
${lines}

REGRAS DA ÂNCORA:
- metadata.codigoBNCC DEVE ser "${String(primary.codigo).trim().toUpperCase()}" (cópia exata, sem alterar dígitos).
- metadata.habilidadeBNCC DEVE ser a DESCRIÇÃO_LITERAL acima — copie o texto do banco, não parafraseie.
- Incorpore a competência nos enunciados, atividades e conteúdos — sem texto introdutório sobre BNCC.
- Se múltiplas habilidades: priorize a primeira como âncora principal; demais como referência secundária.`.trim();
}

// ---------------------------------------------------------------------------
// Regras especializadas por ferramenta
// ---------------------------------------------------------------------------

function buildToolRules(input: PromptEngineInput): string[] {
  const { tipoFerramenta: tipo, quantidade, tema, incluirGabarito } = input;
  const q = quantidade;

  switch (tipo) {
    case "prova":
    case "lista":
      return [
        `Crie UMA seção tipo "questoes" com exatamente ${q} questões.`,
        `TEMA ÂNCORA obrigatório em cada enunciado: "${tema}".`,
        "Cada questão DEVE ter exatamente 5 alternativas (A, B, C, D, E) em alternativas[].",
        "Apenas UMA alternativa correta — preencha respostaCorreta com a letra (A–E).",
        "justificativa: máximo 120 caracteres, objetiva, sem tom de aula.",
        "Variar tipos (objetiva + dissertativa quando q >= 2).",
        "Enunciados diretos — sem 'Questão N:', sem preâmbulos.",
        incluirGabarito === false
          ? "Sem gabarito: respostaCorreta e justificativa podem ser vazias."
          : "Gabarito obrigatório em respostaCorreta + justificativa curta.",
        "NÃO crie seções tipo texto com introdução longa — material direto para aplicar.",
      ];

    case "plano-aula":
      return [
        `Planejar ${q <= 1 ? "uma aula" : `${q} aulas`} com sequência pedagógica completa.`,
        'OBRIGATÓRIO: inclua seção tipo "tabela" com cronograma cronometrado.',
        "Tabela do cronograma — cabecalhos: Etapa | Duração | Atividade | Recursos.",
        "Cada linha = uma etapa (Abertura, Contextualização, Explicação, Prática, Fechamento, Avaliação).",
        "Complemente com seções tipo texto para objetivos, metodologia e critérios de avaliação.",
        "Cada etapa deve orientar o professor com ações concretas em sala.",
      ];

    case "slides":
      return [
        `Crie UMA seção tipo "slide" com exatamente ${q} slides.`,
        `TEMA VISUAL (renderização): ${resolveSlideTheme(input.designSlides).label}.`,
        ...(input.modeloSlides ? [`MODELO DO PROFESSOR: ${input.modeloSlides}`] : []),
        "MÁXIMO 4 tópicos escaneáveis por slide (array topicos).",
        "Sequência pedagógica: capa → objetivos → desenvolvimento → exemplo → checagem → fechamento.",
        "topicos: frases curtas (máx. 12 palavras), sem parágrafos.",
        "notasProfessor: roteiro de fala detalhado para cada slide.",
        "layout: capa (1º), conteudo/duasColunas/destaque (meio), fechamento (último).",
        "Em slides de conteúdo (não capa/fechamento), preencher imagePrompt com cena concreta e fotografável ligada ao slide.",
        ...(input.incluirQuestoes
          ? [
              `Incluir seção tipo "questoes" com ${input.quantidadeQuestoes ?? 3} questões de checagem.`,
              input.incluirGabarito !== false
                ? "Gabarito somente no último slide (fechamento) — sem respostas nos slides intermediários."
                : "Sem gabarito nas questões dos slides.",
            ]
          : []),
      ];

    case "flashcards":
      return [
        `Crie seção tipo "texto" com exatamente ${q} pares pergunta/resposta em bullets.`,
        "Formato bullet: 'Frente: ... | Verso: ...' — respostas curtas no verso.",
      ];

    case "mapa-mental":
      return [
        `Crie ${q} seções tipo "texto" — uma por ramo do mapa mental.`,
        "Primeira seção: conceito central. Demais: ramos com 2–5 subtópicos em bullets.",
        "Sintético — sem parágrafos longos.",
      ];

    case "apostila":
      return [
        `Estruture ${q} seções tipo "texto" progressivas (capítulos).`,
        "Ordem: Apresentação → Objetivos → Conteúdo expositivo → Revisão → Atividades de fixação.",
        "Explique antes de praticar; não transformar em prova.",
      ];

    case "atividade":
      return [
        `Crie ${q} seções tipo "texto" — uma por atividade.`,
        "Cada seção: objetivo, tempo estimado, materiais (bullets), passos (bullets), critérios de avaliação.",
      ];

    case "sequencia":
      return [
        `Organize ${q} seções tipo "texto" — uma por aula/encontro.`,
        "Cada seção: objetivos, conteúdos, atividades e avaliação formativa.",
        "Encadear progressão didática entre as aulas.",
      ];

    case "projeto":
      return [
        `Estruture ${q} seções tipo "texto" — uma por fase do projeto.`,
        "Incluir problema norteador, cronograma, papéis dos estudantes e critérios de avaliação.",
      ];

    case "redacao":
      return [
        `Inclua ${q} textos motivadores em seções tipo "texto".`,
        "Seção adicional: tema, gênero textual, comando de produção e critérios de avaliação.",
        incluirGabarito
          ? "Incluir redação modelo de referência em seção texto separada."
          : "Sem redação modelo.",
      ];

    case "resumo":
      return [
        `Organize ${q} seções tipo "texto" temáticas.`,
        "Bullets curtos (máx. 12 palavras) — proibido parágrafos longos.",
      ];

    case "jogo":
      return [
        `Formato do jogo: ${input.formatoJogo || "jogo pedagógico"}.`,
        "Seção texto: regras passo a passo. Seção texto: componentes/materiais/cartas.",
        "Listar termos ou perguntas concretos ligados ao tema.",
        "Não transformar em lista de exercícios comum.",
      ];

    case "cruzadinha":
      return [
        `Gere termos e pistas para cruzadinha escolar sobre o tema (quantidade: ${input.quantidade}, entre 8 e 15 termos).`,
        "Seção texto 'Termos da cruzadinha': bullets no formato PALAVRA: pista contextual.",
        "Cada PALAVRA deve ter 4–12 letras, sem espaços e sem acentos (ex.: FOTOSINTESE, EQUACAO).",
        "Pistas claras, sem revelar a resposta literalmente.",
        "Seção texto 'Orientações de aplicação': 3–5 bullets sobre uso em sala.",
        "Não incluir questões discursivas — apenas termos/pistas para a grade visual.",
      ];

    case "inclusao":
      return [
        "Adaptar o material descrito nas observações para necessidades inclusivas (TEA, TDAH, dislexia, etc.).",
        "Seções tipo texto: barreiras identificadas, adaptações concretas, estratégias de mediação.",
        "Linguagem acessível e ações aplicáveis pelo professor.",
      ];

    case "aula-completa":
      return [
        "Pacote coeso: plano (tabela cronometrada) + slides (máx. 4 tópicos/slide) + atividade + lista (questoes).",
        "Mínimo 4 seções com tipos distintos: tabela, slide, texto, questoes.",
        "Manter sequência pedagógica única ao longo de todas as seções.",
      ];

    case "correcao-ia":
      return [
        "Seção texto: análise da resposta do estudante por critério da rubrica.",
        "Seção tabela: rubrica com cabecalhos Critério | Nota | Comentário.",
        "Seção texto: devolutiva construtiva para o estudante.",
      ];

    default:
      return ["Manter estrutura pedagógica direta e aplicável em sala."];
  }
}

// ---------------------------------------------------------------------------
// Schema de saída (instrução ao modelo)
// ---------------------------------------------------------------------------

const OUTPUT_SCHEMA_INSTRUCTION = `
FORMATO DE SAÍDA OBRIGATÓRIO (MaterialLayout):
{
  "metadata": {
    "tema": "<tema da solicitação>",
    "serie": "<ano/série>",
    "habilidadeBNCC": "<DESCRIÇÃO_LITERAL da âncora ou vazio>",
    "codigoBNCC": "<CÓDIGO_LITERAL da âncora ou vazio>"
  },
  "secoes": [
    {
      "titulo": "<título da seção>",
      "tipo": "texto" | "tabela" | "questoes" | "slide",
      "conteudo": { ... }
    }
  ]
}

CONTEÚDO POR TIPO DE SEÇÃO:
- texto:     { "paragrafos": string[], "bullets": string[] }
- tabela:    { "cabecalhos": string[], "linhas": string[][] }
- questoes:  { "questoes": [{ numero, enunciado, tipo, alternativas: [{letra, texto}], respostaCorreta, justificativa }] }
- slide:     { "slides": [{ titulo, topicos: string[] (máx. 4), notasProfessor, layout }] }
`.trim();

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export type PromptEngineOutput = {
  systemInstruction: string;
  userPrompt: string;
};

export function buildSystemInstruction(tipoFerramenta: TipoFerramenta): string {
  return [
    ROLE_INSTRUCTION,
    `Especialidade ativa: ${TYPE_LABELS[tipoFerramenta]}.`,
    GOLDEN_RULES,
    OUTPUT_SCHEMA_INSTRUCTION,
  ].join("\n\n");
}

export function buildPromptEngine(input: PromptEngineInput): PromptEngineOutput {
  const toolRules = buildToolRules(input)
    .map((rule) => `- ${rule}`)
    .join("\n");

  const observacoes = input.observacoes?.trim()
    ? `\n\nOBSERVAÇÕES DO PROFESSOR:\n${input.observacoes.trim()}`
    : "";

  const userPrompt = `
Gere material pedagógico para o Planify (iaplanify.com.br).

FERRAMENTA:
- Tipo técnico: ${input.tipoFerramenta}
- Tipo pedagógico: ${TYPE_LABELS[input.tipoFerramenta]}

DADOS DA SOLICITAÇÃO:
- Tema: ${input.tema}
- Etapa: ${input.etapa}
- Ano/Série: ${input.anoSerie}
- Componente curricular: ${input.componenteCurricular}
- Objetivo do professor: ${input.objetivo || "Não informado"}
- Quantidade desejada: ${input.quantidade}
- Dificuldade: ${input.dificuldade}
- Incluir gabarito: ${input.incluirGabarito !== false ? "sim" : "não"}

${buildBnccRagAnchor(input.habilidadesBncc)}

REGRAS ESPECIALIZADAS (${input.tipoFerramenta}):
${toolRules}

REGRAS GERAIS:
- Adequar linguagem ao ano/série informado.
- Conteúdo coeso, contextualizado no tema — sem repetição nem preenchimento artificial.
- Entregar pronto para edição no editor do Planify.
- Responda SOMENTE com JSON MaterialLayout válido.${observacoes}
`.trim();

  return {
    systemInstruction: buildSystemInstruction(input.tipoFerramenta),
    userPrompt,
  };
}

/** Bloco estático para cache de contexto Gemini (regras por tipo, sem dados dinâmicos). */
export function buildStaticRulesForType(tipoFerramenta: TipoFerramenta): string {
  const placeholderInput: PromptEngineInput = {
    tipoFerramenta,
    etapa: "Ensino Fundamental",
    anoSerie: "N",
    componenteCurricular: "Componente",
    tema: "Tema",
    quantidade: 0,
    dificuldade: "media",
    incluirGabarito: true,
    formatoJogo: "jogo pedagógico",
  };

  const rules = buildToolRules(placeholderInput)
    .map((rule) =>
      rule
        .replace(/exatamente 0 /gi, "exatamente N ")
        .replace(/0 aulas/gi, "N aulas")
        .replace(/0 seções/gi, "N seções")
        .replace(/0 slides/gi, "N slides")
        .replace(/0 questões/gi, "N questões")
        .replace(/0 capítulos/gi, "N capítulos")
        .replace(/0 fases/gi, "N fases")
        .replace(/0 pares/gi, "N pares")
        .replace(/0 textos/gi, "N textos")
        .replace(/0 ramos/gi, "N ramos"),
    )
    .map((rule) => `- ${rule}`)
    .join("\n");

  return `
PLANIFY — MOTOR UNIFICADO (${TYPE_LABELS[tipoFerramenta]})
Substitua N pela quantidade informada na solicitação dinâmica.

REGRAS ESPECIALIZADAS EM CACHE:
${rules}

${GOLDEN_RULES}
${OUTPUT_SCHEMA_INSTRUCTION}
`.trim();
}
