import type { MaterialAIInput, MaterialAIQuestion } from "../../types/ai";
import { canonicalMaterialType, normalizeForPedagogy, normalizeInputContents } from "./material-specialist-blueprints";

function includesAny(value: string, words: string[]): boolean {
  const normalized = normalizeForPedagogy(value);
  return words.some((word) => normalized.includes(normalizeForPedagogy(word)));
}

function compact(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function buildPedagogicalReferenceKernelPrompt(input: MaterialAIInput): string {
  const kind = canonicalMaterialType(input.tipo);
  const contents = normalizeInputContents(input.conteudos);
  const theme = compact(input.tema || "tema estudado");
  const component = compact(input.componenteCurricular || "componente curricular");
  const quantity = compact(input.quantidadeQuestoes || "quantidade definida pelo professor");

  const universal = [
    "BASE PLANIFY WEB-INFORMED SEM CÓPIA: use padrões pedagógicos amplamente aceitos, mas gere conteúdo original, sem copiar textos da internet.",
    "BNCC: alinhe conhecimentos, competências, habilidades e progressão escolar ao ano/série e ao componente, sem inventar códigos BNCC.",
    "UDL/Diversidade: ofereça clareza, organização visual, comandos acessíveis, múltiplas formas de resposta quando útil e adaptações sem reduzir o nível intelectual.",
    "Bloom/complexidade cognitiva: varie entre lembrar, compreender, aplicar, analisar, avaliar e criar; não entregue só identificação simples.",
    "OER/ética: produza material reutilizável, editável, original e adequado para impressão/uso em sala, sem dependência de fonte externa privada.",
    "Produto antes de explicação: o professor precisa de entrega pronta, não de justificativa sobre a entrega.",
    "Contrato quantitativo: se foi pedido 10, entregue exatamente 10 itens principais no array questoes e gabarito correspondente.",
  ];

  const byKind: Record<string, string[]> = {
    atividade: [
      `MODELO DE ATIVIDADE: folha do aluno com cabeçalho, comandos diretos, ${quantity} questões numeradas, espaços de resposta e gabarito do professor.`,
      "Estrutura obrigatória: VERSÃO DO ALUNO → questões em blocos limpos → VERSÃO DO PROFESSOR — GABARITO.",
      "Não usar parágrafo corrido. Questões precisam ter comando separado de itens, frases, alternativas ou exemplos.",
      "Varie identificação, classificação, comparação, reescrita, produção, justificativa e desafio final quando fizer sentido.",
    ],
    lista: [
      `MODELO DE LISTA: treino progressivo com ${quantity} exercícios, indo do básico ao desafio, sem introdução longa.`,
      "Organize blocos: aquecimento, prática orientada, aplicação, desafio e checagem; mas cada exercício deve ser questão real no array questoes.",
      "Gabarito precisa ser comentado o suficiente para orientar correção e retomada.",
    ],
    prova: [
      `MODELO DE PROVA: avaliação pronta com cabeçalho, instruções breves, ${quantity} questões, pontuação sugerida, gabarito e critérios.`,
      "Misture objetivas, discursivas e contextualizadas quando adequado; não ensine em formato de apostila.",
      "Cada questão deve avaliar um objetivo claro e ter resposta esperada suficiente.",
    ],
    revisao: [
      `MODELO DE REVISÃO: retomada objetiva com síntese curta, ${quantity} questões, foco em dificuldades comuns e gabarito orientador.`,
      "Não virar apostila longa: revise, aplique, corrija e indique pontos de atenção.",
    ],
    apostila: [
      `MODELO DE APOSTILA: pequeno livro didático sobre ${theme}, em ${component}, com capa textual, apresentação breve, capítulos/unidades, exemplos, boxes, vocabulário, síntese, exercícios e gabarito.`,
      "Apostila ensina antes de exercitar. Não comece por perguntas e não entregue como atividade solta.",
      "Cada conteúdo relevante deve virar unidade, subtítulo, box, exemplo ou exercício coerente.",
    ],
    sequencia: [
      `MODELO DE SEQUÊNCIA DIDÁTICA: aulas/momentos progressivos sobre ${theme}, com objetivos, tempo, recursos, ação do professor, ação dos estudantes, evidência e avaliação.`,
      "Não virar prova/lista. O produto é uma organização de aulas aplicável.",
    ],
    projeto: [
      `MODELO DE PROJETO: problema norteador sobre ${theme}, investigação, etapas, produto final, socialização, rubrica e cronograma.`,
      "Não virar lista de perguntas. Tarefas devem formar percurso de pesquisa/produção/intervenção.",
    ],
    roteiro: [
      `MODELO DE ROTEIRO: estudo autônomo em antes/durante/depois, leitura guiada, registros, checagem e autoavaliação.`,
      "Use comandos curtos, progressivos e executáveis pelo aluno.",
    ],
    jogo: [
      `MODELO DE JOGO: material jogável/imprimível sobre ${theme}, com peças, regras, pistas, cartas/cartelas/grade e gabarito.`,
      "Não entregue apenas explicação; entregue componentes reais para usar em sala.",
    ],
  };

  const coverage = contents.length
    ? [`CONTEÚDOS QUE DEVEM APARECER NO PRODUTO: ${contents.map((item) => `“${item}”`).join("; ")}.`]
    : ["Se o professor não detalhou conteúdos, derive conteúdos essenciais do tema sem fugir do componente curricular."];

  return [...universal, ...coverage, ...(byKind[kind] || [])].join("\n");
}

export function isWeakTeacherAnswer(value: unknown): boolean {
  const text = normalizeForPedagogy(value);
  if (!text || text.length < 36) return true;
  return /(resposta pessoal|varia|depende|conforme o conteudo|conforme estudado|a criterio do professor|livre)/i.test(text);
}

export function buildTeacherAnswerExpansion(input: MaterialAIInput, question: Partial<MaterialAIQuestion>): string {
  const component = normalizeForPedagogy(input.componenteCurricular || "");
  const theme = compact(input.tema || "tema estudado");
  const command = compact(question.enunciado || "questão proposta");

  if (includesAny(component, ["matemática", "matematica"])) {
    return `Resposta esperada: apresentar procedimento correto, desenvolvimento organizado e resultado compatível com o comando. Exemplo aceitável: resolver passo a passo, indicar cálculos usados e conferir se o resultado responde ao problema sobre ${theme}.`;
  }

  if (includesAny(component, ["língua portuguesa", "lingua portuguesa", "redação", "redacao", "literatura", "escrita"])) {
    return `Resposta esperada: identificar, explicar ou produzir conforme o comando, usando o conceito linguístico corretamente. Exemplos aceitáveis: marcar o termo solicitado, justificar com trecho/frase do enunciado e reescrever quando pedido, mantendo coerência com ${theme}.`;
  }

  if (includesAny(component, ["ciências", "ciencias", "biologia", "física", "fisica", "química", "quimica"])) {
    return `Resposta esperada: explicar o fenômeno ou conceito com vocabulário científico adequado, relacionando causa, evidência e consequência. Exemplo aceitável: citar o conceito central, aplicar ao caso da questão e justificar a relação com ${theme}.`;
  }

  if (includesAny(component, ["geografia", "território", "territorio"])) {
    return `Resposta esperada: relacionar o tema a espaço geográfico, território, paisagem, lugar, escala, sociedade-natureza ou impactos. Exemplo aceitável: explicar a situação proposta usando pelo menos um conceito geográfico e um exemplo contextualizado sobre ${theme}.`;
  }

  if (includesAny(component, ["história", "historia"])) {
    return `Resposta esperada: situar o tema no tempo e no contexto, reconhecendo sujeitos, causas, consequências, permanências ou mudanças. Exemplo aceitável: responder com referência ao processo histórico estudado e justificar com evidência do enunciado.`;
  }

  if (includesAny(component, ["ensino religioso"])) {
    return `Resposta esperada: demonstrar compreensão respeitosa do tema, relacionando valores, tradição, convivência, diversidade ou reflexão ética. Exemplo aceitável: explicar a ideia central, apresentar justificativa e manter postura não proselitista.`;
  }

  return `Resposta esperada: responder ao comando com clareza, usando conceitos corretos sobre ${theme}, exemplo pertinente e justificativa. Referência de correção: ${command.slice(0, 160)}${command.length > 160 ? "..." : ""}`;
}

export function buildQuestionQualityChecklist(input: MaterialAIInput): string[] {
  const kind = canonicalMaterialType(input.tipo);
  if (!["atividade", "lista", "prova", "revisao"].includes(kind)) return [];
  return [
    "Cada questão tem comando em linha própria.",
    "Frases, situações ou itens de análise aparecem em tópicos ou alternativas, não colados ao comando.",
    "Há espaço de resposta suficiente para a resolução.",
    "O gabarito traz resposta esperada, exemplos aceitáveis e critério.",
    "A numeração do gabarito acompanha a numeração da versão do aluno.",
  ];
}
