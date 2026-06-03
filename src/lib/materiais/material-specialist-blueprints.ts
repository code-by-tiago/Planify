import type { MaterialAIInput, MaterialAIQuestion, MaterialAISection } from "../../types/ai";

export type MaterialBlueprintKind =
  | "atividade"
  | "prova"
  | "apostila"
  | "lista"
  | "revisao"
  | "sequencia"
  | "jogo"
  | "projeto"
  | "roteiro";

type RequiredSection = {
  key: string;
  title: string;
  keywords: string[];
  content: string;
  items: string[];
};

export type MaterialSpecialistBlueprint = {
  kind: MaterialBlueprintKind;
  specialistName: string;
  qualityMission: string;
  defaultQuestionCount: number | null;
  allowsQuestions: boolean;
  minSections: number;
  exactQuestionContract: boolean;
  structureRules: string[];
  forbiddenRules: string[];
  questionStrategy: string[];
  requiredSections: RequiredSection[];
};

export function normalizeForPedagogy(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeInputContents(conteudos: MaterialAIInput["conteudos"]): string[] {
  const normalized = normalizeStringList(conteudos);
  return normalized.length ? normalized : [];
}

export function canonicalMaterialType(type: unknown): MaterialBlueprintKind {
  const normalized = normalizeForPedagogy(type);
  if (normalized.includes("apostila")) return "apostila";
  if (normalized.includes("prova") || normalized.includes("avaliacao") || normalized.includes("avaliativo")) return "prova";
  if (normalized.includes("lista")) return "lista";
  if (normalized.includes("revis")) return "revisao";
  if (normalized.includes("sequencia")) return "sequencia";
  if (normalized.includes("jogo") || normalized.includes("ludico")) return "jogo";
  if (normalized.includes("projeto")) return "projeto";
  if (normalized.includes("roteiro")) return "roteiro";
  return "atividade";
}

function contentList(input: MaterialAIInput): string[] {
  const contents = normalizeInputContents(input.conteudos);
  return contents.length ? contents : [String(input.tema || "tema central").trim()].filter(Boolean);
}

export function getComponentLens(input: MaterialAIInput): string[] {
  const component = normalizeForPedagogy(`${input.areaConhecimento || ""} ${input.componenteCurricular || ""}`);
  const theme = String(input.tema || "tema estudado").trim();

  if (/matematica|algebra|geometria|estatistica/.test(component)) {
    return [
      `Priorize raciocínio matemático, procedimentos, representação, resolução de problemas e justificativa sobre ${theme}.`,
      "Inclua comandos que exijam cálculo, interpretação de dados, padrões, comparação, estimativa ou argumentação matemática, conforme o ano/série.",
    ];
  }

  if (/geografia|territorio|espaco/.test(component)) {
    return [
      `Priorize raciocínio espacial, território, paisagem, lugar, escala, mapas, sociedade-natureza e impactos relacionados a ${theme}.`,
      "Evite transformar o tema em mera interpretação de texto; o foco deve ser geográfico.",
    ];
  }

  if (/historia|historico/.test(component)) {
    return [
      `Priorize temporalidade, sujeitos históricos, fontes, permanências, mudanças, conflitos, processos e contextos relacionados a ${theme}.`,
      "Evite perguntas genéricas; trabalhe análise histórica, causalidade, comparação e interpretação de fontes quando fizer sentido.",
    ];
  }

  if (/ciencias|biologia|fisica|quimica|natureza/.test(component)) {
    return [
      `Priorize investigação científica, conceitos, fenômenos, evidências, experimentação possível, modelos explicativos e relações causa-efeito sobre ${theme}.`,
      "Inclua observação, hipótese, análise de dados, explicação de fenômenos ou aplicação científica conforme o nível escolar.",
    ];
  }

  if (/portugues|lingua portuguesa|redacao|literatura|linguagem/.test(component)) {
    return [
      `Priorize leitura, escrita, oralidade, análise linguística, gêneros textuais, repertório e produção de sentido sobre ${theme}.`,
      "As questões podem envolver texto-base, interpretação, produção textual, revisão, argumentação e análise da linguagem.",
    ];
  }

  if (/ingles|espanhol|lingua estrangeira/.test(component)) {
    return [
      `Priorize vocabulário, compreensão, uso comunicativo da língua, leitura guiada e produção curta relacionada a ${theme}.`,
      "Ajuste a complexidade linguística ao ano/série e inclua comandos claros para prática comunicativa.",
    ];
  }

  if (/arte|artes/.test(component)) {
    return [
      `Priorize apreciação, criação, repertório cultural, técnicas, linguagem artística e reflexão estética sobre ${theme}.`,
      "Inclua análise de obras, experimentação, produção autoral e socialização quando fizer sentido.",
    ];
  }

  if (/educacao fisica|educacao fisica/.test(component)) {
    return [
      `Priorize cultura corporal, prática segura, regras, cooperação, corpo, movimento e reflexão sobre ${theme}.`,
      "Inclua orientações de vivência, adaptação, participação e avaliação compatíveis com a escola.",
    ];
  }

  if (/ensino religioso/.test(component)) {
    return [
      `Priorize respeito à diversidade, valores, tradições, convivência, símbolos e reflexão ética sobre ${theme}.`,
      "Mantenha abordagem não proselitista, respeitosa e adequada à diversidade dos estudantes.",
    ];
  }

  if (/filosofia|sociologia/.test(component)) {
    return [
      `Priorize problematização, conceitos, argumentação, análise social, exemplos do cotidiano e debate fundamentado sobre ${theme}.`,
      "Inclua questões que exijam justificar, comparar posições, interpretar situações e formular argumentos.",
    ];
  }

  return [
    `Mantenha o foco conceitual do componente curricular informado e trate ${theme} sem deslocar o material para outra disciplina.`,
    "Use vocabulário escolar adequado, exemplos contextualizados e comandos coerentes com o ano/série.",
  ];
}

function section(title: string, keywords: string[], content: string, items: string[] = []): RequiredSection {
  return {
    key: normalizeForPedagogy(title).replace(/\s+/g, "_"),
    title,
    keywords,
    content,
    items,
  };
}

export function getMaterialBlueprint(input: MaterialAIInput): MaterialSpecialistBlueprint {
  const kind = canonicalMaterialType(input.tipo);
  const theme = String(input.tema || "tema estudado").trim() || "tema estudado";
  const component = String(input.componenteCurricular || "componente curricular").trim() || "componente curricular";
  const contents = contentList(input);
  const contentsAsItems = contents.map((item) => `Trabalhar: ${item}`);
  const componentLens = getComponentLens(input);

  const commonForbidden = [
    "Não misturar tipos de material.",
    "Não entregar promessa sem conteúdo correspondente.",
    "Não usar frases genéricas para preencher espaço.",
    "Não revelar respostas na versão do aluno logo abaixo das questões.",
    "Não mudar o componente curricular escolhido pelo professor.",
  ];

  const commonQuestionStrategy = [
    "Cada questão precisa ter enunciado completo, comando claro, resposta esperada e critério de correção.",
    "As questões devem ser numeradas em sequência, sem pular número e sem repetir enunciado disfarçado.",
    "A quantidade pedida pelo professor é contrato de entrega: se pediu 10, entregar exatamente 10.",
    ...componentLens,
  ];

  if (kind === "apostila") {
    return {
      kind,
      specialistName: "Especialista Planify em Apostilas Didáticas",
      qualityMission: "Construir apostila completa, progressiva, explicativa e aplicável, com estudo antes da prática.",
      defaultQuestionCount: 10,
      allowsQuestions: true,
      minSections: 9,
      exactQuestionContract: true,
      structureRules: [
        "Começar ensinando: apresentação, objetivos, capítulos/unidades e explicações progressivas.",
        "Cada conteúdo selecionado precisa aparecer em uma unidade ou seção própria.",
        "Incluir exemplos, boxes de curiosidade, vocabulário, síntese, glossário e exercícios finais.",
        "Os exercícios devem vir depois da explicação, nunca como estrutura principal da apostila.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não transformar apostila em lista de atividades soltas.", "Não começar a apostila diretamente com questões."],
      questionStrategy: commonQuestionStrategy,
      requiredSections: [
        section("Apresentação da apostila", ["apresentacao", "apostila"], `Apresentar o estudo de ${theme} em ${component}, explicando por que o tema é importante para a aprendizagem da turma.`, contentsAsItems),
        section("Objetivos de aprendizagem", ["objetivo", "aprendizagem"], "Indicar o que o estudante deverá compreender, analisar, aplicar e comunicar ao final do material.", ["Compreender os conceitos centrais.", "Aplicar o conhecimento em situações contextualizadas.", "Registrar conclusões com clareza."]),
        section("Unidade 1 — Conceitos essenciais", ["unidade", "conceitos", "essenciais"], `Explicar os conceitos básicos necessários para estudar ${theme}, usando linguagem adequada ao ano/série.`, contentsAsItems),
        section("Unidade 2 — Exemplos e contextualização", ["exemplo", "contextualizacao"], `Relacionar ${theme} com exemplos concretos, situações próximas da realidade escolar e vocabulário próprio de ${component}.`, []),
        section("Unidade 3 — Análise orientada", ["analise", "orientada"], "Conduzir o estudante a comparar informações, observar relações, interpretar dados, situações, textos, imagens ou problemas conforme o componente.", []),
        section("Box de curiosidade e ampliação", ["curiosidade", "ampliacao", "box"], "Apresentar informações complementares que aprofundam o tema sem fugir do conteúdo central.", []),
        section("Vocabulário essencial", ["vocabulario", "glossario"], "Listar e explicar palavras-chave para apoiar a compreensão da apostila.", contents.map((item) => `Termo relacionado: ${item}`)),
        section("Exercícios de fixação", ["exercicio", "fixacao", "pratica"], "Resolver as questões finais apenas depois da leitura das unidades. O gabarito deve ficar separado para o professor.", []),
        section("Síntese final", ["sintese", "resumo", "fechamento"], `Retomar as ideias principais sobre ${theme} e orientar o estudante a organizar o que aprendeu.`, ["Ideia principal", "Exemplo estudado", "Conceito-chave", "Dúvida para retomada"]),
      ],
    };
  }

  if (kind === "prova") {
    return {
      kind,
      specialistName: "Especialista Planify em Avaliações",
      qualityMission: "Construir prova objetiva, justa, completa, com questões variadas, gabarito e critérios de correção.",
      defaultQuestionCount: 10,
      allowsQuestions: true,
      minSections: 4,
      exactQuestionContract: true,
      structureRules: [
        "A prova deve avaliar, não ensinar em formato de apostila.",
        "Incluir instruções claras, distribuição de pontuação quando possível e gabarito separado.",
        "Mesclar objetivas e discursivas quando a quantidade permitir.",
        "As questões devem variar habilidade cognitiva: lembrar, compreender, aplicar, analisar e justificar.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não entregar texto longo de apostila como corpo da prova.", "Não deixar questão sem resposta esperada."],
      questionStrategy: commonQuestionStrategy,
      requiredSections: [
        section("Instruções da avaliação", ["instrucao", "avaliacao", "prova"], "Orientar leitura atenta, organização das respostas, tempo de realização e critérios gerais.", []),
        section("Critérios gerais de correção", ["criterio", "correcao"], "Explicar como serão avaliados domínio conceitual, clareza, justificativa, procedimento e adequação ao comando.", []),
        section("Distribuição da prova", ["distribuicao", "questoes"], "Organizar a prova com questões progressivas e equilibradas entre dificuldade básica, intermediária e desafiadora.", contentsAsItems),
        section("Orientação para o professor", ["professor", "orientacao"], "Sugerir como aplicar, corrigir e retomar dificuldades após a avaliação.", []),
      ],
    };
  }

  if (kind === "lista") {
    return {
      kind,
      specialistName: "Especialista Planify em Listas de Exercícios",
      qualityMission: "Construir lista progressiva de prática, com treino real, variedade e gabarito comentado.",
      defaultQuestionCount: 10,
      allowsQuestions: true,
      minSections: 4,
      exactQuestionContract: true,
      structureRules: [
        "Organizar blocos: básico, intermediário, desafio e retomada de erros comuns.",
        "Foco em treino e aplicação, não em longas explicações de apostila.",
        "As questões devem variar comandos e contextos.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não transformar lista em prova formal com clima avaliativo pesado.", "Não repetir o mesmo exercício com palavras trocadas."],
      questionStrategy: commonQuestionStrategy,
      requiredSections: [
        section("Orientações para resolver a lista", ["orientacao", "resolver", "lista"], "Explicar como o estudante deve registrar raciocínio, revisar tentativas e conferir o gabarito ao final.", []),
        section("Bloco básico", ["basico"], "Exercícios iniciais para consolidar conceitos fundamentais.", contentsAsItems),
        section("Bloco intermediário", ["intermediario"], "Exercícios com aplicação, comparação, interpretação ou procedimento mais elaborado.", []),
        section("Bloco desafio", ["desafio"], "Itens mais exigentes para ampliar raciocínio, argumentação e autonomia.", []),
      ],
    };
  }

  if (kind === "revisao") {
    return {
      kind,
      specialistName: "Especialista Planify em Revisões Guiadas",
      qualityMission: "Construir revisão que reorganiza o conhecimento, identifica lacunas e prepara para aplicação.",
      defaultQuestionCount: 10,
      allowsQuestions: true,
      minSections: 6,
      exactQuestionContract: true,
      structureRules: [
        "Começar com síntese dos conceitos e mapa mental textual.",
        "Retomar pontos de atenção, erros comuns e exemplos.",
        "Usar exercícios para checagem e autoavaliação, não como prova formal.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não entregar apenas lista de questões sem retomada conceitual."],
      questionStrategy: commonQuestionStrategy,
      requiredSections: [
        section("Síntese para revisão", ["sintese", "revisao"], `Retomar as ideias centrais de ${theme} em linguagem clara e organizada.`, contentsAsItems),
        section("Mapa mental textual", ["mapa", "mental"], "Organizar conceitos em relações simples: conceito central, partes, exemplos, cuidados e aplicações.", []),
        section("Pontos de atenção", ["pontos", "atencao"], "Indicar dúvidas frequentes, confusões comuns e cuidados na resolução.", []),
        section("Exemplos resolvidos ou comentados", ["exemplo", "comentado", "resolvido"], "Apresentar exemplos curtos que retomam o raciocínio esperado.", []),
        section("Exercícios de checagem", ["exercicio", "checagem"], "Resolver as questões de revisão e conferir o gabarito depois.", []),
        section("Autoavaliação", ["autoavaliacao"], "Levar o estudante a indicar o que já domina, o que precisa revisar e que estratégia usará para estudar.", ["Domino bem", "Preciso revisar", "Minha próxima ação"]),
      ],
    };
  }

  if (kind === "sequencia") {
    return {
      kind,
      specialistName: "Especialista Planify em Sequências Didáticas",
      qualityMission: "Construir sequência com aulas/momentos progressivos, ação docente, ação discente e avaliação.",
      defaultQuestionCount: null,
      allowsQuestions: false,
      minSections: 6,
      exactQuestionContract: false,
      structureRules: [
        "Organizar momentos/aulas com tempo, objetivo, metodologia, recursos, ação do professor e ação do estudante.",
        "Incluir sondagem, contextualização, desenvolvimento, prática, socialização, avaliação e retomada.",
        "Cada conteúdo selecionado deve aparecer na progressão das aulas.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não transformar sequência didática em prova ou lista de questões."],
      questionStrategy: [],
      requiredSections: [
        section("Aula/Momento 1 — Sondagem e sensibilização", ["sondagem", "sensibilizacao", "momento 1", "aula 1"], "Levantar conhecimentos prévios e apresentar o problema ou situação inicial.", contentsAsItems),
        section("Aula/Momento 2 — Contextualização", ["contextualizacao", "momento 2", "aula 2"], "Situar o tema no componente curricular e na realidade dos estudantes.", []),
        section("Aula/Momento 3 — Desenvolvimento orientado", ["desenvolvimento", "orientado", "momento 3", "aula 3"], "Conduzir estudo, explicação, investigação, leitura, demonstração ou resolução guiada.", []),
        section("Aula/Momento 4 — Prática ou produção", ["pratica", "producao", "momento 4", "aula 4"], "Organizar tarefa prática, produção, resolução ou construção coletiva.", []),
        section("Socialização e fechamento", ["socializacao", "fechamento"], "Compartilhar resultados, sistematizar aprendizagens e retomar objetivos.", []),
        section("Avaliação e evidências", ["avaliacao", "evidencia"], "Definir instrumentos, evidências e critérios para acompanhar a aprendizagem.", []),
      ],
    };
  }

  if (kind === "projeto") {
    return {
      kind,
      specialistName: "Especialista Planify em Projetos Pedagógicos",
      qualityMission: "Construir projeto com problema real, etapas, investigação, produto final, socialização e rubrica.",
      defaultQuestionCount: null,
      allowsQuestions: false,
      minSections: 8,
      exactQuestionContract: false,
      structureRules: [
        "Começar com justificativa e problema norteador.",
        "Organizar etapas com investigação, produção, acompanhamento e socialização.",
        "Definir produto final concreto e critérios de avaliação.",
        "As tarefas devem ser etapas de projeto, não prova disfarçada.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não transformar projeto em lista de perguntas sem produto final."],
      questionStrategy: [],
      requiredSections: [
        section("Apresentação e justificativa", ["apresentacao", "justificativa"], `Explicar a relevância do projeto sobre ${theme} para a turma e para ${component}.`, contentsAsItems),
        section("Problema norteador", ["problema", "norteador"], "Formular uma pergunta ou desafio central que conduza investigação e produção.", []),
        section("Objetivos do projeto", ["objetivo"], "Definir aprendizagens, competências, atitudes e produção esperada.", []),
        section("Etapa 1 — Investigação", ["investigacao", "etapa 1"], "Pesquisar, observar, levantar dados, analisar fontes ou diagnosticar uma situação.", []),
        section("Etapa 2 — Planejamento da produção", ["planejamento", "producao", "etapa 2"], "Organizar grupos, recursos, papéis, cronograma e critérios de produto.", []),
        section("Etapa 3 — Desenvolvimento", ["desenvolvimento", "etapa 3"], "Executar a produção, registrar decisões e acompanhar avanços.", []),
        section("Produto final e socialização", ["produto", "socializacao"], "Definir o que será entregue/apresentado e como será compartilhado.", []),
        section("Rubrica de avaliação", ["rubrica", "avaliacao"], "Avaliar domínio do conteúdo, processo, colaboração, comunicação e qualidade do produto final.", []),
      ],
    };
  }

  if (kind === "roteiro") {
    return {
      kind,
      specialistName: "Especialista Planify em Roteiros de Estudo",
      qualityMission: "Construir roteiro autônomo que orienta antes, durante e depois do estudo.",
      defaultQuestionCount: null,
      allowsQuestions: false,
      minSections: 5,
      exactQuestionContract: false,
      structureRules: [
        "Usar linguagem direta para o estudante.",
        "Separar antes do estudo, durante o estudo, registro, checagem e autoavaliação.",
        "Orientar leitura, observação, resolução, resumo e revisão.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não transformar roteiro em prova formal ou apostila extensa."],
      questionStrategy: [],
      requiredSections: [
        section("Antes do estudo", ["antes", "estudo"], "Preparar materiais, retomar conhecimentos prévios e definir meta de estudo.", contentsAsItems),
        section("Durante o estudo", ["durante", "estudo"], "Ler, observar, registrar palavras-chave, exemplos e dúvidas.", []),
        section("Registro orientado", ["registro", "orientado"], "Organizar anotações, síntese, esquema, tabela ou resolução guiada.", []),
        section("Depois do estudo", ["depois", "estudo"], "Revisar, explicar com as próprias palavras e resolver uma pequena checagem.", []),
        section("Autoavaliação", ["autoavaliacao"], "Marcar o que compreendeu, o que ainda precisa revisar e o próximo passo.", ["Compreendi", "Tenho dúvida", "Preciso de ajuda", "Vou revisar"]),
      ],
    };
  }

  if (kind === "jogo") {
    return {
      kind,
      specialistName: "Especialista Planify em Jogos Pedagógicos",
      qualityMission: "Construir jogo pronto para uso, com regras, peças, pistas, cartelas, termos e gabarito.",
      defaultQuestionCount: null,
      allowsQuestions: false,
      minSections: 5,
      exactQuestionContract: false,
      structureRules: [
        "Entregar jogo aplicável, imprimível e coerente com o modelo escolhido.",
        "Incluir preparação, regras, modo de jogar, variações e fechamento pedagógico.",
        "Incluir termos/pistas/perguntas/peças específicos do tema.",
        ...componentLens,
      ],
      forbiddenRules: [...commonForbidden, "Não entregar apenas explicação de jogo sem material pronto."],
      questionStrategy: [],
      requiredSections: [
        section("Objetivo do jogo", ["objetivo", "jogo"], `Revisar ou aprofundar ${theme} de forma lúdica e pedagogicamente orientada.`, contentsAsItems),
        section("Materiais e preparação", ["materiais", "preparacao"], "Listar o que imprimir, recortar, organizar e entregar aos grupos.", []),
        section("Regras e modo de jogar", ["regras", "modo", "jogar"], "Explicar a dinâmica do início ao fechamento.", []),
        section("Peças, pistas ou comandos", ["pecas", "pistas", "comandos"], "Fornecer elementos prontos para uso, conforme o modelo de jogo escolhido.", []),
        section("Fechamento pedagógico", ["fechamento", "pedagogico"], "Conduzir correção, retomada conceitual e registro da aprendizagem.", []),
      ],
    };
  }

  return {
    kind: "atividade",
    specialistName: "Especialista Planify em Atividades Didáticas",
    qualityMission: "Construir atividade completa, prática e orientada, com comandos claros e progressão.",
    defaultQuestionCount: 10,
    allowsQuestions: true,
    minSections: 5,
    exactQuestionContract: true,
    structureRules: [
      "Organizar aquecimento, contextualização, prática orientada, desafio e fechamento.",
      "A atividade deve ser aplicável em sala e coerente com o tempo informado.",
      "As questões devem aparecer como parte da prática, não como prova formal.",
      ...componentLens,
    ],
    forbiddenRules: [...commonForbidden, "Não transformar atividade em apostila longa ou prova formal."],
    questionStrategy: commonQuestionStrategy,
    requiredSections: [
      section("Aquecimento", ["aquecimento"], "Ativar conhecimentos prévios e aproximar a turma do tema.", contentsAsItems),
      section("Contextualização", ["contextualizacao"], `Apresentar uma situação, exemplo, problema ou texto disparador sobre ${theme}.`, []),
      section("Prática orientada", ["pratica", "orientada"], "Resolver ou produzir com apoio de comandos claros e acompanhamento do professor.", []),
      section("Desafio de aplicação", ["desafio", "aplicacao"], "Propor uma tarefa um pouco mais exigente para aplicar o que foi estudado.", []),
      section("Fechamento e socialização", ["fechamento", "socializacao"], "Registrar conclusões, socializar respostas e retomar dúvidas.", []),
    ],
  };
}

export function buildSpecialistPromptBlock(input: MaterialAIInput): string {
  const blueprint = getMaterialBlueprint(input);
  const contents = contentList(input);
  const sections = blueprint.requiredSections.map((item) => `- ${item.title}: ${item.content}`).join("\n");
  const rules = blueprint.structureRules.map((rule) => `- ${rule}`).join("\n");
  const forbidden = blueprint.forbiddenRules.map((rule) => `- ${rule}`).join("\n");
  const questionRules = blueprint.questionStrategy.length
    ? blueprint.questionStrategy.map((rule) => `- ${rule}`).join("\n")
    : "- Este tipo de material não deve usar bloco de questões como estrutura principal, salvo se o professor pediu explicitamente uma checagem curta.";

  return `
ESPECIALISTA ATIVO:
${blueprint.specialistName}

MISSÃO DE QUALIDADE:
${blueprint.qualityMission}

CONTEÚDOS QUE PRECISAM APARECER DE FORMA COERENTE:
${contents.map((item) => `- ${item}`).join("\n")}

ARQUITETURA OBRIGATÓRIA DO TIPO:
${sections}

REGRAS DO ESPECIALISTA:
${rules}

REGRAS DE QUESTÕES/GABARITO:
${questionRules}

PROIBIÇÕES:
${forbidden}
`.trim();
}

export function buildRequiredSections(input: MaterialAIInput): MaterialAISection[] {
  return getMaterialBlueprint(input).requiredSections.map((item) => ({
    titulo: item.title,
    conteudo: item.content,
    itens: item.items,
  }));
}

export function buildContentCoverageSection(input: MaterialAIInput, content: string): MaterialAISection {
  const blueprint = getMaterialBlueprint(input);
  const theme = String(input.tema || "tema estudado").trim() || "tema estudado";
  return {
    titulo: `Aprofundamento — ${content}`,
    conteudo: `Esta seção aprofunda o conteúdo "${content}" dentro do tema ${theme}, respeitando o formato ${blueprint.kind} e o componente ${input.componenteCurricular}. O professor pode usar este bloco para garantir que o conteúdo selecionado não fique apenas citado, mas realmente trabalhado no material.`,
    itens: [
      `Conceito ou ideia central: ${content}.`,
      "Exemplo contextualizado adequado ao ano/série.",
      "Pergunta orientadora para verificar compreensão.",
      "Registro esperado do estudante ou evidência de aprendizagem.",
    ],
  };
}

export function buildCompletionQuestion(input: MaterialAIInput, index: number): MaterialAIQuestion {
  const blueprint = getMaterialBlueprint(input);
  const contents = contentList(input);
  const content = contents[index % contents.length] || String(input.tema || "tema estudado").trim() || "tema estudado";
  const theme = String(input.tema || content).trim() || content;
  const component = String(input.componenteCurricular || "componente curricular").trim() || "componente curricular";
  const kind = blueprint.kind;
  const isObjective = kind === "prova" && index % 3 === 0;
  const lens = getComponentLens(input)[0] || `Mantenha foco em ${component}.`;

  if (isObjective) {
    return {
      numero: index + 1,
      tipo: "questão objetiva contextualizada",
      enunciado: `Leia a situação relacionada a ${theme} e ao conteúdo "${content}". Qual alternativa apresenta a análise mais adequada para ${component}?`,
      alternativas: [
        `A) Relaciona corretamente ${content} ao tema ${theme}, usando raciocínio próprio de ${component}.`,
        `B) Apresenta uma afirmação genérica sobre ${theme}, sem explicar o conteúdo estudado.`,
        `C) Confunde ${content} com um conceito de outro componente curricular.`,
        "D) Ignora a situação apresentada e responde apenas com opinião sem justificativa.",
        "E) Usa exemplo desconectado do ano/série e do tema central.",
      ],
      respostaEsperada: "Alternativa A. A resposta correta relaciona conteúdo, tema e componente curricular com justificativa adequada.",
      criterioCorrecao: "Considerar correta a alternativa A e, se houver justificativa, avaliar se o estudante relacionou conceito, tema e componente de forma coerente.",
    };
  }

  const enunciadoByKind: Record<MaterialBlueprintKind, string> = {
    apostila: `Exercício de fixação: explique o conteúdo "${content}" dentro do tema ${theme}. Use um exemplo e registre por que esse conhecimento é importante em ${component}.`,
    atividade: `Com base no estudo de ${theme}, resolva a proposta sobre "${content}". Apresente resposta clara, exemplo e justificativa.`,
    lista: `Treino progressivo: aplique o conteúdo "${content}" para resolver uma situação sobre ${theme}. Mostre o raciocínio utilizado.`,
    revisao: `Revisão: escreva uma síntese curta sobre "${content}", cite um exemplo e indique uma dúvida que precisa ser retomada.`,
    prova: `Questão discursiva: analise o conteúdo "${content}" no contexto de ${theme}. Explique o conceito central, apresente exemplo e justifique sua resposta.`,
    sequencia: `Registro de aprendizagem: explique o que foi compreendido sobre "${content}" durante a sequência didática de ${theme}.`,
    projeto: `Registro do projeto: explique como "${content}" contribui para investigar o problema norteador sobre ${theme}.`,
    roteiro: `Registro de estudo: anote o que compreendeu sobre "${content}" e como esse conteúdo se relaciona ao tema ${theme}.`,
    jogo: `Rodada de retomada: explique o termo "${content}" e relacione-o ao tema ${theme}.`,
  };

  return {
    numero: index + 1,
    tipo: kind === "prova" ? "questão discursiva contextualizada" : "questão aberta orientada",
    enunciado: `${enunciadoByKind[kind]} ${lens}`,
    alternativas: [],
    respostaEsperada: `A resposta deve demonstrar compreensão de "${content}", relacionar o conteúdo ao tema ${theme}, usar vocabulário adequado de ${component}, apresentar exemplo coerente e justificar a ideia principal.`,
    criterioCorrecao: "Avaliar domínio conceitual, clareza, relação com o tema, exemplo, justificativa e adequação ao ano/série.",
  };
}
