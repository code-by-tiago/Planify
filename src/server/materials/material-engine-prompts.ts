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
    return [
      `Formato obrigatório do jogo: ${request.formatoJogo || "jogo pedagógico"}.`,
      "Preencha o objeto 'game' com 'format', 'rules' (passo a passo de aplicação) e 'components' (peças/recursos necessários).",
      "Inclua regras claras, componentes do jogo e sequência de aplicação em sala.",
      "Não transformar jogo em lista de exercícios comum.",
    ];
  }

  if (request.tipoMaterial === "slides") {
    return [
      `Gerar exatamente ${quantidade} slides no array 'slides'.`,
      "O primeiro slide é a capa (layout 'capa') e o último é o fechamento/síntese (layout 'fechamento').",
      "Distribuir os slides intermediários em: objetivos da aula, desenvolvimento do conteúdo em blocos, exemplo/aplicação prática e uma pergunta de checagem.",
      "Cada slide deve ter 'title' curto e direto, 'bullets' objetivos (3 a 5 itens, frases curtas, sem parágrafos) e 'speakerNotes' com a fala detalhada do professor para aquele slide.",
      "Nunca deixar um slide sem bullets nem sem notas de fala (exceto a capa, que pode ter poucos ou nenhum bullet).",
      "DESIGN VISUAL (obrigatório, para slides bonitos e não só texto):",
      "- 'layout': escolher por slide entre 'capa', 'conteudo', 'duasColunas', 'destaque' e 'fechamento'. Variar a composição ao longo da apresentação (não usar sempre o mesmo).",
      "- 'subtitle': frase curta de apoio ao título (use principalmente na capa e em slides de seção).",
      "- 'imagePrompt': descrição objetiva, em português, de UMA figura/ilustração que combine com o slide (ex.: 'ilustração de um ciclo da água com setas'). Inclua em pelo menos metade dos slides de conteúdo.",
      "- 'accentColor': uma cor da paleta entre 'indigo', 'violet', 'coral', 'amber', 'emerald', 'sky', 'rose', coerente com o clima do slide.",
      "- 'iconHint': uma palavra-chave simples do tema do slide (ex.: 'agua', 'livro', 'ideia').",
      "- 'callout': em 1 a 3 slides estratégicos, preencher com 'title' curto e 'text' com um destaque (conceito-chave, curiosidade, dica ou pergunta provocadora).",
      "Manter coesão narrativa: cada slide avança o raciocínio do anterior.",
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
      "Preencher o objeto 'mindMap' com 'central' (conceito central) e 'branches' (ramos principais).",
      "Cada ramo deve ter 'title' e 'items' (subtópicos curtos e hierárquicos).",
      "Gerar entre 4 e 7 ramos, cada um com 2 a 5 subtópicos.",
      "Não escrever parágrafos longos: o mapa mental é hierárquico e sintético.",
    ];
  }

  if (request.tipoMaterial === "plano-aula") {
    return [
      "Preencher o objeto 'lessonPlan.steps' com as etapas da aula em ordem cronológica.",
      "Cada etapa deve ter 'stage' (ex.: Introdução, Desenvolvimento, Prática, Fechamento), 'duration' (tempo estimado), 'description' e 'resources'.",
      "Incluir objetivos de aprendizagem nas 'sections' e formas de avaliação nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "sequencia") {
    return [
      "Organizar como sequência didática com aulas/encontros progressivos nas 'sections'.",
      "Cada seção representa uma aula com objetivos, conteúdos e atividades encadeadas.",
      "Incluir avaliação processual e produto final nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "projeto") {
    return [
      "Estruturar como projeto pedagógico: problema norteador, justificativa, etapas de execução e produto final nas 'sections'.",
      "Detalhar tarefas concretas e papéis dos estudantes nas 'activities'.",
      "Definir critérios de avaliação do projeto nas 'teacherNotes'.",
    ];
  }

  if (request.tipoMaterial === "redacao") {
    return [
      "Gerar proposta de redação para produção textual pelo estudante (não corrigir redação já escrita).",
      "Incluir tema, gênero textual, comando claro e 2 a 4 textos motivadores nas 'sections'.",
      "Incluir atividades de preparação: leitura dos motivadores, tese, argumentos e planejamento de parágrafos nas 'activities'.",
      "Incluir critérios de avaliação e competências (matriz ENEM ou escolar) nas 'teacherNotes'.",
      request.incluirGabarito
        ? "Incluir redação modelo de referência e critérios de nota no 'answerKey'."
        : "Não incluir redação modelo.",
    ];
  }

  if (request.tipoMaterial === "resumo") {
    return [
      "Entregar um resumo guiado por seções temáticas, com os pontos-chave em 'bullets'.",
      "Incluir um quadro de revisão ou perguntas de fixação nas 'activities'.",
    ];
  }

  if (request.tipoMaterial === "atividade") {
    return [
      `Gerar aproximadamente ${quantidade} itens/exercícios distribuídos nas 'activities'.`,
      "Cada atividade deve ter instruções claras e itens aplicáveis em sala.",
      request.incluirGabarito
        ? "Consolidar as respostas no array 'answerKey'."
        : "Não incluir gabarito.",
    ];
  }

  if (request.tipoMaterial === "apostila") {
    return [
      "Estruturar por seções progressivas com explicação antes da prática.",
      "Não iniciar a apostila diretamente com questões.",
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
