import type { MaterialEngineRequest, MaterialEngineType } from "./material-engine-types";

const typeLabels: Record<MaterialEngineType, string> = {
  apostila: "apostila didática",
  atividade: "atividade pedagógica",
  prova: "prova avaliativa",
  slides: "apresentação em slides",
  projeto: "projeto pedagógico",
  jogo: "jogo pedagógico",
  sequencia: "sequência didática",
  resumo: "resumo guiado",
  lista: "lista de exercícios",
  "plano-aula": "plano de aula",
  flashcards: "flashcards",
  redacao: "proposta de redação",
  "mapa-mental": "mapa mental textual",
};

function specializedRules(request: MaterialEngineRequest): string[] {
  const { quantidade } = request;

  if (request.tipoMaterial === "jogo") {
    const formato = request.formatoJogo || "jogo pedagógico";
    return [
      `Formato obrigatório do jogo: ${formato}.`,
      "Preencha 'game.format' com o nome do formato e 'game.rules' com passo a passo de aplicação em sala.",
      "Preencha 'game.components' com materiais, cartas, termos ou peças necessárias ao formato.",
      "Para caça-palavras, cruzadinha, bingo, memória, dominó, quiz ou cartas: liste termos/perguntas concretos ligados ao tema em 'components'.",
      "Não transformar jogo em lista de exercícios comum.",
    ];
  }

  if (request.tipoMaterial === "slides") {
    return [
      `Gerar exatamente ${quantidade} slides no array 'slides'.`,
      "SEQUÊNCIA DE ENSINO (obrigatório): o array 'slides' deve seguir a ordem real de uma aula — capa → contextualização/objetivos → desenvolvimento em blocos lógicos → exemplo ou aplicação → checagem de aprendizagem → síntese/fechamento.",
      "Cada slide de conteúdo deve ter 'sequenceStep' (inteiro crescente: 1, 2, 3…) refletindo a ordem pedagógica e 'sequenceLabel' em português (ex.: 'Objetivos', 'Conceito-chave', 'Exemplo prático', 'Checagem').",
      "O primeiro slide é a capa (layout 'capa', sequenceStep 0) e o último é o fechamento (layout 'fechamento').",
      "Distribuir os slides intermediários em: objetivos da aula, desenvolvimento do conteúdo em blocos progressivos, exemplo/aplicação prática e pergunta de checagem.",
      "Cada slide deve ter 'title' curto e direto, 'bullets' objetivos (3 a 5 itens, frases curtas, sem parágrafos) e 'speakerNotes' com a fala detalhada do professor para aquele slide.",
      "Nunca deixar um slide sem bullets nem sem notas de fala (exceto a capa, que pode ter poucos ou nenhum bullet).",
      "IMAGENS REAIS (obrigatório nos slides de conteúdo):",
      "- Em TODOS os slides de conteúdo (não capa/fechamento), preencher 'imagePrompt' com termos objetivos em português para busca de figura educacional (ex.: 'ciclo da água evaporação condensação', 'mapa Brasil biomas').",
      "- O imagePrompt será usado para buscar imagem real — NÃO escrever 'sugestão de imagem' nem instruções ao professor; descreva só o assunto visual.",
      "DESIGN VISUAL:",
      "- 'layout': escolher por slide entre 'capa', 'conteudo', 'duasColunas', 'destaque' e 'fechamento'. Variar a composição.",
      "- 'subtitle': frase curta de apoio ao título (capa e slides de seção).",
      "- 'accentColor': paleta entre 'indigo', 'violet', 'coral', 'amber', 'emerald', 'sky', 'rose'.",
      "- 'iconHint': palavra-chave do tema do slide.",
      "- 'callout': em 1 a 3 slides, destaque com 'title' e 'text'.",
      "Manter coesão narrativa: cada slide avança o raciocínio do anterior na ordem de ensino.",
    ];
  }

  if (request.tipoMaterial === "flashcards") {
    return [
      `Gerar exatamente ${quantidade} flashcards no array 'flashcards'.`,
      "Cada flashcard deve ter 'front' (pergunta/conceito objetivo) e 'back' (resposta clara e curta).",
      "Evitar respostas extensas no verso.",
    ];
  }

  if (request.tipoMaterial === "prova") {
    return [
      `Gerar exatamente ${quantidade} questões no array 'exam.questions'.`,
      "Numerar as questões em ordem ('number' começando em 1).",
      "Variar os tipos de questão (multipla-escolha, verdadeiro-falso, dissertativa, completar) quando fizer sentido.",
      "Para questões de multipla-escolha, preencher 'options' com 4 a 5 alternativas; para os demais tipos, 'options' pode ficar vazio.",
      request.incluirGabarito
        ? "Preencher 'answer' de cada questão com a resposta correta e também consolidar o gabarito no array 'answerKey'."
        : "Deixar 'answer' vazio e não preencher 'answerKey' (o professor não quer gabarito).",
      "Equilibrar a dificuldade das questões conforme o nível solicitado.",
    ];
  }

  if (request.tipoMaterial === "lista") {
    return [
      `Gerar exatamente ${quantidade} exercícios no array 'exam.questions'.`,
      "Numerar os exercícios em ordem ('number' começando em 1).",
      "Priorizar exercícios práticos e progressivos sobre o tema.",
      request.incluirGabarito
        ? "Preencher 'answer' de cada exercício e consolidar o gabarito no array 'answerKey'."
        : "Deixar 'answer' vazio e não preencher 'answerKey'.",
    ];
  }

  if (request.tipoMaterial === "mapa-mental") {
    return [
      `Gerar exatamente ${quantidade} ramos no array 'mindMap.branches'.`,
      "Preencher 'mindMap.central' com o conceito central do tema.",
      "Cada ramo deve ter 'title' e 'items' (2 a 5 subtópicos hierárquicos e conectados ao central).",
      "Explicitar relações entre ramos nas 'teacherNotes' (como os conceitos se conectam).",
      "Não escrever parágrafos longos: o mapa mental é hierárquico e sintético.",
    ];
  }

  if (request.tipoMaterial === "plano-aula") {
    const aulas =
      quantidade <= 1
        ? "uma aula completa"
        : `${quantidade} aulas/encontros encadeados`;
    return [
      `Planejar ${aulas} no objeto 'lessonPlan.steps' e nas 'sections'.`,
      "Cada etapa em 'lessonPlan.steps' deve ter 'stage', 'duration', 'description' e 'resources'.",
      "Referenciar competências e habilidades da BNCC quando aplicável ao componente e ano/série.",
      "Incluir objetivos de aprendizagem nas 'sections' e critérios de avaliação nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "sequencia") {
    return [
      `Organizar exatamente ${quantidade} aulas/encontros nas 'sections' (uma seção por encontro).`,
      "Cada seção: título da aula, objetivos, conteúdos, atividades e avaliação formativa.",
      "Encadear progressão didática entre as aulas.",
      "Incluir avaliação processual e produto final nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "projeto") {
    return [
      `Estruturar o projeto em ${quantidade} etapas/fases nas 'sections' (uma seção por fase).`,
      "Incluir problema norteador, justificativa, cronograma e produto final.",
      "Detalhar tarefas e papéis dos estudantes nas 'activities'.",
      "Definir critérios de avaliação do projeto nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "redacao") {
    return [
      "Gerar proposta de redação para produção textual pelo estudante (não corrigir redação já escrita).",
      `Incluir exatamente ${quantidade} textos motivadores — cada um em uma 'section' com título que identifique o motivador.`,
      "Incluir tema, gênero textual e comando de produção em 'sections' ou 'summary'.",
      "Incluir atividades de preparação (tese, argumentos, planejamento) em 'activities'.",
      "Incluir critérios de avaliação e competências (matriz ENEM ou escolar) em 'teacherNotes'.",
      request.incluirGabarito
        ? "Incluir redação modelo de referência e critérios de nota no 'answerKey'."
        : "Não incluir redação modelo no 'answerKey'.",
    ];
  }

  if (request.tipoMaterial === "resumo") {
    return [
      `Organizar o resumo em ${quantidade} seções temáticas no array 'sections', cada uma com bullets objetivos.`,
      "Incluir quadro de revisão ou perguntas de fixação nas 'activities'.",
    ];
  }

  if (request.tipoMaterial === "atividade") {
    return [
      `Gerar exatamente ${quantidade} atividades no array 'activities' (um objeto por atividade).`,
      "Cada atividade: 'title', 'instructions' claras e 'items' aplicáveis em sala.",
      request.incluirGabarito
        ? "Preencher 'answerKey' com a solução de cada item/atividade."
        : "Não incluir gabarito.",
    ];
  }

  if (request.tipoMaterial === "apostila") {
    return [
      `Estruturar a apostila em ${quantidade} capítulos/seções progressivas no array 'sections'.`,
      "Explicar o conteúdo antes da prática em cada seção; não iniciar com questões.",
      "Fechar com atividades de fixação nas 'activities'.",
    ];
  }

  return [
    "Manter estrutura pedagógica direta e aplicável em sala.",
    "Evitar texto genérico sem utilidade prática.",
  ];
}

export function buildMaterialEngineSystemInstruction(type: MaterialEngineType): string {
  return [
    "Você é a IA pedagógica do Planify.",
    "Responda exclusivamente com JSON válido no schema fornecido.",
    `Especialidade ativa: ${typeLabels[type]}.`,
    "Não use markdown, não use bloco de código, não mencione bastidores técnicos.",
    "A entrega deve ser aplicável para professor brasileiro da Educação Básica.",
  ].join("\n");
}

export function buildMaterialEnginePrompt(request: MaterialEngineRequest): string {
  const rules = specializedRules(request)
    .map((rule) => `- ${rule}`)
    .join("\n");

  return `
Gere material pedagógico para o Planify com qualidade profissional.

TIPO:
- Tipo técnico: ${request.tipoMaterial}
- Tipo pedagógico: ${typeLabels[request.tipoMaterial]}

DADOS DA SOLICITAÇÃO:
- Tema: ${request.tema}
- Etapa: ${request.etapa}
- Ano/Série: ${request.anoSerie}
- Componente curricular: ${request.componenteCurricular}
- Objetivo do professor: ${request.objetivo || "Não informado"}
- Quantidade desejada: ${request.quantidade}
- Dificuldade: ${request.dificuldade}
- Incluir gabarito: ${request.incluirGabarito ? "sim" : "não"}

REGRAS ESPECIALIZADAS:
${rules}

REGRAS GERAIS:
- Adequar linguagem ao ano/série.
- Entregar conteúdo coeso, sem repetição e sem preenchimento artificial.
- Entregar pronto para edição no editor do Planify.
- Entregar somente JSON no schema.
`.trim();
}
