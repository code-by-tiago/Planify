import { getMaterialGameFormatRule, normalizeGameItemCount } from "../../../config/material-game-types";
import type {
  MaterialGeneratorBNCCSkill,
  MaterialGeneratorRequest,
} from "../../../types/material-generator";
import type { MaterialGameBlueprint, MaterialGameBlueprintItem } from "./game-engine";

const STOP_WORDS = new Set([
  "a", "as", "o", "os", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "sobre", "entre", "e", "ou", "que", "como", "se", "ao", "aos", "à", "às", "ser", "sua",
  "seu", "suas", "seus", "são", "dos", "das", "mais", "menos", "bem", "base", "partir", "diferentes", "principais",
  "ensino", "fundamental", "médio", "serie", "série", "ano", "anos", "habilidade", "aluno", "estudante", "professor",
]);

const SUBJECT_TERM_BANK: Record<string, string[]> = {
  geografia: [
    "territorio", "paisagem", "regiao", "clima", "relevo", "vegetacao", "hidrografia", "populacao", "urbanizacao", "cartografia",
    "bioma", "biodiversidade", "recursos", "sustentabilidade", "globalizacao", "fronteira", "lugar", "escala", "ambiente", "economia",
  ],
  historia: [
    "fonte", "tempo", "cultura", "memoria", "sociedade", "poder", "trabalho", "resistencia", "cidadania", "patrimonio",
    "colonizacao", "revolucao", "republica", "imperio", "democracia", "conflito", "identidade", "processo", "permanencia", "mudanca",
  ],
  ciencias: [
    "energia", "materia", "ecossistema", "celula", "organismo", "evolucao", "saude", "ambiente", "experimento", "hipotese",
    "biodiversidade", "cadeia", "agua", "solo", "ar", "forca", "movimento", "calor", "luz", "sistema",
  ],
  biologia: [
    "celula", "genes", "ecossistema", "biodiversidade", "evolucao", "metabolismo", "organismo", "populacao", "comunidade", "habitat",
    "adaptacao", "reproducao", "saude", "bioma", "cadeia", "tecido", "orgao", "sistema", "especie", "conservacao",
  ],
  matematica: [
    "numero", "fracao", "porcentagem", "equacao", "funcao", "grafico", "area", "volume", "angulo", "probabilidade",
    "estatistica", "proporcao", "razao", "medida", "expressao", "sequencia", "variavel", "plano", "simetria", "padrao",
  ],
  portugues: [
    "texto", "genero", "leitura", "argumento", "coesao", "coerencia", "narrador", "personagem", "enredo", "paragrafo",
    "interpretacao", "inferência", "linguagem", "pontuacao", "verbo", "substantivo", "adjetivo", "oralidade", "contexto", "sentido",
  ],
  lingua: [
    "texto", "genero", "vocabulario", "dialogo", "pronuncia", "contexto", "cultura", "sentido", "frase", "comunicacao",
    "leitura", "escuta", "escrita", "oralidade", "expressao", "argumento", "informacao", "tema", "autor", "publico",
  ],
  fisica: [
    "forca", "movimento", "energia", "velocidade", "aceleracao", "trabalho", "potencia", "calor", "onda", "luz",
    "eletricidade", "campo", "massa", "pressao", "temperatura", "equilibrio", "circuito", "frequencia", "periodo", "gravidade",
  ],
  quimica: [
    "atomo", "molecula", "substancia", "mistura", "reacao", "ligacao", "solucao", "concentracao", "acido", "base",
    "tabela", "elemento", "energia", "materia", "transformacao", "equilibrio", "oxidacao", "reducao", "estequiometria", "ph",
  ],
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTerm(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function componentKey(component: string): string {
  const normalized = normalizeTerm(component);
  if (/geografia/.test(normalized)) return "geografia";
  if (/historia/.test(normalized)) return "historia";
  if (/ciencia/.test(normalized)) return "ciencias";
  if (/biologia/.test(normalized)) return "biologia";
  if (/matematica/.test(normalized)) return "matematica";
  if (/portugues|redacao|escrita/.test(normalized)) return "portugues";
  if (/ingles|espanhol|lingua/.test(normalized)) return "lingua";
  if (/fisica/.test(normalized)) return "fisica";
  if (/quimica/.test(normalized)) return "quimica";
  return "geografia";
}

function extractKeywords(text: string): string[] {
  return normalizeTerm(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const clean = normalizeTerm(term).replace(/\s+/g, " ").trim();
    if (!clean || clean.length < 3 || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
  }

  return result;
}

function skillKeywords(skills: MaterialGeneratorBNCCSkill[]): string[] {
  return skills.flatMap((skill) => extractKeywords(`${skill.codigo} ${skill.descricao} ${skill.conteudo || ""}`));
}

function buildTermList(input: MaterialGeneratorRequest, targetCount: number): string[] {
  const key = componentKey(input.componenteCurricular);
  const topicTerms = extractKeywords(input.temaCentral);
  const bnccTerms = skillKeywords(input.habilidadesBncc || []);
  const subjectTerms = SUBJECT_TERM_BANK[key] || SUBJECT_TERM_BANK.geografia;
  const genericTerms = [
    "conceito", "exemplo", "causa", "consequencia", "problema", "solucao", "evidencia", "analise", "contexto", "processo",
    "relacao", "impacto", "comparacao", "argumento", "interpretacao", "registro", "debate", "síntese", "aprendizagem", "avaliacao",
  ];

  const terms = uniqueTerms([
    ...topicTerms,
    ...bnccTerms,
    ...subjectTerms,
    ...genericTerms,
  ]);

  while (terms.length < targetCount) {
    terms.push(`desafio ${terms.length + 1}`);
  }

  return terms.slice(0, Math.max(targetCount, 8));
}

function makeItem(term: string, index: number, input: MaterialGeneratorRequest): MaterialGameBlueprintItem {
  const topic = input.temaCentral;
  const component = input.componenteCurricular;
  const pretty = titleCase(term);
  const question = `Como ${pretty.toLowerCase()} se relaciona ao tema ${topic} em ${component}?`;
  const definition = `${pretty} é um conceito-chave para compreender ${topic} em ${component}, ajudando a analisar relações, exemplos e consequências no contexto estudado.`;

  return {
    termo: pretty,
    resposta: pretty,
    pista: `Conceito ligado a ${topic} que ajuda a explicar uma relação importante em ${component}.`,
    definicao: definition,
    pergunta: question,
    alternativas: [
      pretty,
      `Exemplo secundário de ${topic}`,
      `Elemento sem relação direta`,
      `Informação complementar`,
    ],
    respostaCorreta: pretty,
    desafio: `Explique, com um exemplo, por que ${pretty.toLowerCase()} é importante para estudar ${topic}.`,
    categoria: index % 3 === 0 ? "conceito" : index % 3 === 1 ? "exemplo" : "análise",
    justificativa: `A resposta correta é ${pretty} porque esse termo organiza uma ideia central do tema ${topic}.`,
  };
}

function buildRules(formatLabel: string, input: MaterialGeneratorRequest): string[] {
  return [
    `Explique que o objetivo é revisar e aplicar conhecimentos sobre ${input.temaCentral}.`,
    `Organize a turma em ${input.jogoDinamica?.organizacao || "grupos"} e entregue a versão do aluno.`,
    `Cada estudante ou grupo deve registrar respostas, justificativas ou descobertas durante o jogo.`,
    `Ao final, o professor conduz correção comentada usando o gabarito e conecta as respostas à BNCC selecionada.`,
    `O ${formatLabel.toLowerCase()} deve ser usado como atividade pedagógica, não apenas recreativa.`,
  ];
}

export function buildDeterministicGameBlueprint(input: MaterialGeneratorRequest): MaterialGameBlueprint {
  const rule = getMaterialGameFormatRule(input.jogoDinamica?.formato);
  const target = normalizeGameItemCount(rule.value, input.quantidadeQuestoes || input.jogoDinamica?.quantidadeItens, input.tamanho);
  const terms = buildTermList(input, target);
  const items = terms.map((term, index) => makeItem(term, index, input));

  return {
    titulo: `${rule.label} — ${input.temaCentral}`,
    subtitulo: `${input.componenteCurricular} • ${input.anoSerie}`,
    resumo: `${rule.label} pronto para aplicação, com versão do aluno, gabarito do professor e fechamento pedagógico sobre ${input.temaCentral}.`,
    objetivoPedagogico: `Retomar, fixar e aplicar conceitos essenciais de ${input.temaCentral} de forma ativa e organizada para ${input.anoSerie}.`,
    contextualizacao: `O jogo foi estruturado para transformar o tema ${input.temaCentral} em uma experiência de aprendizagem com participação, registro e correção comentada.`,
    formato: rule.value,
    tempoEstimado: input.jogoDinamica?.duracao || "30 a 45 minutos",
    organizacao: input.jogoDinamica?.organizacao || "grupos",
    materiais: [
      input.jogoDinamica?.materiais || "Folhas impressas, lápis, borracha e quadro para correção coletiva.",
      "Versão do aluno impressa ou projetada.",
      "Gabarito do professor para conferência e mediação.",
    ],
    preparacao: [
      "Imprimir ou projetar a versão do aluno antes da aula.",
      "Ler as regras com a turma e combinar tempo de realização.",
      "Separar estudantes conforme a organização escolhida.",
      "Preparar o gabarito para correção comentada.",
    ],
    regras: buildRules(rule.label, input),
    comoJogar: [
      "Apresente o tema e explique o objetivo pedagógico do jogo.",
      "Entregue a versão do aluno e oriente o registro das respostas.",
      "Circule pela sala, fazendo perguntas de mediação sem entregar o gabarito.",
      "Ao final, faça correção comentada e peça que os estudantes expliquem os conceitos mais importantes.",
    ],
    pontuacao: [
      "1 ponto por item correto.",
      "1 ponto extra por justificativa bem explicada.",
      "Em grupos, considerar cooperação, participação e registro das respostas.",
    ],
    fechamento: [
      `Retomar os principais conceitos de ${input.temaCentral}.`,
      "Solicitar que a turma identifique quais itens foram mais difíceis e por quê.",
      "Registrar no quadro uma síntese final do conteúdo trabalhado.",
    ],
    adaptacoesInclusivas: [
      input.inclusaoAcessibilidade || "Usar fonte legível, comandos curtos e leitura compartilhada para estudantes que precisem de apoio.",
      "Permitir duplas colaborativas e tempo adicional quando necessário.",
    ],
    criteriosAvaliacao: [
      "Participação e cooperação durante o jogo.",
      "Compreensão dos conceitos trabalhados.",
      "Capacidade de justificar respostas.",
      "Registro adequado das descobertas.",
    ],
    itens: items,
  };
}
