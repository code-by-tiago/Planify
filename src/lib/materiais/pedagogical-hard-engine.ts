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

function displayTitle(value: unknown): string {
  const words = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (!words.length) return "tema estudado";

  const lowerWords = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "para", "por", "com"]);
  return words
    .map((word, index) => {
      const clean = word.toLocaleLowerCase("pt-BR");
      if (index > 0 && lowerWords.has(clean)) return clean;
      return clean.charAt(0).toLocaleUpperCase("pt-BR") + clean.slice(1);
    })
    .join(" ");
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
      abertura: `Este material trabalha ${tema} com leitura, interpretação, vocabulário, análise linguística, identificação, classificação, reescrita, justificativa e produção curta.`,
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


  if (component.includes("filosofia")) {
    const isDescartes = normalize(tema).includes("descartes");
    return {
      eixo: "Investigação filosófica, argumentação e produção autoral",
      abertura: isDescartes
        ? `Este material trabalha ${tema} a partir do contexto da Filosofia Moderna, da dúvida metódica, do cogito, do racionalismo, do método e do legado cartesiano para a ciência e para a ideia de sujeito.`
        : `Este material trabalha ${tema} por meio de problema filosófico, conceitos centrais, leitura orientada, debate, argumentação, produção autoral e socialização das ideias.`,
      objetivos: [
        "Compreender o problema filosófico central do tema.",
        "Analisar conceitos, argumentos e exemplos ligados ao pensamento estudado.",
        "Produzir síntese, debate, apresentação ou produto autoral com clareza conceitual.",
      ],
      comandos: ["problema", "conceito", "argumento", "contexto", "debate", "síntese", "comparação", "produção"],
      vocabulario: isDescartes
        ? ["Descartes", "dúvida metódica", "cogito", "razão", "racionalismo", "método", "certeza", "sujeito", "ciência", "filosofia moderna"]
        : ["problema", "conceito", "argumento", "pensamento", "contexto", "debate", "ética", "conhecimento", "razão", "síntese"],
      criterios: ["clareza conceitual", "argumentação", "relação com o tema", "organização da produção", "participação"],
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


  if (component.includes("filosofia")) {
    return [
      { tipo: "investigação filosófica", comando: `Responda aos itens sobre ${theme}.\n${lettered(["Qual é o problema filosófico central?", "Que conceito precisa ser compreendido primeiro?", "Que pergunta pode orientar a investigação?", "Que argumento pode ser apresentado?", "Que exemplo ajuda a entender o tema?", "Que crítica ou dúvida pode ser levantada?", "Que relação existe com a vida atual?", "Que ideia pode ser debatida em grupo?", "Que síntese pode ser produzida?", "Que produto final comunicaria bem a aprendizagem?"])}`, resposta: "Respostas coerentes com o problema filosófico, conceitos, argumentos, exemplos e síntese do tema.", criterio: "Avaliar clareza conceitual, argumentação, relação com o tema e capacidade de síntese." },
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
  const type = normalize(input.tipo);

  if (type === "projeto" || type === "sequencia" || type === "roteiro") {
    return [];
  }

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
    `Bloco 2 — Fixação guiada: questões com vários exemplos e situações para ampliar repertório e prática.`,
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
    const temaFormatado = displayTitle(theme);
    return [
      {
        titulo: "Apresentação do projeto",
        conteudo: `Projeto escolar sobre ${temaFormatado}, organizado para transformar o tema em investigação, produção autoral, socialização e avaliação. A proposta parte de uma questão norteadora, orienta a pesquisa dos estudantes e conduz a turma a produzir um resultado final compartilhável.`,
        itens: [
          "Tema central do projeto",
          "Justificativa pedagógica",
          "Questão norteadora",
          "Produto final",
          "Avaliação processual",
        ],
      },
      {
        titulo: "Problema norteador",
        conteudo: `De que maneira o estudo de ${temaFormatado} ajuda a compreender ideias, problemas, escolhas, contextos ou práticas presentes na vida social, cultural, científica ou escolar dos estudantes?`,
        itens: [
          "O que já sabemos sobre o tema?",
          "Que perguntas queremos investigar?",
          "Que fontes podem ajudar a turma?",
          "Que produto final pode comunicar a aprendizagem?",
        ],
      },
      {
        titulo: "Objetivos do projeto",
        conteudo: "Objetivos organizados para orientar o trabalho do professor e dos estudantes durante todas as etapas.",
        itens: [
          `Compreender aspectos centrais de ${temaFormatado}.`,
          "Investigar informações, exemplos, conceitos e situações ligados ao tema.",
          "Organizar descobertas em registros, debates, esquemas ou produções autorais.",
          "Produzir um resultado final claro, criativo e coerente com a proposta.",
          "Apresentar e avaliar o percurso de aprendizagem da turma.",
        ],
      },
      {
        titulo: "Etapa 1 — Mobilização da turma",
        conteudo: `Inicie com uma conversa orientada sobre ${temaFormatado}. Levante conhecimentos prévios, registre hipóteses, apresente imagens, frases, pequenos textos, problemas ou perguntas disparadoras relacionados ao tema.`,
        itens: [
          "Pergunta disparadora no quadro",
          "Registro das hipóteses dos estudantes",
          "Leitura ou breve apresentação inicial",
          "Organização dos grupos ou duplas",
        ],
      },
      {
        titulo: "Etapa 2 — Pesquisa e investigação",
        conteudo: "Oriente a turma a buscar informações, exemplos, conceitos, fatos, argumentos ou referências adequadas ao ano/série. O professor acompanha a seleção das informações e ajuda a transformar pesquisa em aprendizagem organizada.",
        itens: [
          "Pesquisa guiada com roteiro",
          "Anotações individuais ou em grupo",
          "Seleção de ideias principais",
          "Organização de fontes e exemplos",
          "Discussão intermediária com mediação do professor",
        ],
      },
      {
        titulo: "Etapa 3 — Produção do material final",
        conteudo: "Cada grupo transforma a investigação em uma produção concreta para apresentar à turma. A produção precisa demonstrar compreensão do tema, clareza nas informações e autoria dos estudantes.",
        itens: [
          "Painel explicativo",
          "Seminário curto",
          "Cartaz ou infográfico",
          "Mapa conceitual",
          "Podcast, vídeo curto ou apresentação digital",
          "Texto autoral, roteiro, maquete, exposição ou jogo educativo",
        ],
      },
      {
        titulo: "Etapa 4 — Socialização",
        conteudo: "Organize uma rodada de apresentações. Cada grupo explica o que pesquisou, mostra o produto final e responde perguntas dos colegas. O professor registra avanços, dúvidas e pontos para retomada.",
        itens: [
          "Apresentação de 3 a 5 minutos por grupo",
          "Perguntas dos colegas",
          "Registro das principais aprendizagens",
          "Síntese coletiva final",
        ],
      },
      {
        titulo: "Etapa 5 — Avaliação e fechamento",
        conteudo: "Finalize com avaliação do processo, autoavaliação dos estudantes e devolutiva do professor. A avaliação deve considerar pesquisa, participação, clareza, coerência e qualidade do produto final.",
        itens: [
          "Participação durante as etapas",
          "Qualidade da pesquisa",
          "Organização das ideias",
          "Clareza do produto final",
          "Apresentação oral ou escrita",
          "Autoavaliação e revisão",
        ],
      },
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
    { titulo: "Percurso da atividade", conteudo: "O material organiza leitura, exemplos, prática orientada, aplicação e síntese para ampliar a aprendizagem do tema.", itens: blocos },
    { titulo: "Banco de palavras e conceitos", conteudo: "Use este banco como apoio durante a correção, adaptação, retomada ou ampliação da atividade.", itens: Array.from(new Set([...profile.vocabulario, ...conteudos.flatMap((line) => line.split(/[:,]/).map((x) => x.trim()).filter(Boolean)).slice(0, 10)])).slice(0, 16) },
  ];
}

function titleByType(input: MaterialAIInput): string {
  const map: Record<string, string> = {
    atividade: "Atividade",
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

function summaryByType(input: MaterialAIInput): string {
  const tema = displayTitle(input.tema || "tema estudado");
  const type = normalize(input.tipo);

  if (type === "projeto") {
    return `Projeto pronto para desenvolver ${tema} com investigação, produção, socialização, produto final e avaliação.`;
  }

  if (type === "sequencia") {
    return `Sequência didática pronta para trabalhar ${tema} em etapas de aula, com mediação, prática e avaliação.`;
  }

  if (type === "roteiro") {
    return `Roteiro de estudo organizado para orientar o estudante no estudo de ${tema}, com leitura, registro, tarefas e autoavaliação.`;
  }

  if (type === "apostila") {
    return `Apostila pronta para estudar ${tema}, com explicação, exemplos, exercícios e síntese.`;
  }

  if (type === "prova") {
    return `Avaliação pronta sobre ${tema}, com questões variadas, critérios e gabarito do professor.`;
  }

  if (type === "lista") {
    return `Lista de exercícios pronta sobre ${tema}, com prática progressiva e correção orientada.`;
  }

  if (type === "revisao") {
    return `Revisão pronta sobre ${tema}, com retomada, exercícios e fechamento da aprendizagem.`;
  }

  return `Atividade sobre ${tema}, com prática orientada, exercícios e gabarito do professor.`;
}

function projectTeacherGuidance(theme: string): string[] {
  const temaFormatado = displayTitle(theme);
  return [
    `Apresente o projeto sobre ${temaFormatado} e combine o produto final com a turma.`,
    "Organize grupos, papéis e prazos antes da pesquisa.",
    "Acompanhe os registros durante o processo, não apenas a apresentação final.",
    "Oriente a seleção de informações confiáveis e a transformação das ideias em produção autoral.",
    "Finalize com socialização, devolutiva e autoavaliação.",
  ];
}

function projectStudentGuidance(theme: string): string[] {
  const temaFormatado = displayTitle(theme);
  return [
    `Investigue o tema ${temaFormatado} com atenção às perguntas do projeto.`,
    "Registre as descobertas mais importantes com suas próprias palavras.",
    "Participe da produção do material final do grupo.",
    "Prepare sua apresentação com clareza e respeito ao tempo combinado.",
    "Revise o trabalho antes da socialização.",
  ];
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
    resumo: summaryByType(input),
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
    orientacoesProfessor: type === "projeto" ? projectTeacherGuidance(input.tema || "tema estudado") : [
      "Aplique a versão do aluno sem mostrar o gabarito.",
      "Explique os comandos e resolva um item-modelo antes da produção individual.",
      "Use a correção comentada para identificar dificuldades, comparar respostas e retomar conceitos.",
      "Valorize justificativas, estratégias e revisão, não apenas respostas finais.",
      "Adapte tempo, quantidade de itens ou apoio conforme o perfil da turma.",
    ],
    orientacoesAluno: type === "projeto" ? projectStudentGuidance(input.tema || "tema estudado") : [
      "Leia cada comando com atenção antes de responder.",
      "Responda todos os itens solicitados no enunciado.",
      "Sublinhe palavras importantes do comando.",
      "Justifique respostas quando solicitado.",
      "Revise sua escrita, cálculo ou explicação antes de entregar.",
    ],
    introducao: profile.abertura,
    secoes: sections,
    questoes: questions,
    jogo: undefined,
    projeto: type === "projeto"
      ? {
          problemaNorteador: `De que maneira o estudo de ${displayTitle(input.tema || "tema estudado")} pode ser investigado, produzido e apresentado pela turma de forma significativa?`,
          etapas: [
            "Mobilização e levantamento de conhecimentos prévios",
            "Pesquisa orientada e registro das descobertas",
            "Planejamento do produto final",
            "Produção em grupo ou individual",
            "Apresentação e socialização",
            "Avaliação, autoavaliação e fechamento",
          ],
          produtoFinal: "Apresentação, painel, texto autoral, infográfico, seminário, exposição, vídeo curto, mapa conceitual, jogo educativo ou material digital sobre o tema.",
          avaliacao: "Avaliar participação, pesquisa, organização das ideias, coerência do produto, clareza da apresentação, colaboração e evolução do estudante.",
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
    criteriosAvaliacao: type === "projeto"
      ? ["participação", "pesquisa", "organização das ideias", "qualidade do produto final", "clareza da apresentação", "colaboração", "autoavaliação"]
      : profile.criterios,
    gabarito: type === "projeto" || type === "sequencia" || type === "roteiro" ? [] : questions.map((question) => `Questão ${question.numero}: ${question.respostaEsperada} Critério: ${question.criterioCorrecao}`),
    adaptacoesInclusivas: [
      "Reduzir a quantidade de itens sem reduzir o objetivo central quando necessário.",
      "Permitir leitura compartilhada dos comandos.",
      "Oferecer banco de palavras, exemplos ou tempo adicional para estudantes que precisarem.",
      "Transformar itens discursivos em resposta oral ou produção em dupla quando fizer sentido pedagógico.",
    ],
    sugestoesUso: type === "projeto"
      ? [
          "Usar como projeto bimestral, sequência de aulas, trabalho em grupo ou culminância temática.",
          "Adaptar o produto final ao tempo disponível e aos recursos da escola.",
          "Registrar evidências do processo durante todas as etapas.",
        ]
      : [
          "Usar em sala, tarefa, revisão, recuperação ou avaliação formativa.",
          "Abrir no Editor para ajustar cabeçalho, espaço de resposta e apresentação final.",
          "Salvar uma versão do aluno e uma versão do professor com gabarito.",
        ],
    alertas: [],
  };
}

function textSize(output: Partial<MaterialAIOutput>): number {
  return [
    output.titulo,
    output.subtitulo,
    output.resumo,
    output.introducao,
    ...(Array.isArray(output.objetivos) ? output.objetivos : []),
    ...(Array.isArray(output.conteudos) ? output.conteudos : []),
    ...(Array.isArray(output.orientacoesProfessor) ? output.orientacoesProfessor : []),
    ...(Array.isArray(output.orientacoesAluno) ? output.orientacoesAluno : []),
    ...(Array.isArray(output.secoes) ? output.secoes.flatMap((section) => [section.titulo, section.conteudo, ...(section.itens || [])]) : []),
    ...(Array.isArray(output.questoes) ? output.questoes.flatMap((question) => [question.enunciado, ...(question.alternativas || []), question.respostaEsperada, question.criterioCorrecao]) : []),
    ...(Array.isArray(output.gabarito) ? output.gabarito : []),
  ].join("\n").trim().length;
}

function expectedQuestionCount(input: MaterialAIInput): number {
  const type = normalize(input.tipo);
  if (type === "prova") return Math.min(clampQuestionCount(input.quantidadeQuestoes, 10), 12);
  if (["atividade", "lista", "revisao"].includes(type)) return Math.min(clampQuestionCount(input.quantidadeQuestoes, 10), 10);
  if (type === "apostila") return 3;
  return 0;
}

function enoughQuestions(output: Partial<MaterialAIOutput>, input: MaterialAIInput): boolean {
  const expected = expectedQuestionCount(input);
  if (!expected) return true;
  return Array.isArray(output.questoes) && output.questoes.length >= expected;
}

function mergeArrays(primary: string[] | undefined, fallback: string[]): string[] {
  const values = [...(Array.isArray(primary) ? primary : []), ...fallback];
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

function hasDetailedQuestions(output: Partial<MaterialAIOutput>, input: MaterialAIInput): boolean {
  const type = normalize(input.tipo);
  if (!["atividade", "prova", "lista", "revisao", "apostila"].includes(type)) return true;

  const questions = Array.isArray(output.questoes) ? output.questoes : [];
  if (!questions.length) return type === "apostila";

  const detailedCount = questions.filter((question) => {
    const enunciado = String(question.enunciado || "");
    const alternativas = Array.isArray(question.alternativas) ? question.alternativas : [];
    return enunciado.length >= 120 || /\n|a\)|b\)|c\)/i.test(enunciado) || alternativas.length >= 4;
  }).length;

  if (type === "prova") {
    const hasObjective = questions.some((question) => Array.isArray(question.alternativas) && question.alternativas.length >= 4);
    return hasObjective && detailedCount >= Math.min(4, questions.length);
  }

  if (type === "apostila") return true;

  return detailedCount >= Math.min(5, questions.length);
}

function hasStrongSections(output: Partial<MaterialAIOutput>, input: MaterialAIInput): boolean {
  const type = normalize(input.tipo);
  const sections = Array.isArray(output.secoes) ? output.secoes : [];
  const count = sections.length;
  const size = textSize(output);
  const joined = normalize(sections.map((section) => `${section.titulo} ${section.conteudo} ${(section.itens || []).join(" ")}`).join(" "));

  if (type === "apostila") {
    return count >= 5 && size >= 2200 && /(capitulo|unidade|explicacao|conceito|glossario|sintese|curiosidade|exemplo|fixacao)/.test(joined);
  }

  if (type === "sequencia") {
    return count >= 3 && /(aula|momento|desenvolvimento|fechamento|avaliacao)/.test(joined);
  }

  if (type === "projeto") {
    return Boolean(output.projeto) || (count >= 5 && /(problema norteador|justificativa|produto final|socializacao|avaliacao|cronograma)/.test(joined));
  }

  if (type === "roteiro") {
    return Boolean(output.roteiro) || (count >= 3 && /(antes do estudo|durante o estudo|depois do estudo|autoavaliacao)/.test(joined));
  }

  return count >= 2 && size >= 1600;
}

function shouldPreferGenerated(input: MaterialAIInput, generated?: Partial<MaterialAIOutput>): boolean {
  if (!generated) return false;
  const type = normalize(input.tipo);

  if (["projeto", "sequencia", "roteiro"].includes(type)) {
    return hasStrongSections(generated, input) && textSize(generated) >= 1500;
  }

  if (type === "apostila") {
    return hasStrongSections(generated, input) && (Array.isArray(generated.questoes) ? generated.questoes.length >= 3 : true);
  }

  return enoughQuestions(generated, input) && hasDetailedQuestions(generated, input) && textSize(generated) >= 2200;
}

function cleanSpecificBlocks(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  const type = normalize(input.tipo);
  return {
    ...output,
    tipo: type,
    jogo: undefined,
    projeto: type === "projeto" ? output.projeto : undefined,
    roteiro: type === "roteiro" ? output.roteiro : undefined,
    questoes: ["projeto", "sequencia", "roteiro"].includes(type) ? [] : output.questoes,
    gabarito: ["projeto", "sequencia", "roteiro"].includes(type) ? [] : output.gabarito,
    alertas: [],
  };
}

export function enhanceHardPedagogicalMaterial(input: MaterialAIInput, generated?: Partial<MaterialAIOutput>): MaterialAIOutput {
  const hard = buildHardPedagogicalMaterial(input);

  if (!shouldPreferGenerated(input, generated)) {
    return cleanSpecificBlocks(input, hard);
  }

  const type = normalize(input.tipo);
  const generatedSections = Array.isArray(generated?.secoes) ? generated.secoes : [];
  const generatedQuestions = Array.isArray(generated?.questoes) ? generated.questoes : [];
  const generatedGabarito = Array.isArray(generated?.gabarito) ? generated.gabarito : [];

  const merged: MaterialAIOutput = {
    ...hard,
    ...(generated as MaterialAIOutput),
    tipo: type,
    dadosGerais: { ...hard.dadosGerais, ...(generated?.dadosGerais || {}) },
    objetivos: mergeArrays(generated?.objetivos, hard.objetivos).slice(0, 10),
    conteudos: mergeArrays(generated?.conteudos, hard.conteudos),
    orientacoesProfessor: mergeArrays(generated?.orientacoesProfessor, hard.orientacoesProfessor).slice(0, 12),
    orientacoesAluno: mergeArrays(generated?.orientacoesAluno, hard.orientacoesAluno).slice(0, 10),
    introducao: String(generated?.introducao || hard.introducao),
    secoes: generatedSections.length ? generatedSections : hard.secoes,
    questoes: generatedQuestions.length || type === "apostila" ? generatedQuestions : hard.questoes,
    gabarito: generatedGabarito.length || type === "apostila" ? generatedGabarito : hard.gabarito,
    criteriosAvaliacao: mergeArrays(generated?.criteriosAvaliacao, hard.criteriosAvaliacao).slice(0, 12),
    adaptacoesInclusivas: mergeArrays(generated?.adaptacoesInclusivas, hard.adaptacoesInclusivas).slice(0, 8),
    sugestoesUso: mergeArrays(generated?.sugestoesUso, hard.sugestoesUso).slice(0, 8),
    alertas: [],
    jogo: undefined,
    projeto: type === "projeto" ? generated?.projeto || hard.projeto : undefined,
    roteiro: type === "roteiro" ? generated?.roteiro || hard.roteiro : undefined,
  };

  return cleanSpecificBlocks(input, merged);
}
