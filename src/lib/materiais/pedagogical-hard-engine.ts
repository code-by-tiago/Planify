import type {
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
} from "../../types/ai";

type ExerciseTemplate = {
  tipo: string;
  comando: string;
  resposta: string;
  criterio: string;
  alternativas?: string[];
};

type DisciplineProfile = {
  eixo: string;
  abertura: string;
  objetivos: string[];
  comandos: string[];
  vocabulario: string[];
  criterios: string[];
};

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

function splitConteudos(value: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value: string): string {
  return String(value || "")
    .replace(/^\d+[.)-]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTitle(line: string): string {
  return cleanTitle(line.split(":")[0] || line).slice(0, 120) || "conteúdo estudado";
}

function clampQuestionCount(value: unknown, fallback = 10): number {
  const parsed = Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(8, Math.min(parsed, 25));
}

function isHardType(type: string): boolean {
  const t = normalize(type);
  return ["atividade", "prova", "lista", "revisao", "apostila", "sequencia", "roteiro", "projeto"].includes(t);
}

export function shouldUseHardPedagogicalEngine(type: string): boolean {
  return isHardType(type);
}

function lettered(items: string[]): string {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean);
  return clean.slice(0, 10).map((item, index) => `${LETTERS[index]}) ${item}`).join("\n");
}

function answerKey(items: string[]): string {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean);
  return clean.slice(0, 10).map((item, index) => `${LETTERS[index]}) ${item}`).join("; ");
}

function profileFor(input: MaterialAIInput): DisciplineProfile {
  const component = normalize(input.componenteCurricular);
  const tema = input.tema || "tema estudado";

  if (component.includes("redacao") || component.includes("redação")) {
    return {
      eixo: "Produção textual e argumentação",
      abertura: `Este material trabalha ${tema} como uma oficina completa de redação, com leitura da proposta, recorte temático, tese, argumentos, repertório, coesão, coerência, parágrafo, reescrita e revisão orientada.`,
      objetivos: [
        "Planejar textos com tese, argumentos e conclusão coerentes.",
        "Usar repertório sociocultural de forma pertinente ao tema.",
        "Revisar parágrafos, conectivos, coesão e proposta de intervenção quando aplicável.",
      ],
      comandos: ["tese", "argumento", "repertório", "coesão", "reescrita", "intervenção", "parágrafo", "conclusão"],
      vocabulario: ["tese", "argumento", "repertório", "coesão", "coerência", "parágrafo", "intervenção", "conclusão", "recorte", "proposta"],
      criterios: ["clareza da tese", "pertinência dos argumentos", "organização dos parágrafos", "uso de conectivos", "adequação à proposta"],
    };
  }

  if (component.includes("escrita criativa")) {
    return {
      eixo: "Autoria, narrativa e criação literária",
      abertura: `Este material trabalha ${tema} como oficina de escrita criativa, com personagem, cenário, conflito, narrador, diálogo, clímax, desfecho, descrição, estilo e revisão autoral.`,
      objetivos: [
        "Criar narrativas com personagem, cenário, conflito e desfecho.",
        "Experimentar foco narrativo, diálogo e descrição expressiva.",
        "Revisar o texto criativo considerando clareza, ritmo e originalidade.",
      ],
      comandos: ["personagem", "cenário", "conflito", "narrador", "diálogo", "clímax", "desfecho", "descrição"],
      vocabulario: ["personagem", "cenário", "conflito", "narrador", "diálogo", "clímax", "desfecho", "descrição", "atmosfera", "voz"],
      criterios: ["criatividade", "coerência narrativa", "construção de personagens", "uso de detalhes", "revisão do texto"],
    };
  }

  if (component.includes("portuguesa")) {
    return {
      eixo: "Leitura, análise linguística e produção textual",
      abertura: `Este material trabalha ${tema} com exercícios amplos de leitura, interpretação, vocabulário, análise linguística, identificação, classificação, reescrita, justificativa e produção curta, em padrão de livro de atividades.`,
      objetivos: [
        "Compreender sentidos explícitos e implícitos em textos e enunciados.",
        "Analisar recursos linguísticos, pontuação, classes ou funções conforme o conteúdo.",
        "Reescrever e justificar respostas com base no contexto.",
      ],
      comandos: ["lacuna", "classificação", "reescrita", "justificativa", "interpretação", "vocabulário", "pontuação", "análise"],
      vocabulario: ["texto", "contexto", "sentido", "termo", "frase", "pontuação", "classe", "função", "reescrita", "justificativa"],
      criterios: ["compreensão do comando", "uso de evidências", "adequação linguística", "justificativa"],
    };
  }

  if (component.includes("espanhola") || component.includes("espanhol")) {
    return {
      eixo: "Comunicação, vocabulário e cultura hispânica",
      abertura: `Este material trabalha ${tema} com vocabulário contextual, leitura curta, diálogos, tradução contextual, cultura hispânica, produção de frases e prática comunicativa em espanhol.`,
      objetivos: [
        "Usar vocabulário espanhol em contextos comunicativos.",
        "Interpretar frases e pequenos textos relacionados ao tema.",
        "Produzir respostas curtas, diálogos ou cartões em espanhol.",
      ],
      comandos: ["vocabulário", "diálogo", "tradução", "frase", "interpretação", "cultura", "associação", "produção"],
      vocabulario: ["palabra", "frase", "diálogo", "saludo", "cultura", "país", "lectura", "respuesta", "verbo", "contexto"],
      criterios: ["vocabulário correto", "compreensão contextual", "uso comunicativo", "pronúncia ou leitura"],
    };
  }

  if (component.includes("matematica")) {
    return {
      eixo: "Raciocínio, procedimentos e resolução de problemas",
      abertura: `Este material trabalha ${tema} com exercícios graduados, cálculo, interpretação de problemas, representação, justificativa, comparação de estratégias e desafio final.`,
      objetivos: [
        "Resolver exercícios com procedimentos adequados.",
        "Interpretar situações-problema e justificar estratégias.",
        "Conferir resultados e aplicar o conteúdo em desafios contextualizados.",
      ],
      comandos: ["calcule", "resolva", "complete", "compare", "explique", "problema", "tabela", "desafio"],
      vocabulario: ["cálculo", "resultado", "estratégia", "problema", "tabela", "operação", "unidade", "padrão", "representação", "estimativa"],
      criterios: ["procedimento correto", "organização dos cálculos", "interpretação", "resultado"],
    };
  }

  if (component.includes("religioso")) {
    return {
      eixo: "Leitura reflexiva, valores e convivência",
      abertura: `Este material trabalha ${tema} com leitura reflexiva, análise de valores, interpretação de narrativa, convivência, ética, respeito à diversidade e aplicação no cotidiano escolar.`,
      objetivos: [
        "Relacionar narrativas, valores e atitudes do cotidiano.",
        "Interpretar situações com respeito à diversidade de crenças e visões de mundo.",
        "Produzir respostas reflexivas com justificativa clara.",
      ],
      comandos: ["interpretação", "valor", "reflexão", "situação", "justificativa", "convivência", "atitude", "síntese"],
      vocabulario: ["respeito", "convivência", "valor", "ética", "narrativa", "reflexão", "atitude", "diálogo", "responsabilidade", "solidariedade"],
      criterios: ["respeito", "argumentação", "relação com o tema", "clareza da reflexão"],
    };
  }

  if (component.includes("historia") || component.includes("geografia") || component.includes("filosofia") || component.includes("sociologia")) {
    return {
      eixo: "Análise social, temporal, espacial e cidadã",
      abertura: `Este material trabalha ${tema} com leitura de contexto, análise de fontes/situações, comparação, argumentação, vocabulário conceitual e aplicação social do conhecimento.`,
      objetivos: [
        "Analisar fatos, conceitos ou situações do tema.",
        "Relacionar o conteúdo ao contexto social, histórico ou geográfico.",
        "Argumentar com base em evidências e exemplos.",
      ],
      comandos: ["analise", "compare", "relacione", "explique", "fonte", "contexto", "argumente", "síntese"],
      vocabulario: ["tempo", "espaço", "sociedade", "cultura", "fonte", "cidadania", "território", "processo", "causa", "consequência"],
      criterios: ["contextualização", "uso de evidências", "argumentação", "clareza"],
    };
  }

  if (component.includes("ciencias") || component.includes("biologia") || component.includes("fisica") || component.includes("quimica")) {
    return {
      eixo: "Investigação, explicação científica e aplicação",
      abertura: `Este material trabalha ${tema} com observação, conceitos científicos, análise de situações, interpretação de dados, hipóteses, evidências e aplicação em problemas.`,
      objetivos: [
        "Identificar conceitos científicos centrais.",
        "Interpretar situações, dados ou fenômenos relacionados ao tema.",
        "Explicar relações de causa, efeito, processo ou evidência.",
      ],
      comandos: ["observe", "explique", "classifique", "relacione", "hipótese", "dados", "experimento", "conclusão"],
      vocabulario: ["fenômeno", "processo", "evidência", "dados", "hipótese", "experimento", "resultado", "ambiente", "organismo", "energia"],
      criterios: ["conceito correto", "explicação científica", "uso de dados", "conclusão"],
    };
  }

  return {
    eixo: "Compreensão, aplicação e síntese",
    abertura: `Este material trabalha ${tema} com exercícios graduados, revisão, aplicação, produção final e correção comentada.`,
    objetivos: [
      "Compreender conceitos essenciais do tema.",
      "Aplicar conhecimentos em exercícios e situações-problema.",
      "Registrar sínteses e justificar respostas.",
    ],
    comandos: ["complete", "relacione", "explique", "interprete", "classifique", "justifique", "aplique", "desafio"],
    vocabulario: ["conceito", "exemplo", "aplicação", "síntese", "desafio", "registro", "resposta", "revisão", "contexto", "produção"],
    criterios: ["compreensão", "clareza", "aplicação", "organização"],
  };
}

function buildTextBase(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[]): string {
  const theme = input.tema || "tema estudado";
  const sample = conteudos.slice(0, 4).map(contentTitle).join(", ");
  return [
    `Leia o texto-base e resolva os exercícios com atenção aos comandos.`,
    `O tema ${theme} será estudado de forma completa, relacionando ${sample || "conceitos, exemplos e situações de aprendizagem"}.`,
    profile.abertura,
    `Durante a atividade, observe exemplos, compare casos, registre justificativas e revise suas respostas antes da entrega.`,
  ].join("\n\n");
}

function buildSubjectTemplates(theme: string): ExerciseTemplate[] {
  return [
    {
      tipo: "identificação ampla",
      comando: `Identifique e sublinhe o sujeito nas orações abaixo:\n${lettered([
        "Os estudantes revisaram a lição antes da prova.",
        "Chegaram cedo ao teatro municipal.",
        "Há muitas dúvidas sobre o conteúdo.",
        "A professora e os alunos organizaram a exposição.",
        "Precisa-se de colaboradores para a campanha.",
        "Faz dois anos que moro nesta cidade.",
        "Meus irmãos mais velhos viajaram ontem.",
        "Durante a reunião, discutiram vários problemas.",
        "Existem alternativas para resolver a situação.",
        "Choveu durante toda a madrugada.",
      ])}`,
      resposta: answerKey([
        "Os estudantes",
        "sujeito oculto/desinencial: eles/elas",
        "oração sem sujeito, com verbo haver no sentido de existir",
        "A professora e os alunos",
        "sujeito indeterminado, com índice de indeterminação do sujeito",
        "oração sem sujeito, com verbo fazer indicando tempo decorrido",
        "Meus irmãos mais velhos",
        "sujeito indeterminado pelo verbo na 3ª pessoa do plural sem referente claro",
        "alternativas",
        "oração sem sujeito, fenômeno da natureza",
      ]),
      criterio: "Avaliar se o estudante localiza o termo sobre o qual se declara algo e distingue sujeito expresso, oculto, indeterminado e oração sem sujeito.",
    },
    {
      tipo: "classificação completa",
      comando: `Classifique o sujeito em cada frase: simples, composto, oculto, indeterminado ou oração sem sujeito.\n${lettered([
        "A menina e o irmão chegaram atrasados.",
        "O professor explicou o conteúdo.",
        "Falaram muito sobre o assunto no corredor.",
        "Neva em algumas regiões do mundo.",
        "Estudamos para a avaliação final.",
        "O vento forte derrubou galhos da árvore.",
        "Havia muitos livros sobre a mesa.",
        "A diretora, os pais e os alunos participaram da reunião.",
        "Vende-se uma casa antiga no centro.",
        "Anoiteceu rapidamente na serra.",
      ])}`,
      resposta: answerKey([
        "sujeito composto",
        "sujeito simples",
        "sujeito indeterminado",
        "oração sem sujeito",
        "sujeito oculto/desinencial: nós",
        "sujeito simples",
        "oração sem sujeito",
        "sujeito composto",
        "sujeito simples: uma casa antiga",
        "oração sem sujeito",
      ]),
      criterio: "Considerar classificação, justificativa e observação da forma verbal.",
    },
    {
      tipo: "núcleo do sujeito",
      comando: `Identifique o núcleo do sujeito em cada oração.\n${lettered([
        "Aqueles livros antigos estavam na estante.",
        "Minha colega de sala venceu o concurso.",
        "As crianças do bairro brincavam na praça.",
        "O pequeno cachorro da vizinha latiu muito.",
        "Os alunos responsáveis entregaram os trabalhos.",
        "A professora de Ciências organizou o laboratório.",
        "Meu primo mais novo aprendeu a nadar.",
        "As flores amarelas do jardim murcharam.",
        "O grupo de voluntários chegou cedo.",
        "A cidade inteira acompanhou o desfile.",
      ])}`,
      resposta: answerKey(["livros", "colega", "crianças", "cachorro", "alunos", "professora", "primo", "flores", "grupo", "cidade"]),
      criterio: "Verificar se o estudante identifica o termo principal do sujeito, sem confundir adjuntos ou complementos.",
    },
    {
      tipo: "reescrita e transformação",
      comando: `Reescreva as orações conforme o comando indicado.\n${lettered([
        "'Vendemos todos os ingressos.' Transforme o sujeito oculto em sujeito simples explícito.",
        "'A menina chegou.' Acrescente outro núcleo para formar sujeito composto.",
        "'Os alunos atentos resolveram a atividade.' Reduza o sujeito ao núcleo.",
        "'Precisa-se de ajudantes.' Explique o efeito da partícula 'se'.",
        "'Há muitas perguntas.' Reescreva mantendo o sentido de existência.",
        "'Choveu ontem.' Explique por que não há sujeito.",
        "'João e Maria estudaram.' Transforme em sujeito simples, sem mudar completamente a ideia.",
        "'Compraram os livros.' Torne o sujeito explícito pelo contexto.",
        "'Faz cinco dias.' Complete a oração mantendo verbo impessoal.",
        "'Existem soluções.' Identifique sujeito e substitua por sinônimo.",
      ])}`,
      resposta: "Aceitar reescritas coerentes. Exemplos: a) Nós vendemos todos os ingressos. b) A menina e o irmão chegaram. c) alunos. d) Indetermina o sujeito quando ligada a verbo transitivo indireto/intransitivo/de ligação. e) Existem muitas perguntas. f) verbo indica fenômeno da natureza. g) Os estudantes estudaram. h) Eles compraram os livros. i) Faz cinco dias que espero. j) Sujeito: soluções; alternativas/respostas.",
      criterio: "Avaliar se a transformação preserva sentido e demonstra domínio do tipo de sujeito.",
    },
    {
      tipo: "lacunas conceituais",
      comando: `Complete as lacunas com termos do estudo sobre ${theme}.\n${lettered([
        "O sujeito ________ possui apenas um núcleo.",
        "O sujeito ________ possui dois ou mais núcleos.",
        "O sujeito ________ pode ser identificado pela desinência verbal.",
        "Na oração sem sujeito, o verbo é chamado de ________.",
        "O verbo haver, no sentido de existir, forma oração ________ sujeito.",
        "Em 'Precisa-se de funcionários', o sujeito é ________.",
        "O núcleo do sujeito é a palavra ________ do sujeito.",
        "Fenômenos da natureza geralmente formam oração ________ sujeito.",
        "Em 'Nós estudamos', o sujeito é ________.",
        "Em 'A mãe e o filho saíram', o sujeito é ________.",
      ])}`,
      resposta: answerKey(["simples", "composto", "oculto/desinencial", "impessoal", "sem", "indeterminado", "principal/central", "sem", "simples", "composto"]),
      criterio: "Conferir domínio de conceitos e vocabulário gramatical.",
    },
    {
      tipo: "análise textual",
      comando: `Leia o trecho e responda aos itens.\nTrecho: "Na escola, os estudantes organizaram uma campanha solidária. Recolheram alimentos, conversaram com as famílias e ajudaram muitas pessoas. Havia alegria nos corredores."\n${lettered([
        "Identifique o sujeito da primeira oração.",
        "Qual é o núcleo desse sujeito?",
        "Classifique o sujeito da primeira oração.",
        "Em 'Recolheram alimentos', que tipo de sujeito aparece?",
        "Qual termo do contexto ajuda a recuperar esse sujeito?",
        "Em 'Havia alegria', há sujeito? Explique.",
        "Reescreva 'Recolheram alimentos' com sujeito explícito.",
        "Crie uma oração com sujeito composto relacionada ao trecho.",
        "Retire do trecho uma ação praticada pelos estudantes.",
        "Explique como a identificação do sujeito ajuda na compreensão do texto.",
      ])}`,
      resposta: "a) os estudantes; b) estudantes; c) sujeito simples; d) oculto/desinencial; e) os estudantes; f) não, verbo haver no sentido de existir; g) Os estudantes recolheram alimentos; h) resposta pessoal coerente; i) recolheram/conversaram/ajudaram; j) ajuda a saber quem pratica ou sofre a ação.",
      criterio: "Avaliar análise integrada em contexto textual, não apenas frases soltas.",
    },
  ];
}

function buildExerciseTemplates(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[]): ExerciseTemplate[] {
  const theme = input.tema || "tema estudado";
  const c = conteudos.length ? conteudos.map(contentTitle) : [theme];
  const component = normalize(input.componenteCurricular);
  const type = normalize(input.tipo);

  if (component.includes("portuguesa") && normalize(theme).includes("sujeito")) {
    return buildSubjectTemplates(theme);
  }

  if (component.includes("redacao") || component.includes("redação")) {
    return [
      { tipo: "leitura da proposta", comando: `Analise a proposta temática sobre "${theme}" e responda.\n${lettered(["Qual é o tema central?", "Qual recorte específico poderia ser adotado?", "Que problema social aparece no tema?", "Quem é afetado por esse problema?", "Que causa pode ser levantada?", "Que consequência pode ser discutida?", "Qual tese inicial você defenderia?", "Que argumento histórico caberia?", "Que argumento social caberia?", "Que intervenção ou conclusão seria coerente?"])}`, resposta: "Respostas devem demonstrar leitura da proposta, recorte temático, tese e planejamento argumentativo.", criterio: "Avaliar compreensão do tema, recorte e coerência do planejamento." },
      { tipo: "tese e argumentos", comando: `Monte um projeto de texto com base em ${theme}.\n${lettered(["Escreva uma tese em uma frase.", "Crie um argumento de causa.", "Crie um argumento de consequência.", "Crie um argumento de comparação.", "Indique um exemplo do cotidiano.", "Indique um repertório cultural possível.", "Escreva um tópico frasal.", "Escolha um conectivo de adição.", "Escolha um conectivo de conclusão.", "Escreva uma frase de fechamento."])}`, resposta: "Projeto de texto coerente, com tese clara, argumentos variados e conectivos adequados.", criterio: "Observar progressão argumentativa e pertinência ao tema." },
      { tipo: "reescrita", comando: `Reescreva e melhore os trechos abaixo, tornando-os mais formais e claros.\n${lettered(["O assunto é muito importante e todo mundo devia saber.", "As pessoas tem que pensar melhor nisso.", "Isso acontece por causa de muitas coisas.", "A sociedade precisa mudar de atitude.", "O problema é grande e ruim.", "Muita gente sofre com esse tema.", "A escola pode ajudar nisso aí.", "O governo tem que fazer alguma coisa.", "Esse tema está na mídia toda hora.", "Conclui-se que é preciso resolver."])}`, resposta: "Aceitar reescritas com formalidade, precisão vocabular, concordância e coesão.", criterio: "Avaliar melhoria linguística, clareza e adequação ao gênero." },
    ];
  }

  if (component.includes("escrita criativa")) {
    return [
      { tipo: "oficina de criação", comando: `Planeje uma narrativa sobre ${theme}.\n${lettered(["Crie o nome do protagonista.", "Defina uma característica marcante.", "Descreva o cenário inicial.", "Apresente um conflito.", "Crie um objeto importante para a história.", "Escreva uma fala do protagonista.", "Apresente um obstáculo.", "Crie uma virada narrativa.", "Escreva uma frase de clímax.", "Planeje um desfecho coerente."])}`, resposta: "Planejamento narrativo com personagem, cenário, conflito, clímax e desfecho.", criterio: "Avaliar coerência, criatividade e desenvolvimento narrativo." },
      { tipo: "descrição expressiva", comando: `Complete as propostas de escrita criativa.\n${lettered(["Descreva o lugar usando visão.", "Descreva o lugar usando som.", "Descreva o lugar usando cheiro.", "Descreva uma emoção do personagem.", "Crie uma metáfora para o medo.", "Crie uma comparação para a alegria.", "Escreva uma frase de suspense.", "Escreva uma frase poética.", "Transforme uma frase simples em frase expressiva.", "Revise uma frase para deixá-la mais clara."])}`, resposta: "Produções autorais com recursos descritivos e revisão criativa.", criterio: "Observar riqueza vocabular, coerência sensorial e expressividade." },
    ];
  }

  if (component.includes("matematica")) {
    return [
      { tipo: "cálculo e procedimento", comando: `Resolva os itens e registre o procedimento.\n${lettered(["Calcule 1/2 + 1/4.", "Calcule 3/5 - 1/5.", "Calcule 2/3 de 18.", "Compare 4/8 e 1/2.", "Represente 0,25 em forma de fração.", "Simplifique 6/12.", "Calcule 1/3 + 1/6.", "Transforme 75% em fração.", "Calcule 2/5 de 30.", "Explique qual estratégia você usou em um dos itens."])}`, resposta: "a) 3/4; b) 2/5; c) 12; d) equivalentes; e) 1/4; f) 1/2; g) 1/2; h) 3/4; i) 12; j) explicação coerente.", criterio: "Avaliar cálculo, procedimento e justificativa." },
      { tipo: "problemas contextualizados", comando: `Resolva os problemas sobre ${theme}.\n${lettered(["Ana leu 1/4 de um livro de 80 páginas. Quantas páginas leu?", "Uma pizza foi dividida em 8 partes e João comeu 3. Que fração comeu?", "Em uma turma de 30 alunos, 2/5 praticam esportes. Quantos são?", "Compare 2/3 e 3/4 usando desenho ou cálculo.", "Uma receita usa 1/2 xícara de leite. Para dobrar a receita, quanto será usado?", "Pedro gastou 25% de 40 reais. Quanto gastou?", "Explique por que 5/10 equivale a 1/2.", "Crie um problema envolvendo 3/4.", "Resolva o problema criado por você.", "Escreva uma dica para evitar erro em frações."])}`, resposta: "a) 20; b) 3/8; c) 12; d) 3/4 maior; e) 1 xícara; f) 10 reais; g) equivalência por simplificação; h-i) respostas coerentes; j) dica pertinente.", criterio: "Avaliar interpretação, cálculo e criação de problema." },
    ];
  }

  if (component.includes("espanhola") || component.includes("espanhol")) {
    return [
      { tipo: "vocabulário e comunicação", comando: `Complete os itens em espanhol, considerando o tema ${theme}.\n${lettered(["Escreva uma saudação.", "Escreva uma despedida.", "Pergunte o nome de alguém.", "Responda como você se chama.", "Escreva uma frase com um verbo regular em -AR.", "Associe 'gracias' ao uso correto.", "Traduza uma frase simples para o português.", "Crie uma frase com vocabulário do tema.", "Escreva um pequeno diálogo de duas falas.", "Cite um país hispânico relacionado ao estudo cultural."])}`, resposta: "Aceitar respostas simples e corretas em espanhol, com tradução/uso contextual quando solicitado.", criterio: "Avaliar vocabulário, estrutura comunicativa e relação com o tema." },
      { tipo: "leitura e cultura", comando: `Leia: "La lengua española está presente en diferentes países y culturas, con palabras, acentos y costumbres variadas." Responda.\n${lettered(["Qual é a ideia principal do texto?", "Que palavra indica diversidade?", "Cite um elemento cultural mencionado.", "Explique o sentido de 'costumbres'.", "Escreva uma pergunta em espanhol sobre o texto.", "Responda à sua pergunta.", "Cite um país de língua espanhola.", "Escreva uma frase sobre esse país.", "Relacione língua e cultura.", "Produza uma síntese em português."])}`, resposta: "Respostas devem reconhecer diversidade linguística e cultural do mundo hispânico.", criterio: "Avaliar compreensão, vocabulário e respeito cultural." },
    ];
  }

  if (component.includes("religioso")) {
    return [
      { tipo: "leitura reflexiva", comando: `Responda aos itens sobre ${theme}, relacionando narrativa, valores e convivência.\n${lettered(["Quem ou o que está no centro do tema?", "Qual valor principal pode ser estudado?", "Que atitude positiva aparece no tema?", "Que dificuldade ou conflito pode ser analisado?", "Como esse tema se relaciona à convivência escolar?", "Que exemplo do cotidiano pode ser citado?", "Que atitude respeitosa seria adequada?", "Que palavra sintetiza a aprendizagem?", "Crie uma pergunta reflexiva sobre o tema.", "Responda à pergunta criada."])}`, resposta: "Respostas reflexivas, respeitosas e coerentes com o tema.", criterio: "Avaliar compreensão, respeito à diversidade e aplicação ética." },
      { tipo: "situações de convivência", comando: `Analise as situações e indique uma atitude adequada.\n${lettered(["Um colega é excluído de uma atividade.", "Dois alunos discordam sobre uma crença.", "Alguém precisa de ajuda para estudar.", "A turma presencia uma injustiça.", "Um aluno faz uma pergunta sobre sentido da vida.", "Um colega demonstra tristeza.", "Uma tradição religiosa diferente é apresentada.", "Há conflito durante trabalho em grupo.", "Alguém compartilha uma experiência pessoal.", "A turma precisa construir uma regra de respeito."])}`, resposta: "Atitudes de escuta, respeito, solidariedade, diálogo e responsabilidade.", criterio: "Avaliar ética, convivência e argumentação respeitosa." },
    ];
  }

  if (component.includes("ciencias") || component.includes("biologia") || component.includes("fisica") || component.includes("quimica")) {
    return [
      { tipo: "investigação científica", comando: `Analise os itens sobre ${theme}.\n${lettered(["Defina o conceito principal.", "Cite um exemplo do fenômeno.", "Indique uma possível causa.", "Indique uma consequência.", "Formule uma hipótese.", "Diga que dado ajudaria a testar a hipótese.", "Explique um processo relacionado.", "Relacione o tema ao cotidiano.", "Crie uma pergunta investigativa.", "Escreva uma conclusão curta."])}`, resposta: "Respostas científicas coerentes, com conceito, hipótese, evidência e conclusão.", criterio: "Avaliar precisão conceitual e raciocínio científico." },
    ];
  }

  if (component.includes("historia") || component.includes("geografia") || component.includes("filosofia") || component.includes("sociologia")) {
    return [
      { tipo: "análise contextual", comando: `Responda aos itens sobre ${theme}.\n${lettered(["Defina o conceito central.", "Localize o tema no tempo ou espaço, quando aplicável.", "Cite uma causa.", "Cite uma consequência.", "Relacione o tema à sociedade.", "Compare duas situações.", "Indique uma fonte ou exemplo que poderia ser analisado.", "Explique uma permanência ou mudança.", "Crie uma pergunta crítica.", "Escreva uma síntese."])}`, resposta: "Respostas contextualizadas com causa, consequência, comparação e síntese.", criterio: "Avaliar contextualização, argumentação e uso de exemplos." },
    ];
  }

  return [
    { tipo: "compreensão ampla", comando: `Responda aos itens sobre ${theme}.\n${lettered(["Defina o tema com suas palavras.", "Cite um exemplo.", "Explique uma ideia importante.", "Relacione com uma situação do cotidiano.", "Complete uma informação essencial.", "Classifique um elemento do tema.", "Compare dois aspectos.", "Justifique uma resposta.", "Crie uma pergunta desafiadora.", "Escreva uma síntese final."])}`, resposta: "Respostas coerentes com o tema, com exemplos e justificativas.", criterio: "Avaliar compreensão, aplicação e organização." },
  ];
}

function makeQuestion(template: ExerciseTemplate, numero: number, tipoMaterial: string): MaterialAIQuestion {
  const isObjective = normalize(tipoMaterial) === "prova" && numero % 3 === 0;
  if (isObjective) {
    return {
      numero,
      tipo: "objetiva",
      enunciado: `${template.comando}\n\nAssinale a alternativa que melhor representa a ideia central do exercício.`,
      alternativas: template.alternativas?.length
        ? template.alternativas
        : [
            `A) ${template.resposta.split(";")[0] || template.resposta}`,
            "B) Resposta parcialmente correta, mas sem justificar o conteúdo.",
            "C) Resposta que ignora o tema principal.",
            "D) Resposta que contradiz o comando apresentado.",
            "E) Resposta genérica, sem relação com os exemplos analisados.",
          ],
      respostaEsperada: `Alternativa A. ${template.resposta}`,
      criterioCorrecao: template.criterio,
    };
  }

  return {
    numero,
    tipo: template.tipo,
    enunciado: template.comando,
    alternativas: [],
    respostaEsperada: template.resposta,
    criterioCorrecao: template.criterio,
  };
}

function buildQuestions(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[]): MaterialAIQuestion[] {
  const quantity = clampQuestionCount(input.quantidadeQuestoes, normalize(input.tipo) === "prova" ? 10 : 10);
  const templates = buildExerciseTemplates(input, profile, conteudos);
  const questions: MaterialAIQuestion[] = [];

  for (let index = 0; index < quantity; index += 1) {
    const template = templates[index % templates.length];
    questions.push(makeQuestion(template, index + 1, input.tipo));
  }

  return questions;
}

function sectionsFor(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[], questions: MaterialAIQuestion[]): MaterialAISection[] {
  const theme = input.tema || "tema estudado";
  const type = normalize(input.tipo);
  const textBase = buildTextBase(input, profile, conteudos);
  const blocos = [
    `Bloco 1 — Aquecimento: leitura do tema, vocabulário essencial e exemplos iniciais.`,
    `Bloco 2 — Fixação guiada: questões com itens de a até j para ampliar repertório e prática.`,
    `Bloco 3 — Aplicação: exercícios mistos, reescrita, análise, cálculo, produção ou interpretação conforme a disciplina.`,
    `Bloco 4 — Desafio e síntese: produção final, justificativa e correção comentada.`,
  ];

  if (type === "apostila") {
    return [
      { titulo: "Explicação didática", conteudo: `${profile.abertura}\n\nConceitos trabalhados: ${conteudos.map(contentTitle).join(", ")}.`, itens: profile.vocabulario.slice(0, 10) },
      { titulo: "Exemplos orientados", conteudo: `Use exemplos próximos da realidade da turma para mostrar como ${theme} aparece em diferentes situações.`, itens: questions.slice(0, 5).map((q) => q.enunciado.split("\n")[0]) },
      { titulo: "Exercícios de fixação", conteudo: "Resolva os exercícios com atenção aos comandos e registre as respostas no caderno ou na folha impressa.", itens: questions.map((q) => `Questão ${q.numero}: ${q.tipo}`) },
    ];
  }

  if (type === "sequencia") {
    return [
      { titulo: "Aula 1 — Sondagem e contextualização", conteudo: `Apresente o tema ${theme}, levante conhecimentos prévios e explore exemplos iniciais.`, itens: ["Roda de conversa", "Registro no quadro", "Pergunta disparadora", "Vocabulário essencial"] },
      { titulo: "Aula 2 — Exercícios guiados", conteudo: "Aplique exercícios graduados com mediação do professor e correção parcial.", itens: blocos },
      { titulo: "Aula 3 — Produção, revisão e avaliação", conteudo: "Finalize com atividade de síntese, socialização e gabarito comentado.", itens: ["Produção individual ou em dupla", "Correção coletiva", "Autoavaliação", "Retomada dos erros frequentes"] },
    ];
  }

  if (type === "projeto") {
    return [
      { titulo: "Problema norteador", conteudo: `Como compreender e aplicar ${theme} em uma produção significativa para a turma?`, itens: ["Investigação", "Registro", "Produção", "Socialização"] },
      { titulo: "Etapas do projeto", conteudo: "Organização do trabalho em etapas curtas, com acompanhamento e produto final.", itens: ["Pesquisa inicial", "Produção orientada", "Revisão", "Apresentação"] },
      { titulo: "Produto final", conteudo: "Cartaz, texto, apresentação, painel, jogo, mapa conceitual ou material digital editável.", itens: ["Criatividade", "Clareza", "Coerência", "Participação"] },
    ];
  }

  if (type === "roteiro") {
    return [
      { titulo: "Antes do estudo", conteudo: `Leia o tema ${theme}, observe os conteúdos e marque dúvidas iniciais.`, itens: ["O que já sei?", "O que preciso aprender?", "Quais palavras são importantes?", "Onde posso aplicar esse conteúdo?"] },
      { titulo: "Durante o estudo", conteudo: "Resolva as questões, sublinhe comandos e registre justificativas.", itens: questions.slice(0, 8).map((q) => `Questão ${q.numero}: ${q.tipo}`) },
      { titulo: "Depois do estudo", conteudo: "Revise o gabarito, corrija respostas e escreva uma síntese do que aprendeu.", itens: ["Corrigir", "Reescrever", "Sintetizar", "Autoavaliar"] },
    ];
  }

  return [
    { titulo: "Texto-base ou situação inicial", conteudo: textBase, itens: [] },
    { titulo: "Percurso da atividade", conteudo: "O material foi construído como folha ampla de exercícios, com comandos variados e itens internos de a até j para ampliar prática, exemplos e possibilidades de resposta.", itens: blocos },
    { titulo: "Banco de palavras e conceitos", conteudo: "Use este banco como apoio durante a correção, adaptação, retomada ou ampliação da atividade.", itens: Array.from(new Set([...profile.vocabulario, ...conteudos.flatMap((line) => line.split(/[:,]/).map((x) => x.trim()).filter(Boolean)).slice(0, 10)])).slice(0, 16) },
  ];
}

function titleByType(input: MaterialAIInput): string {
  const map: Record<string, string> = {
    atividade: "Atividade completa",
    prova: "Prova",
    apostila: "Apostila",
    lista: "Lista de exercícios",
    revisao: "Revisão",
    sequencia: "Sequência didática",
    roteiro: "Roteiro de estudo",
    projeto: "Projeto pedagógico",
  };
  const label = map[normalize(input.tipo)] || "Material";
  return input.titulo || `${label} — ${input.tema}`;
}

export function buildHardPedagogicalMaterial(input: MaterialAIInput): MaterialAIOutput {
  const conteudos = splitConteudos(input.conteudos);
  const safeConteudos = conteudos.length ? conteudos : [input.tema || "tema estudado"];
  const profile = profileFor(input);
  const questions = buildQuestions(input, profile, safeConteudos);
  const sections = sectionsFor(input, profile, safeConteudos, questions);
  const type = normalize(input.tipo);

  return {
    titulo: titleByType(input),
    subtitulo: `${input.componenteCurricular} • ${input.anoSerie}`,
    tipo: input.tipo,
    resumo: `Material amplo em padrão de livro de atividades, com exemplos, itens internos de a até j, progressão didática, versão do aluno e gabarito do professor.`,
    dadosGerais: {
      escola: input.escola || "",
      professor: input.professor || "",
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento || "",
      componenteCurricular: input.componenteCurricular,
      tema: input.tema,
      duracao: input.duracao || "1 período",
    },
    objetivos: input.objetivos ? splitConteudos(input.objetivos) : profile.objetivos,
    conteudos: safeConteudos,
    orientacoesProfessor: [
      "Aplique a versão do aluno sem mostrar o gabarito.",
      "Explique os comandos e resolva um item-modelo antes da produção individual.",
      "Use a correção comentada para identificar dificuldades, comparar respostas e retomar conceitos.",
      "Valorize justificativas, estratégias e revisão, não apenas respostas finais.",
      "Adapte tempo, quantidade de itens ou apoio conforme o perfil da turma.",
    ],
    orientacoesAluno: [
      "Leia cada comando com atenção antes de responder.",
      "Observe todos os itens com letras e responda na ordem solicitada.",
      "Sublinhe palavras importantes do enunciado.",
      "Justifique respostas quando solicitado.",
      "Revise sua escrita, cálculo ou explicação antes de entregar.",
    ],
    introducao: profile.abertura,
    secoes: sections,
    questoes: questions,
    jogo: undefined,
    projeto: type === "projeto"
      ? {
          problemaNorteador: `Como transformar ${input.tema} em uma produção significativa para a turma?`,
          etapas: ["Pesquisa e levantamento de ideias", "Produção orientada", "Revisão com critérios", "Socialização do produto final"],
          produtoFinal: "Material, apresentação, painel, texto, jogo, mapa ou produção autoral relacionada ao tema.",
          avaliacao: "Avaliar participação, pesquisa, coerência do produto, clareza da apresentação e evolução do estudante.",
        }
      : undefined,
    roteiro: type === "roteiro"
      ? {
          antesDoEstudo: ["Ler o tema", "Registrar dúvidas", "Listar palavras-chave"],
          duranteOEstudo: ["Resolver exercícios", "Fazer anotações", "Comparar respostas"],
          depoisDoEstudo: ["Corrigir com gabarito", "Reescrever respostas frágeis", "Produzir síntese"],
          autoavaliacao: ["Entendi o tema?", "Consigo justificar minhas respostas?", "Que ponto preciso revisar?"],
        }
      : undefined,
    criteriosAvaliacao: profile.criterios,
    gabarito: questions.map((question) => `Questão ${question.numero}: ${question.respostaEsperada} Critério: ${question.criterioCorrecao}`),
    adaptacoesInclusivas: [
      "Reduzir a quantidade de itens sem reduzir o objetivo central quando necessário.",
      "Permitir leitura compartilhada dos comandos.",
      "Oferecer banco de palavras, exemplos ou tempo adicional para estudantes que precisarem.",
      "Transformar itens discursivos em resposta oral ou produção em dupla quando fizer sentido pedagógico.",
    ],
    sugestoesUso: [
      "Usar como atividade em sala, tarefa, revisão, recuperação ou avaliação formativa.",
      "Abrir no Editor para ajustar cabeçalho, espaço para resposta e quantidade de questões.",
      "Salvar uma versão do aluno e uma versão do professor com gabarito.",
    ],
    alertas: [
      "Material original gerado pelo Planify com estrutura didática inspirada em padrões pedagógicos, sem copiar exercícios de obras didáticas.",
    ],
  };
}

function enoughQuestions(output: Partial<MaterialAIOutput>, input: MaterialAIInput): boolean {
  const expected = normalize(input.tipo) === "prova" ? Math.min(clampQuestionCount(input.quantidadeQuestoes, 10), 10) : 8;
  return Array.isArray(output.questoes) && output.questoes.length >= expected;
}

function mergeArrays(primary: string[] | undefined, fallback: string[]): string[] {
  const values = [...(Array.isArray(primary) ? primary : []), ...fallback];
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

function hasRichLetteredItems(output: Partial<MaterialAIOutput>): boolean {
  const questions = Array.isArray(output.questoes) ? output.questoes : [];
  if (!questions.length) return false;
  const richCount = questions.filter((question) => /(^|\n)j\)/i.test(String(question.enunciado || ""))).length;
  return richCount >= Math.min(3, questions.length);
}

export function enhanceHardPedagogicalMaterial(input: MaterialAIInput, generated?: Partial<MaterialAIOutput>): MaterialAIOutput {
  const hard = buildHardPedagogicalMaterial(input);
  if (!generated || !enoughQuestions(generated, input) || !hasRichLetteredItems(generated)) return hard;

  return {
    ...hard,
    ...generated,
    dadosGerais: { ...hard.dadosGerais, ...(generated.dadosGerais || {}) },
    objetivos: mergeArrays(generated.objetivos, hard.objetivos).slice(0, 8),
    conteudos: mergeArrays(generated.conteudos, hard.conteudos),
    orientacoesProfessor: mergeArrays(generated.orientacoesProfessor, hard.orientacoesProfessor),
    orientacoesAluno: mergeArrays(generated.orientacoesAluno, hard.orientacoesAluno),
    secoes: Array.isArray(generated.secoes) && generated.secoes.length >= 2 ? generated.secoes : hard.secoes,
    questoes: Array.isArray(generated.questoes) && generated.questoes.length >= hard.questoes.length ? generated.questoes : hard.questoes,
    gabarito: Array.isArray(generated.gabarito) && generated.gabarito.length >= hard.gabarito.length ? generated.gabarito : hard.gabarito,
    criteriosAvaliacao: mergeArrays(generated.criteriosAvaliacao, hard.criteriosAvaliacao),
    adaptacoesInclusivas: mergeArrays(generated.adaptacoesInclusivas, hard.adaptacoesInclusivas),
    sugestoesUso: mergeArrays(generated.sugestoesUso, hard.sugestoesUso),
    alertas: mergeArrays(generated.alertas, hard.alertas),
    jogo: undefined,
  };
}
