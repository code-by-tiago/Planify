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
  return Math.max(4, Math.min(parsed, 20));
}

function isHardType(type: string): boolean {
  const t = normalize(type);
  return ["atividade", "prova", "lista", "revisao", "apostila", "sequencia", "roteiro", "projeto"].includes(t);
}

export function shouldUseHardPedagogicalEngine(type: string): boolean {
  return isHardType(type);
}

function profileFor(input: MaterialAIInput): DisciplineProfile {
  const component = normalize(input.componenteCurricular);
  const tema = input.tema || "tema estudado";

  if (component.includes("redacao") || component.includes("redação")) {
    return {
      eixo: "Produção textual e argumentação",
      abertura: `Este material trabalha ${tema} com foco em planejamento, tese, argumentos, repertório, coesão, coerência, reescrita e melhoria progressiva do texto.`,
      objetivos: [
        "Planejar textos com tese, argumentos e conclusão coerentes.",
        "Usar repertório sociocultural de forma pertinente ao tema.",
        "Revisar parágrafos, conectivos, coesão e proposta de intervenção quando aplicável.",
      ],
      comandos: ["tese", "argumento", "repertório", "coesão", "reescrita", "intervenção", "parágrafo", "conclusão"],
      vocabulario: ["tese", "argumento", "repertório", "coesão", "coerência", "parágrafo", "intervenção", "conclusão"],
      criterios: ["clareza da tese", "pertinência dos argumentos", "organização dos parágrafos", "uso de conectivos", "adequação à proposta"],
    };
  }

  if (component.includes("escrita criativa")) {
    return {
      eixo: "Autoria, narrativa e criação literária",
      abertura: `Este material trabalha ${tema} com foco em autoria, imaginação, personagem, cenário, conflito, narrador, diálogo, clímax, desfecho e revisão criativa.`,
      objetivos: [
        "Criar narrativas com personagem, cenário, conflito e desfecho.",
        "Experimentar foco narrativo, diálogo e descrição expressiva.",
        "Revisar o texto criativo considerando clareza, ritmo e originalidade.",
      ],
      comandos: ["personagem", "cenário", "conflito", "narrador", "diálogo", "clímax", "desfecho", "descrição"],
      vocabulario: ["personagem", "cenário", "conflito", "narrador", "diálogo", "clímax", "desfecho", "descrição"],
      criterios: ["criatividade", "coerência narrativa", "construção de personagens", "uso de detalhes", "revisão do texto"],
    };
  }

  if (component.includes("portuguesa")) {
    return {
      eixo: "Leitura, análise linguística e produção textual",
      abertura: `Este material trabalha ${tema} com exercícios de leitura, interpretação, vocabulário, análise linguística, classificação, reescrita e justificativa, em padrão semelhante a livros de atividades.`,
      objetivos: [
        "Compreender sentidos explícitos e implícitos em textos e enunciados.",
        "Analisar recursos linguísticos, pontuação, classes ou funções conforme o conteúdo.",
        "Reescrever e justificar respostas com base no contexto.",
      ],
      comandos: ["lacuna", "classificação", "reescrita", "justificativa", "interpretação", "vocabulário", "pontuação", "análise"],
      vocabulario: ["texto", "contexto", "sentido", "termo", "frase", "pontuação", "classe", "função"],
      criterios: ["compreensão do comando", "uso de evidências", "adequação linguística", "justificativa"],
    };
  }

  if (component.includes("espanhola") || component.includes("espanhol")) {
    return {
      eixo: "Comunicação, vocabulário e cultura hispânica",
      abertura: `Este material trabalha ${tema} com vocabulário contextual, leitura curta, diálogos, tradução contextual, cultura hispânica e produção de frases em espanhol.`,
      objetivos: [
        "Usar vocabulário espanhol em contextos comunicativos.",
        "Interpretar frases e pequenos textos relacionados ao tema.",
        "Produzir respostas curtas, diálogos ou cartões em espanhol.",
      ],
      comandos: ["vocabulário", "diálogo", "tradução", "frase", "interpretação", "cultura", "associação", "produção"],
      vocabulario: ["palabra", "frase", "diálogo", "saludo", "cultura", "país", "lectura", "respuesta"],
      criterios: ["vocabulário correto", "compreensão contextual", "uso comunicativo", "pronúncia ou leitura"],
    };
  }

  if (component.includes("matematica")) {
    return {
      eixo: "Raciocínio, procedimentos e resolução de problemas",
      abertura: `Este material trabalha ${tema} com exercícios graduados, cálculo, interpretação de problemas, representação, justificativa e desafio final.`,
      objetivos: [
        "Resolver exercícios com procedimentos adequados.",
        "Interpretar situações-problema e justificar estratégias.",
        "Conferir resultados e aplicar o conteúdo em desafios contextualizados.",
      ],
      comandos: ["calcule", "resolva", "complete", "compare", "explique", "problema", "tabela", "desafio"],
      vocabulario: ["cálculo", "resultado", "estratégia", "problema", "tabela", "operação", "unidade", "padrão"],
      criterios: ["procedimento correto", "organização dos cálculos", "interpretação", "resultado"],
    };
  }

  if (component.includes("religioso")) {
    return {
      eixo: "Leitura reflexiva, valores e convivência",
      abertura: `Este material trabalha ${tema} com leitura reflexiva, análise de valores, interpretação de narrativa, convivência, ética e aplicação no cotidiano escolar.`,
      objetivos: [
        "Relacionar narrativas, valores e atitudes do cotidiano.",
        "Interpretar situações com respeito à diversidade de crenças e visões de mundo.",
        "Produzir respostas reflexivas com justificativa clara.",
      ],
      comandos: ["interpretação", "valor", "reflexão", "situação", "justificativa", "convivência", "atitude", "síntese"],
      vocabulario: ["respeito", "convivência", "valor", "ética", "narrativa", "reflexão", "atitude", "diálogo"],
      criterios: ["respeito", "argumentação", "relação com o tema", "clareza da reflexão"],
    };
  }

  if (component.includes("historia") || component.includes("geografia") || component.includes("filosofia") || component.includes("sociologia")) {
    return {
      eixo: "Análise social, temporal, espacial e cidadã",
      abertura: `Este material trabalha ${tema} com leitura de contexto, análise de fontes/situações, comparação, argumentação e aplicação social do conhecimento.`,
      objetivos: [
        "Analisar fatos, conceitos ou situações do tema.",
        "Relacionar o conteúdo ao contexto social, histórico ou geográfico.",
        "Argumentar com base em evidências e exemplos.",
      ],
      comandos: ["analise", "compare", "relacione", "explique", "fonte", "contexto", "argumente", "síntese"],
      vocabulario: ["tempo", "espaço", "sociedade", "cultura", "fonte", "cidadania", "território", "processo"],
      criterios: ["contextualização", "uso de evidências", "argumentação", "clareza"],
    };
  }

  if (component.includes("ciencias") || component.includes("biologia") || component.includes("fisica") || component.includes("quimica")) {
    return {
      eixo: "Investigação, explicação científica e aplicação",
      abertura: `Este material trabalha ${tema} com observação, conceitos científicos, análise de situações, interpretação de dados e aplicação em problemas.`,
      objetivos: [
        "Identificar conceitos científicos centrais.",
        "Interpretar situações, dados ou fenômenos relacionados ao tema.",
        "Explicar relações de causa, efeito, processo ou evidência.",
      ],
      comandos: ["observe", "explique", "classifique", "relacione", "hipótese", "dados", "experimento", "conclusão"],
      vocabulario: ["fenômeno", "processo", "evidência", "dados", "hipótese", "experimento", "resultado", "ambiente"],
      criterios: ["conceito correto", "explicação científica", "uso de dados", "conclusão"],
    };
  }

  return {
    eixo: "Compreensão, aplicação e síntese",
    abertura: `Este material trabalha ${tema} com exercícios graduados, revisão, aplicação e produção final.`,
    objetivos: [
      "Compreender conceitos essenciais do tema.",
      "Aplicar conhecimentos em exercícios e situações-problema.",
      "Registrar sínteses e justificar respostas.",
    ],
    comandos: ["complete", "relacione", "explique", "interprete", "classifique", "justifique", "aplique", "desafio"],
    vocabulario: ["conceito", "exemplo", "aplicação", "síntese", "desafio", "registro", "resposta", "revisão"],
    criterios: ["compreensão", "clareza", "aplicação", "organização"],
  };
}

function buildTextBase(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[]): string {
  const theme = input.tema || "tema estudado";
  const sample = conteudos.slice(0, 3).map(contentTitle).join(", ");
  return [
    `Leia o texto-base e resolva os exercícios.`,
    `O tema ${theme} pode ser estudado por meio de ${sample || "conceitos, exemplos e situações de aprendizagem"}.`,
    profile.abertura,
    `Durante a atividade, observe os comandos, organize suas respostas e justifique quando solicitado.`,
  ].join("\n\n");
}

function buildExerciseTemplates(input: MaterialAIInput, profile: DisciplineProfile, conteudos: string[]): ExerciseTemplate[] {
  const theme = input.tema || "tema estudado";
  const c = conteudos.length ? conteudos.map(contentTitle) : [theme];
  const component = normalize(input.componenteCurricular);

  if (component.includes("redacao") || component.includes("redação")) {
    return [
      { tipo: "planejamento textual", comando: `Defina uma tese clara para o tema "${theme}" em uma frase.`, resposta: "Tese objetiva, defensável e relacionada ao tema.", criterio: "Verificar se há ponto de vista claro e adequado ao recorte temático." },
      { tipo: "argumentação", comando: `Escreva dois argumentos diferentes que poderiam sustentar essa tese.`, resposta: "Dois argumentos coerentes, não repetidos e conectados à tese.", criterio: "Avaliar pertinência, variedade e relação com a tese." },
      { tipo: "repertório", comando: `Indique um repertório sociocultural que poderia enriquecer a discussão sobre ${theme} e explique seu uso.`, resposta: "Repertório pertinente, explicado e articulado ao argumento.", criterio: "Considerar pertinência e explicação, evitando citação solta." },
      { tipo: "coesão", comando: "Reescreva o período usando um conectivo de conclusão: 'O problema exige reflexão. A escola pode contribuir para o debate.'", resposta: "Ex.: O problema exige reflexão; portanto, a escola pode contribuir para o debate.", criterio: "Observar uso adequado do conectivo e manutenção do sentido." },
      { tipo: "parágrafo", comando: `Produza um parágrafo de desenvolvimento sobre ${c[0]}, com tópico frasal, explicação e exemplo.`, resposta: "Parágrafo organizado com ideia central, desenvolvimento e exemplo.", criterio: "Avaliar estrutura, coerência, repertório e progressão textual." },
      { tipo: "revisão", comando: "Revise a frase: 'As pessoas precisa entender melhor esse assunto porque ele é importante para todos.'", resposta: "As pessoas precisam entender melhor esse assunto porque ele é importante para todos.", criterio: "Corrigir concordância verbal e manter o sentido." },
    ];
  }

  if (component.includes("escrita criativa")) {
    return [
      { tipo: "personagem", comando: `Crie uma personagem ligada ao tema "${theme}" e descreva uma característica física e uma emocional.`, resposta: "Personagem com traço físico e emocional coerente.", criterio: "Avaliar clareza, criatividade e coerência com o tema." },
      { tipo: "cenário", comando: `Descreva o cenário onde a história acontece usando pelo menos três detalhes sensoriais.`, resposta: "Descrição com visão, som, cheiro, textura ou sensação.", criterio: "Observar riqueza descritiva e ambientação." },
      { tipo: "conflito", comando: `Apresente um conflito que mova a narrativa e envolva ${c[0]}.`, resposta: "Conflito claro, com problema ou desejo que impulsione a história.", criterio: "Avaliar se o conflito cria interesse narrativo." },
      { tipo: "diálogo", comando: "Escreva um diálogo curto entre duas personagens, usando travessão e fala natural.", resposta: "Diálogo com marcação adequada e relação com o conflito.", criterio: "Observar pontuação, clareza e voz das personagens." },
      { tipo: "continuação", comando: `Continue a história em cinco linhas, conduzindo a narrativa para um clímax.`, resposta: "Continuação com progressão, tensão e coerência.", criterio: "Avaliar criatividade, coesão e desenvolvimento." },
      { tipo: "desfecho", comando: "Crie um desfecho surpreendente, mas coerente, para a narrativa.", resposta: "Desfecho que resolve ou ressignifica o conflito.", criterio: "Observar coerência, efeito final e originalidade." },
    ];
  }

  if (component.includes("portuguesa") && normalize(theme).includes("sujeito")) {
    return [
      { tipo: "identificação", comando: "Leia as orações e sublinhe o sujeito de cada uma: a) Os estudantes revisaram a lição. b) Chegaram cedo ao teatro. c) Há muitas dúvidas na turma.", resposta: "a) Os estudantes. b) Sujeito oculto/desinencial: eles/elas, conforme o contexto. c) Oração sem sujeito, com verbo haver no sentido de existir.", criterio: "Verificar identificação do sujeito e reconhecimento de oração sem sujeito." },
      { tipo: "classificação", comando: "Classifique o sujeito nas frases: a) A menina e o irmão chegaram. b) Choveu durante a noite. c) Precisa-se de voluntários. d) O professor explicou o conteúdo.", resposta: "a) Sujeito composto. b) Oração sem sujeito. c) Sujeito indeterminado. d) Sujeito simples.", criterio: "Avaliar classificação correta e justificativa gramatical." },
      { tipo: "núcleo", comando: "Identifique o núcleo do sujeito: a) Aqueles livros antigos estavam na estante. b) Minha colega de sala venceu o concurso. c) As crianças do bairro brincavam na praça.", resposta: "a) livros. b) colega. c) crianças.", criterio: "Considerar a identificação do termo principal do sujeito." },
      { tipo: "reescrita", comando: "Reescreva a oração 'Vendemos todos os ingressos' transformando o sujeito oculto em sujeito simples explícito.", resposta: "Ex.: Nós vendemos todos os ingressos.", criterio: "Verificar explicitação adequada do sujeito sem alterar o sentido." },
      { tipo: "justificativa", comando: "Explique por que a oração 'Faz três anos que moro aqui' é considerada oração sem sujeito.", resposta: "Porque o verbo fazer indica tempo decorrido e, nesse uso, é impessoal, não apresentando sujeito.", criterio: "Avaliar uso do conceito de verbo impessoal e clareza da explicação." },
      { tipo: "aplicação", comando: "Crie uma frase com sujeito simples, uma com sujeito composto, uma com sujeito indeterminado e uma oração sem sujeito.", resposta: "Quatro frases coerentes, cada uma representando corretamente o tipo solicitado.", criterio: "Verificar produção própria e adequação dos tipos de sujeito." },
      { tipo: "análise mista", comando: "Analise as frases e indique sujeito, núcleo e classificação: a) Os alunos atentos resolveram a atividade. b) Falaram muito sobre o assunto. c) Existe uma solução possível. d) Ventou bastante ontem.", resposta: "a) sujeito: Os alunos atentos; núcleo: alunos; simples. b) sujeito indeterminado. c) sujeito: uma solução possível; núcleo: solução; simples. d) oração sem sujeito.", criterio: "Avaliar identificação, núcleo e classificação em conjunto." },
      { tipo: "desafio", comando: "Explique a diferença entre sujeito indeterminado e sujeito oculto usando exemplos próprios.", resposta: "Sujeito oculto pode ser identificado pela desinência verbal ou contexto; sujeito indeterminado não se sabe ou não se quer determinar. Deve trazer exemplos coerentes.", criterio: "Considerar comparação clara e exemplos adequados." },
    ];
  }

  if (component.includes("portuguesa")) {
    return [
      { tipo: "interpretação", comando: `Explique, com suas palavras, a ideia principal do texto-base sobre ${theme}.`, resposta: "Resposta que identifique o tema central e sua abordagem.", criterio: "Verificar compreensão global e clareza." },
      { tipo: "localização", comando: `Retire do texto-base uma informação que se relacione diretamente a ${c[0]}.`, resposta: "Informação coerente retirada ou parafraseada do texto-base.", criterio: "Avaliar relação com o conteúdo e fidelidade ao texto." },
      { tipo: "lacuna", comando: `Complete: O estudo de ${theme} exige leitura, ________ e justificativa das respostas.`, resposta: "interpretação", criterio: "Aceitar termos equivalentes, como análise/compreensão, se fizer sentido." },
      { tipo: "classificação", comando: "Classifique a função da palavra destacada na frase: 'A leitura atenta ajuda muito.' Palavra destacada: 'atenta'.", resposta: "Adjetivo, pois caracteriza o substantivo leitura.", criterio: "Considerar classificação e justificativa." },
      { tipo: "reescrita", comando: "Reescreva a frase substituindo 'muito importante' por uma expressão mais precisa e formal.", resposta: "Ex.: relevante, essencial, significativo, fundamental.", criterio: "Avaliar adequação vocabular e preservação do sentido." },
      { tipo: "justificativa", comando: `Justifique por que ${c[0]} pode ajudar na compreensão do tema.`, resposta: "Justificativa coerente com o conteúdo e o texto-base.", criterio: "Exigir explicação, não apenas opinião solta." },
    ];
  }

  if (component.includes("matematica")) {
    return [
      { tipo: "conceito", comando: `Explique o conceito central relacionado a ${c[0]} e dê um exemplo numérico.`, resposta: "Explicação correta acompanhada de exemplo adequado.", criterio: "Conferir conceito, exemplo e linguagem matemática." },
      { tipo: "cálculo", comando: "Resolva uma situação com os dados: 12, 18 e 30. Organize o cálculo e explique a estratégia usada.", resposta: "Resposta depende do conteúdo; deve apresentar cálculo, operação e justificativa.", criterio: "Avaliar procedimento, organização e resultado." },
      { tipo: "tabela", comando: `Monte uma tabela simples com três exemplos de ${theme} e seus respectivos resultados.`, resposta: "Tabela coerente com exemplos e resultados compatíveis.", criterio: "Observar organização e relação entre dados." },
      { tipo: "problema", comando: `Crie e resolva um problema contextualizado envolvendo ${c[0]}.`, resposta: "Problema coerente, solução organizada e resultado conferido.", criterio: "Avaliar criação, resolução e conferência." },
      { tipo: "erro comum", comando: "Identifique um erro comum ao resolver esse tipo de exercício e explique como evitá-lo.", resposta: "Erro plausível e estratégia preventiva.", criterio: "Verificar compreensão do procedimento." },
      { tipo: "desafio", comando: `Resolva um desafio mais complexo envolvendo dois conteúdos: ${c[0]} e ${c[1] || c[0]}.`, resposta: "Solução com etapas e justificativa.", criterio: "Avaliar raciocínio e explicação." },
    ];
  }

  if (component.includes("espanhola") || component.includes("espanhol")) {
    return [
      { tipo: "vocabulário", comando: `Escreva cinco palavras em espanhol relacionadas a ${theme} e seus significados em português.`, resposta: "Lista com palavras pertinentes e traduções/contextos adequados.", criterio: "Observar pertinência e grafia." },
      { tipo: "associação", comando: "Relacione expressão e uso: 'Hola', '¿Cómo estás?', 'Gracias', 'Hasta luego'.", resposta: "Saudação; pergunta sobre estado; agradecimento; despedida.", criterio: "Avaliar associação correta em contexto." },
      { tipo: "diálogo", comando: `Complete um diálogo curto em espanhol usando duas palavras ligadas a ${c[0]}.`, resposta: "Diálogo simples, coerente e com vocabulário do tema.", criterio: "Considerar comunicação e adequação lexical." },
      { tipo: "interpretação", comando: "Leia a frase: 'La cultura hispánica reúne diferentes países, historias y formas de hablar.' O que ela afirma?", resposta: "Afirma que há diversidade cultural e linguística no mundo hispânico.", criterio: "Verificar compreensão contextual." },
      { tipo: "produção", comando: `Produza três frases em espanhol sobre ${theme}.`, resposta: "Frases simples, corretas e relacionadas ao tema.", criterio: "Avaliar vocabulário, sentido e estrutura." },
      { tipo: "cultura", comando: "Cite um país hispânico e uma característica cultural que poderia ser pesquisada pela turma.", resposta: "País e característica cultural pertinente.", criterio: "Considerar pertinência e respeito cultural." },
    ];
  }

  if (component.includes("religioso")) {
    return [
      { tipo: "compreensão", comando: `Explique a ideia central do tema ${theme} em até três linhas.`, resposta: "Explicação clara e respeitosa do tema.", criterio: "Avaliar compreensão e respeito à diversidade." },
      { tipo: "valor", comando: `Identifique um valor relacionado a ${c[0]} e explique como ele pode aparecer na convivência escolar.`, resposta: "Valor pertinente e aplicação no cotidiano.", criterio: "Observar relação com convivência e ética." },
      { tipo: "situação", comando: "Leia: 'Um colega passa por dificuldade e a turma precisa decidir como agir.' Que atitude respeitosa poderia ser tomada?", resposta: "Atitude de acolhimento, escuta, ajuda ou solidariedade.", criterio: "Avaliar empatia e justificativa." },
      { tipo: "comparação", comando: `Compare ${c[0]} com uma situação atual de paciência, respeito ou responsabilidade.`, resposta: "Comparação coerente e respeitosa.", criterio: "Exigir relação clara entre tema e cotidiano." },
      { tipo: "justificativa", comando: "Justifique por que o diálogo é importante em situações de conflito.", resposta: "Porque permite escuta, compreensão e busca de solução respeitosa.", criterio: "Avaliar argumentação ética." },
      { tipo: "síntese", comando: `Escreva uma frase-síntese sobre a aprendizagem principal de ${theme}.`, resposta: "Síntese clara e adequada ao tema.", criterio: "Observar concisão e pertinência." },
    ];
  }

  return [
    { tipo: "compreensão", comando: `Explique o que você entendeu sobre ${theme}.`, resposta: "Resposta coerente com o tema.", criterio: "Avaliar compreensão geral." },
    { tipo: "conceito", comando: `Defina ${c[0]} com suas palavras.`, resposta: "Definição clara e adequada.", criterio: "Observar clareza e relação com o conteúdo." },
    { tipo: "relação", comando: `Relacione ${c[0]} com ${c[1] || theme}.`, resposta: "Relação coerente entre os conteúdos.", criterio: "Avaliar conexão lógica." },
    { tipo: "aplicação", comando: `Dê um exemplo de aplicação de ${theme} no cotidiano.`, resposta: "Exemplo pertinente.", criterio: "Observar contextualização." },
    { tipo: "justificativa", comando: "Justifique sua resposta anterior com uma explicação completa.", resposta: "Justificativa organizada.", criterio: "Avaliar argumentação." },
    { tipo: "desafio", comando: `Crie uma pergunta desafiadora sobre ${theme} e responda.`, resposta: "Pergunta e resposta coerentes.", criterio: "Avaliar autoria e síntese." },
  ];
}

function makeQuestion(template: ExerciseTemplate, numero: number, tipoMaterial: string): MaterialAIQuestion {
  const isObjective = normalize(tipoMaterial) === "prova" && numero % 3 === 0;
  if (isObjective) {
    return {
      numero,
      tipo: "objetiva",
      enunciado: `${template.comando}\nAssinale a alternativa que melhor representa a resposta esperada.`,
      alternativas: template.alternativas?.length
        ? template.alternativas
        : [
            `A) ${template.resposta}`,
            "B) Resposta sem relação com o conteúdo.",
            "C) Resposta incompleta, sem justificativa.",
            "D) Resposta que contradiz o comando.",
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
  const quantity = clampQuestionCount(input.quantidadeQuestoes, normalize(input.tipo) === "prova" ? 10 : 8);
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
    `Bloco 1 — Retomada: questões 1 a ${Math.min(3, questions.length)} trabalham conceitos, leitura e identificação inicial.`,
    `Bloco 2 — Aplicação: questões ${Math.min(4, questions.length)} a ${Math.min(7, questions.length)} exigem análise, relação, reescrita, cálculo ou produção guiada.`,
    `Bloco 3 — Desafio: questões finais pedem justificativa, síntese, criação ou resolução mais completa.`,
  ];

  if (type === "apostila") {
    return [
      { titulo: "Explicação didática", conteudo: `${profile.abertura}\n\nConceitos trabalhados: ${conteudos.map(contentTitle).join(", ")}.`, itens: profile.vocabulario.slice(0, 8) },
      { titulo: "Exemplos orientados", conteudo: `Use exemplos próximos da realidade da turma para mostrar como ${theme} aparece em diferentes situações.`, itens: questions.slice(0, 4).map((q) => q.enunciado) },
      { titulo: "Exercícios de fixação", conteudo: "Resolva os exercícios com atenção aos comandos e registre as respostas no caderno ou na folha impressa.", itens: questions.map((q) => `Questão ${q.numero}: ${q.tipo}`) },
    ];
  }

  if (type === "sequencia") {
    return [
      { titulo: "Aula 1 — Sondagem e contextualização", conteudo: `Apresente o tema ${theme}, levante conhecimentos prévios e explore exemplos iniciais.`, itens: ["Roda de conversa", "Registro no quadro", "Pergunta disparadora"] },
      { titulo: "Aula 2 — Exercícios guiados", conteudo: "Aplique exercícios graduados com mediação do professor e correção parcial.", itens: blocos },
      { titulo: "Aula 3 — Produção, revisão e avaliação", conteudo: "Finalize com atividade de síntese, socialização e gabarito comentado.", itens: ["Produção individual ou em dupla", "Correção coletiva", "Autoavaliação"] },
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
      { titulo: "Antes do estudo", conteudo: `Leia o tema ${theme}, observe os conteúdos e marque dúvidas iniciais.`, itens: ["O que já sei?", "O que preciso aprender?", "Quais palavras são importantes?"] },
      { titulo: "Durante o estudo", conteudo: "Resolva as questões, sublinhe comandos e registre justificativas.", itens: questions.slice(0, 6).map((q) => `Questão ${q.numero}: ${q.tipo}`) },
      { titulo: "Depois do estudo", conteudo: "Revise o gabarito, corrija respostas e escreva uma síntese do que aprendeu.", itens: ["Corrigir", "Reescrever", "Sintetizar", "Autoavaliar"] },
    ];
  }

  return [
    { titulo: "Texto-base ou situação inicial", conteudo: textBase, itens: [] },
    { titulo: "Organização dos exercícios", conteudo: "A atividade foi construída com comandos variados, inspirados em estruturas de livros didáticos: lacunas, classificação, reescrita, interpretação, associação, justificativa e desafio.", itens: blocos },
    { titulo: "Banco de palavras e conceitos", conteudo: "Use este banco como apoio durante a correção ou para adaptação da atividade.", itens: Array.from(new Set([...profile.vocabulario, ...conteudos.flatMap((line) => line.split(/[:,]/).map((x) => x.trim()).filter(Boolean)).slice(0, 8)])).slice(0, 12) },
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
    resumo: `Material em padrão livro de atividades, com progressão didática, exercícios variados, versão do aluno e gabarito do professor.`,
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
      "Explique os comandos antes do início e resolva um item-modelo com a turma.",
      "Use a correção comentada para identificar dificuldades e retomar conceitos.",
      "Adapte quantidade, tempo e apoio conforme o perfil da turma.",
    ],
    orientacoesAluno: [
      "Leia cada comando com atenção antes de responder.",
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
  const expected = normalize(input.tipo) === "prova" ? Math.min(clampQuestionCount(input.quantidadeQuestoes, 10), 10) : 4;
  return Array.isArray(output.questoes) && output.questoes.length >= expected;
}

function mergeArrays(primary: string[] | undefined, fallback: string[]): string[] {
  const values = [...(Array.isArray(primary) ? primary : []), ...fallback];
  return Array.from(new Set(values.map((item) => String(item || "").trim()).filter(Boolean)));
}

export function enhanceHardPedagogicalMaterial(input: MaterialAIInput, generated?: Partial<MaterialAIOutput>): MaterialAIOutput {
  const hard = buildHardPedagogicalMaterial(input);
  if (!generated || !enoughQuestions(generated, input)) return hard;

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
