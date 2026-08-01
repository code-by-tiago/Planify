import type { PlanifyToolId } from "./planifyTools";

export type LumiCoachContext =
  | "generic"
  | "material"
  | "planejamento"
  | "bncc"
  | "docx";

const genericMessages = [
  "Respire fundo — sua aula está tomando forma!",
  "Cada minuto aqui é tempo que você ganha na sala de aula.",
  "A BNCC e a IA estão alinhando tudo para você revisar.",
  "Quase lá! O material está sendo lapidado com cuidado.",
  "Você está investindo no que importa: qualidade pedagógica.",
  "Sua turma vai sentir a diferença quando você levar isso à sala.",
  "Organizando ideias para você focar no que faz melhor: ensinar.",
  "Planify trabalha nos detalhes; você cuida do olhar humano.",
  "Mais um passo rumo a uma aula memorável.",
  "Persistência de professor(a) + IA = combinação poderosa.",
];

const contextMessages: Record<Exclude<LumiCoachContext, "generic" | "material">, string[]> = {
  planejamento: [
    "Montando sua matriz pedagógica com coerência por período.",
    "Cruzando conteúdos, habilidades e objetivos da BNCC.",
    "Planejar bem hoje evita correria na véspera da aula.",
    "Estruturando etapas para sua sequência fazer sentido.",
  ],
  bncc: [
    "Buscando habilidades que conversam com o que você ensina.",
    "A BNCC é o mapa — estamos localizando o melhor caminho.",
    "Sugestões alinhadas à etapa e ao componente curricular.",
  ],
  docx: [
    "Preparando o documento oficial para você baixar.",
    "Formatando tudo no padrão DOCX do Planify.",
    "Últimos ajustes antes do arquivo ficar pronto.",
  ],
};

const toolMessages: Partial<Record<PlanifyToolId, string[]>> = {
  prova: [
    "Equilibrando questões, enunciados e gabarito.",
    "Sua avaliação está sendo calibrada com critério.",
  ],
  lista: [
    "Variando exercícios para fixar o conteúdo.",
    "Progressão didática em cada item da lista.",
  ],
  "plano-aula": [
    "Objetivos, metodologia e avaliação em harmonia.",
    "Um plano claro libera sua energia em sala.",
  ],
  sequencia: [
    "Distribuindo aulas para a progressão fazer sentido.",
    "Sequência didática amarrada de ponta a ponta.",
  ],
  apostila: [
    "Capítulos e exemplos para seus alunos revisarem.",
    "Material de apoio denso, mas legível.",
  ],
  atividade: [
    "Instruções claras para a turma engajar.",
    "Atividade prática saindo do forno pedagógico.",
  ],
  jogo: [
    "Regras e rodadas para a aula ganhar movimento.",
    "Aprender brincando — estamos desenhando isso.",
  ],
  projeto: [
    "Etapas, produto final e critérios de avaliação.",
    "Projeto interdisciplinar ganhando contorno.",
  ],
  resumo: [
    "Só o essencial — síntese que cabe na revisão.",
    "Conceitos-chave em linguagem acessível.",
  ],
  flashcards: [
    "Perguntas e respostas curtas para memorizar.",
    "Cartões de estudo quase prontos.",
  ],
  redacao: [
    "Montando tema, motivadores e comando para sua turma escrever.",
    "Proposta de redação completa quase pronta.",
  ],
  inclusao: [
    "Adaptando com foco em inclusão e acessibilidade.",
    "Técnicas de mediação alinhadas à necessidade informada.",
    "Material inclusivo saindo com cuidado pedagógico.",
  ],
  pei: [
    "PEI sendo estruturado com cuidado pedagógico e institucional.",
    "Acessibilidade curricular, AEE e parecer caminhando juntos.",
    "Organizando estratégias para participação e autonomia do estudante.",
  ],
  "aula-completa": [
    "Montando plano, atividade e avaliação no mesmo tema.",
    "Cada material do pacote conversa com o anterior.",
    "Sua aula completa está ganhando coesão pedagógica.",
  ],
  "correcao-ia": [
    "Lendo a resposta com o olhar pedagógico que você configurou.",
    "Aplicando rubrica e preparando devolutiva útil em sala.",
    "Feedback formativo quase pronto para seus alunos.",
  ],
};

function uniqueMessages(items: string[]): string[] {
  return [...new Set(items)];
}

export function getMotivationalMessages(
  context: LumiCoachContext = "generic",
  toolId?: PlanifyToolId | string,
): string[] {
  const toolSpecific =
    toolId && toolId in toolMessages
      ? toolMessages[toolId as PlanifyToolId] ?? []
      : [];

  const contextual =
    context === "material"
      ? genericMessages
      : context !== "generic"
        ? contextMessages[context] ?? []
        : [];

  return uniqueMessages([
    ...toolSpecific,
    ...contextual,
    ...genericMessages,
  ]);
}

export function pickInitialMessageIndex(total: number, seed = 0): number {
  if (total <= 1) return 0;
  return Math.abs(seed) % total;
}
