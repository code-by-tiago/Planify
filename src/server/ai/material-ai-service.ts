import type {
  MaterialAIGame,
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
  MaterialContentSuggestionInput,
  MaterialContentSuggestionOutput,
  MaterialRecommendedOption,
  MaterialSuggestedContent,
} from "../../types/ai";
import { buildVisualGameMaterial } from "../../lib/materiais/game-builder";
import { generateGeminiJSON } from "./gemini-client";
import {
  buildMaterialPrompt,
  buildMaterialSystemInstruction,
} from "./prompts/material-prompt";
import {
  buildMaterialContentSuggestionPrompt,
  buildMaterialContentSuggestionSystemInstruction,
} from "./prompts/material-content-suggestion-prompt";

function normalizeConteudos(conteudos: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) {
    return conteudos.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(conteudos)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeType(type: string): string {
  return String(type || "").trim().toLowerCase();
}

function normalizeGameModel(model: unknown): string {
  const value = String(model || "").trim().toLowerCase();
  if (["caca_palavras", "cruzadinha", "bingo", "memoria", "domino", "quiz", "cartas"].includes(value)) {
    return value;
  }
  return "caca_palavras";
}

function isJogo(type: string): boolean {
  return normalizeType(type) === "jogo";
}

function isProjeto(type: string): boolean {
  return normalizeType(type) === "projeto";
}

function isRoteiro(type: string): boolean {
  return normalizeType(type) === "roteiro";
}

function needsQuestionQuantity(type: string): boolean {
  return normalizeType(type) === "atividade" || normalizeType(type) === "prova";
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function validateInput(input: MaterialAIInput): string | null {
  if (!input) return "Dados do material não foram enviados.";
  if (!String(input.etapa || "").trim()) return "Informe a etapa.";
  if (!String(input.anoSerie || "").trim()) return "Informe o ano/série.";
  if (!String(input.componenteCurricular || "").trim()) return "Informe o componente curricular.";
  if (!String(input.tipo || "").trim()) return "Informe o tipo de material.";
  if (!String(input.tema || "").trim()) return "Informe o tema do material.";
  if (normalizeConteudos(input.conteudos).length === 0) return "Informe ao menos um conteúdo.";
  if (needsQuestionQuantity(input.tipo) && !String(input.quantidadeQuestoes || "").trim()) {
    return "Informe a quantidade de questões para atividade ou prova.";
  }
  return null;
}

function normalizeQuestion(question: Partial<MaterialAIQuestion>, index: number): MaterialAIQuestion {
  return {
    numero: Number(question.numero || index + 1),
    tipo: String(question.tipo || "discursiva").trim(),
    enunciado: String(question.enunciado || "").trim(),
    alternativas: normalizeStringArray(question.alternativas),
    respostaEsperada: String(question.respostaEsperada || "").trim(),
    criterioCorrecao: String(question.criterioCorrecao || "").trim(),
  };
}

function normalizeSection(section: Partial<MaterialAISection> & { descricao?: string }): MaterialAISection {
  return {
    titulo: String(section.titulo || "Seção").trim(),
    conteudo: String(section.conteudo || section.descricao || "").trim(),
    itens: normalizeStringArray(section.itens),
    visualHtml: section.visualHtml,
  };
}

function normalizeGame(game: MaterialAIGame | undefined, fallback: MaterialAIGame | undefined): MaterialAIGame | undefined {
  if (!game && !fallback) return undefined;

  return {
    nome: String(game?.nome || fallback?.nome || "Jogo pedagógico").trim(),
    tipoJogo: String(game?.tipoJogo || fallback?.tipoJogo || "Jogo pedagógico").trim(),
    objetivo: String(game?.objetivo || fallback?.objetivo || "Revisar o conteúdo de forma lúdica.").trim(),
    materiais: normalizeStringArray(game?.materiais).length ? normalizeStringArray(game?.materiais) : fallback?.materiais || [],
    preparacao: normalizeStringArray(game?.preparacao).length ? normalizeStringArray(game?.preparacao) : fallback?.preparacao || [],
    regras: normalizeStringArray(game?.regras).length ? normalizeStringArray(game?.regras) : fallback?.regras || [],
    modoDeJogar: normalizeStringArray(game?.modoDeJogar).length ? normalizeStringArray(game?.modoDeJogar) : fallback?.modoDeJogar || [],
    variacoes: normalizeStringArray(game?.variacoes).length ? normalizeStringArray(game?.variacoes) : fallback?.variacoes || [],
    fechamento: String(game?.fechamento || fallback?.fechamento || "Finalize com correção coletiva.").trim(),
  };
}

function normalizeCommonOutput(output: Partial<MaterialAIOutput>, input: MaterialAIInput): MaterialAIOutput {
  const type = normalizeType(input.tipo);

  return {
    titulo: output.titulo || input.titulo || `${input.tipo} — ${input.tema}`,
    subtitulo: output.subtitulo || `${input.tipo} de ${input.componenteCurricular}`,
    tipo: output.tipo || type,
    resumo: output.resumo || "Material didático gerado com base nos dados informados.",
    dadosGerais: {
      escola: input.escola || "",
      professor: input.professor || "",
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento || "",
      componenteCurricular: input.componenteCurricular,
      tema: input.tema,
      duracao: input.duracao || "",
      ...output.dadosGerais,
    },
    objetivos: normalizeStringArray(output.objetivos),
    conteudos: normalizeStringArray(output.conteudos).length ? normalizeStringArray(output.conteudos) : normalizeConteudos(input.conteudos),
    orientacoesProfessor: normalizeStringArray(output.orientacoesProfessor),
    orientacoesAluno: normalizeStringArray(output.orientacoesAluno),
    introducao: output.introducao || "",
    secoes: Array.isArray(output.secoes) ? output.secoes.map(normalizeSection) : [],
    questoes: Array.isArray(output.questoes) ? output.questoes.map((question, index) => normalizeQuestion(question, index)) : [],
    jogo: undefined,
    projeto: isProjeto(type) ? output.projeto : undefined,
    roteiro: isRoteiro(type) ? output.roteiro : undefined,
    criteriosAvaliacao: normalizeStringArray(output.criteriosAvaliacao),
    gabarito: normalizeStringArray(output.gabarito),
    adaptacoesInclusivas: normalizeStringArray(output.adaptacoesInclusivas),
    sugestoesUso: normalizeStringArray(output.sugestoesUso),
    alertas: normalizeStringArray(output.alertas),
  };
}

function mergeGameWithAI(input: MaterialAIInput, aiOutput?: Partial<MaterialAIOutput>, aiWarning?: string): MaterialAIOutput {
  const output = aiOutput || {};
  const visual = buildVisualGameMaterial(input, output);
  const aiObjectives = normalizeStringArray(output.objetivos);
  const aiTeacher = normalizeStringArray(output.orientacoesProfessor);
  const aiStudent = normalizeStringArray(output.orientacoesAluno);
  const aiCriteria = normalizeStringArray(output.criteriosAvaliacao);
  const aiAdaptations = normalizeStringArray(output.adaptacoesInclusivas);
  const aiSuggestions = normalizeStringArray(output.sugestoesUso);

  return {
    ...visual,
    titulo: output.titulo || visual.titulo,
    subtitulo: output.subtitulo || visual.subtitulo,
    resumo: output.resumo || visual.resumo,
    objetivos: aiObjectives.length ? aiObjectives : visual.objetivos,
    orientacoesProfessor: aiTeacher.length ? aiTeacher : visual.orientacoesProfessor,
    orientacoesAluno: aiStudent.length ? aiStudent : visual.orientacoesAluno,
    introducao: output.introducao || visual.introducao,
    jogo: normalizeGame(output.jogo, visual.jogo),
    criteriosAvaliacao: aiCriteria.length ? aiCriteria : visual.criteriosAvaliacao,
    adaptacoesInclusivas: aiAdaptations.length ? aiAdaptations : visual.adaptacoesInclusivas,
    sugestoesUso: aiSuggestions.length ? aiSuggestions : visual.sugestoesUso,
    alertas: [
      ...normalizeStringArray(output.alertas),
      ...(aiWarning ? [aiWarning] : []),
    ],
    // Regra de ouro: o jogo visual é sempre do construtor Planify, não do texto livre da IA.
    secoes: visual.secoes,
    gabarito: visual.gabarito,
    visualHtml: visual.visualHtml,
    printHtml: visual.printHtml,
  };
}

export async function generateMaterialWithAI(rawInput: MaterialAIInput): Promise<MaterialAIOutput> {
  const validationError = validateInput(rawInput);
  if (validationError) throw new Error(validationError);

  const input: MaterialAIInput = {
    ...rawInput,
    titulo: String(rawInput.titulo || rawInput.tema || "Material Planify").trim(),
    tipo: normalizeType(rawInput.tipo),
    modeloJogo: normalizeGameModel(rawInput.modeloJogo),
    conteudos: normalizeConteudos(rawInput.conteudos),
  };

  if (isJogo(input.tipo)) {
    try {
      const generated = await generateGeminiJSON<MaterialAIOutput>({
        systemInstruction: buildMaterialSystemInstruction(),
        prompt: buildMaterialPrompt(input),
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 9000,
      });
      return mergeGameWithAI(input, generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "IA indisponível";
      return mergeGameWithAI(
        input,
        undefined,
        `A IA não respondeu plenamente, então o Planify usou o construtor visual premium de jogos. Detalhe técnico: ${message}`,
      );
    }
  }

  const generated = await generateGeminiJSON<MaterialAIOutput>({
    systemInstruction: buildMaterialSystemInstruction(),
    prompt: buildMaterialPrompt(input),
    temperature: 0.35,
    topP: 0.85,
    maxOutputTokens: 10000,
  });

  return normalizeCommonOutput(generated, input);
}


function normalizeForSuggestion(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function content(
  id: string,
  titulo: string,
  descricao: string,
  palavrasChave: string[],
  objetivos: string[],
  dificuldade = "Intermediário",
  tempoEstimado = "15 a 25 minutos",
): MaterialSuggestedContent {
  return {
    id,
    titulo,
    descricao,
    palavrasChave: uniq(palavrasChave),
    objetivos: uniq(objetivos),
    dificuldade,
    tempoEstimado,
    justificativaPedagogica: `Este conteúdo ajuda a transformar o tema em aprendizagem observável, com conceitos claros para atividades, jogos e revisão.`,
  };
}

function fallbackSuggestedContents(input: MaterialContentSuggestionInput): MaterialContentSuggestionOutput {
  const tema = String(input.tema || "tema central").trim();
  const component = normalizeForSuggestion(input.componenteCurricular);
  const theme = normalizeForSuggestion(tema);
  let conteudos: MaterialSuggestedContent[] = [];
  let palavrasChaveGerais: string[] = [];

  if (component.includes("ensino religioso") && (theme.includes("jo") || theme.includes("prova") || theme.includes("sofrimento"))) {
    conteudos = [
      content("c1", "Quem foi Jó na tradição bíblica", "Estudo introdutório sobre a figura de Jó, seu contexto narrativo e sua importância para a reflexão sobre fé e perseverança.", ["Jó", "narrativa", "fé", "tradição"], ["Identificar Jó como personagem central da narrativa estudada.", "Relacionar a história de Jó ao tema da perseverança."], "Básico"),
      content("c2", "Fidelidade diante das provações", "Análise da fidelidade como atitude de permanência, confiança e coerência em meio às dificuldades.", ["fidelidade", "provação", "confiança", "perseverança"], ["Compreender a fidelidade como valor moral e religioso.", "Reconhecer situações de provação na narrativa."], "Intermediário"),
      content("c3", "Paciência, sofrimento e esperança", "Discussão sobre como a narrativa apresenta dor, espera, paciência e esperança como temas de reflexão humana.", ["paciência", "sofrimento", "esperança", "resiliência"], ["Relacionar sofrimento e esperança no percurso de Jó.", "Expressar reflexões respeitosas sobre dificuldades humanas."], "Intermediário"),
      content("c4", "Integridade e confiança", "Exploração da integridade de Jó e da confiança como postura ética diante da incerteza.", ["integridade", "confiança", "ética", "sabedoria"], ["Analisar atitudes de integridade no contexto da narrativa.", "Diferenciar confiança, passividade e responsabilidade."], "Intermediário"),
      content("c5", "Diálogo, amizade e aconselhamento", "Estudo dos diálogos da narrativa e da importância de escutar, acolher e aconselhar sem julgamento simplista.", ["amigos", "diálogo", "escuta", "acolhimento"], ["Refletir sobre o papel dos amigos na narrativa.", "Avaliar atitudes de escuta e cuidado nas relações."], "Intermediário"),
      content("c6", "Restauração e aprendizagem moral", "Síntese final sobre reconstrução, restauração e aprendizagens possíveis a partir da história de Jó.", ["restauração", "aprendizagem", "justiça", "renovação"], ["Compreender o sentido pedagógico da restauração na narrativa.", "Produzir síntese sobre valores presentes no tema."], "Intermediário"),
    ];
    palavrasChaveGerais = ["Jó", "fidelidade", "paciência", "sofrimento", "esperança", "provação", "integridade", "confiança", "restauração", "diálogo", "sabedoria", "justiça"];
  } else if (component.includes("espanhola") || component.includes("espanhol")) {
    conteudos = [
      content("c1", "Vocabulário essencial do tema", `Seleção de palavras e expressões em espanhol relacionadas a ${tema}.`, ["vocabulario", "palabras", "expresiones", "pronunciación"], ["Ampliar repertório lexical em espanhol.", "Usar palavras do tema em situações comunicativas simples."], "Básico"),
      content("c2", "Diálogos e interação oral", "Prática de perguntas, respostas e pequenos diálogos contextualizados.", ["diálogo", "saludos", "preguntas", "respuestas"], ["Praticar interação oral em espanhol.", "Construir pequenos diálogos com vocabulário do tema."], "Intermediário"),
      content("c3", "Leitura e interpretação em espanhol", "Atividade com frases, pequenos textos ou cartões de leitura vinculados ao tema.", ["lectura", "interpretación", "texto", "comprensión"], ["Compreender informações explícitas em textos curtos.", "Relacionar vocabulário e contexto."], "Intermediário"),
      content("c4", "Cultura hispânica e diversidade", "Exploração de aspectos culturais, países, costumes e formas de expressão do mundo hispânico.", ["cultura", "hispánico", "países", "diversidad"], ["Reconhecer a diversidade cultural hispânica.", "Valorizar diferentes formas de expressão linguística."], "Intermediário"),
      content("c5", "Produção guiada", "Criação de frases, cartões, respostas curtas ou apresentações usando o vocabulário estudado.", ["producción", "frases", "presentación", "comunicación"], ["Produzir frases simples em espanhol.", "Usar o tema em uma proposta comunicativa."], "Intermediário"),
    ];
    palavrasChaveGerais = ["saludos", "vocabulario", "diálogo", "lectura", "cultura", "hispánico", "países", "diversidad", "pronunciación", "presentación"];
  } else if (component.includes("matematica")) {
    conteudos = [
      content("c1", "Conceitos essenciais", `Retomada dos conceitos matemáticos centrais ligados ao tema ${tema}.`, ["conceito", "definição", "propriedade", "relação"], ["Identificar conceitos matemáticos do tema.", "Usar linguagem matemática adequada."], "Básico"),
      content("c2", "Procedimentos de resolução", "Prática de estratégias, cálculos, representações e conferência de resultados.", ["cálculo", "estratégia", "resultado", "procedimento"], ["Resolver situações-problema.", "Explicar procedimentos utilizados."], "Intermediário"),
      content("c3", "Problemas contextualizados", "Aplicação do conteúdo em situações próximas da realidade dos estudantes.", ["problema", "contexto", "aplicação", "raciocínio"], ["Aplicar o conteúdo em problemas.", "Interpretar dados e comandos."], "Intermediário"),
      content("c4", "Revisão por desafios", "Desafios graduados para fixação, cooperação e avaliação formativa.", ["desafio", "revisão", "jogo", "fixação"], ["Consolidar procedimentos.", "Colaborar na resolução de desafios."], "Intermediário"),
    ];
    palavrasChaveGerais = ["problema", "cálculo", "raciocínio", "estratégia", "resultado", "desafio", "revisão", "aplicação"];
  } else if (component.includes("portuguesa")) {
    conteudos = [
      content("c1", "Leitura e compreensão", `Leitura orientada de textos ligados ao tema ${tema}.`, ["leitura", "texto", "compreensão", "contexto"], ["Localizar informações.", "Compreender sentidos do texto."], "Básico"),
      content("c2", "Interpretação e inferência", "Construção de sentidos explícitos e implícitos por meio de pistas textuais.", ["interpretação", "inferência", "pista", "sentido"], ["Realizar inferências.", "Justificar respostas com base no texto."], "Intermediário"),
      content("c3", "Vocabulário e linguagem", "Estudo de palavras, expressões e recursos linguísticos vinculados ao tema.", ["vocabulário", "linguagem", "expressão", "sentido"], ["Ampliar repertório linguístico.", "Relacionar palavras ao contexto."], "Intermediário"),
      content("c4", "Produção textual guiada", "Produção de respostas, frases, parágrafos ou textos curtos com orientação clara.", ["produção", "escrita", "parágrafo", "revisão"], ["Produzir textos coerentes.", "Revisar a própria escrita."], "Intermediário"),
    ];
    palavrasChaveGerais = ["leitura", "interpretação", "inferência", "vocabulário", "linguagem", "produção", "texto", "contexto"];
  } else {
    const temaBase = tema || "tema estudado";
    conteudos = [
      content("c1", `Introdução ao tema ${temaBase}`, "Apresentação do tema, levantamento de conhecimentos prévios e organização dos conceitos iniciais.", [temaBase, "introdução", "conceitos", "contexto"], ["Reconhecer ideias iniciais do tema.", "Registrar conhecimentos prévios."], "Básico"),
      content("c2", `Conceitos principais de ${temaBase}`, "Estudo dos conceitos centrais com exemplos, linguagem adequada e relação com a realidade da turma.", ["conceitos", "exemplos", "aplicação", "revisão"], ["Identificar conceitos centrais.", "Relacionar conceitos a exemplos."], "Intermediário"),
      content("c3", `Aplicações e situações-problema`, "Exploração do tema por meio de situações, perguntas, desafios e análise de exemplos.", ["aplicação", "desafio", "situação", "problema"], ["Aplicar conhecimentos.", "Resolver desafios contextualizados."], "Intermediário"),
      content("c4", `Síntese e revisão do tema`, "Retomada dos pontos principais com registro, sistematização e avaliação formativa.", ["síntese", "revisão", "gabarito", "registro"], ["Sintetizar aprendizagens.", "Revisar pontos de dificuldade."], "Intermediário"),
      content("c5", `Produção final sobre ${temaBase}`, "Proposta de produção, socialização ou jogo final para demonstrar aprendizagem.", ["produção", "socialização", "jogo", "aprendizagem"], ["Produzir evidência de aprendizagem.", "Socializar resultados."], "Intermediário"),
    ];
    palavrasChaveGerais = uniq([temaBase, "conceitos", "exemplos", "aplicação", "desafio", "síntese", "revisão", "produção", "aprendizagem"]);
  }

  const jogosRecomendados: MaterialRecommendedOption[] = [
    { tipo: "jogo", modeloJogo: "cruzadinha", titulo: "Cruzadinha interpretativa", motivo: "Boa para trabalhar conceitos, pistas e gabarito com precisão." },
    { tipo: "jogo", modeloJogo: "caca_palavras", titulo: "Caça-palavras temático", motivo: "Bom para fixação de vocabulário, termos e personagens." },
    { tipo: "jogo", modeloJogo: "memoria", titulo: "Memória conceito e significado", motivo: "Excelente para associação entre termo, pista e significado." },
    { tipo: "jogo", modeloJogo: "quiz", titulo: "Quiz com gabarito comentado", motivo: "Indicado para revisão, competição saudável e avaliação formativa." },
  ];

  return {
    tema,
    etapa: input.etapa,
    anoSerie: input.anoSerie,
    areaConhecimento: input.areaConhecimento || "",
    componenteCurricular: input.componenteCurricular,
    resumoPedagogico: `Sugestões organizadas para transformar o tema ${tema} em conteúdos aplicáveis, jogos visuais e materiais editáveis no Planify.`,
    conteudos,
    objetivosGerais: uniq(conteudos.flatMap((item) => item.objetivos)).slice(0, 6),
    palavrasChaveGerais: uniq(palavrasChaveGerais),
    materiaisRecomendados: [
      { tipo: "jogo", modeloJogo: input.modeloJogo || "cruzadinha", titulo: "Jogo pedagógico visual", motivo: "Transforma o tema em material imprimível, editável e mais engajador." },
      { tipo: "atividade", titulo: "Atividade guiada", motivo: "Boa para registrar compreensão individual e corrigir em sala." },
      { tipo: "sequencia", titulo: "Sequência didática curta", motivo: "Organiza o tema em etapas de aula com progressão." },
    ],
    jogosRecomendados,
    observacoesDeUso: [
      "Revise as sugestões e mantenha apenas os conteúdos que deseja trabalhar.",
      "Para jogos visuais, prefira conteúdos com palavras-chave claras.",
      "Depois de gerar, abra no Editor para ajustar linguagem, layout ou impressão.",
    ],
    alertas: [],
  };
}

function normalizeSuggestionOutput(output: Partial<MaterialContentSuggestionOutput>, fallback: MaterialContentSuggestionOutput): MaterialContentSuggestionOutput {
  const conteudos = Array.isArray(output.conteudos)
    ? output.conteudos
        .map((item, index): MaterialSuggestedContent => ({
          id: String(item?.id || `c${index + 1}`),
          titulo: String(item?.titulo || fallback.conteudos[index]?.titulo || `Conteúdo ${index + 1}`).trim(),
          descricao: String(item?.descricao || fallback.conteudos[index]?.descricao || "Conteúdo sugerido para o tema.").trim(),
          palavrasChave: uniq(Array.isArray(item?.palavrasChave) ? item.palavrasChave.map(String) : fallback.conteudos[index]?.palavrasChave || []),
          objetivos: uniq(Array.isArray(item?.objetivos) ? item.objetivos.map(String) : fallback.conteudos[index]?.objetivos || []),
          dificuldade: String(item?.dificuldade || fallback.conteudos[index]?.dificuldade || "Intermediário"),
          tempoEstimado: String(item?.tempoEstimado || fallback.conteudos[index]?.tempoEstimado || "15 a 25 minutos"),
          justificativaPedagogica: String(item?.justificativaPedagogica || fallback.conteudos[index]?.justificativaPedagogica || "Sugestão compatível com o tema."),
        }))
        .filter((item) => item.titulo && item.descricao)
    : [];

  return {
    tema: output.tema || fallback.tema,
    etapa: output.etapa || fallback.etapa,
    anoSerie: output.anoSerie || fallback.anoSerie,
    areaConhecimento: output.areaConhecimento || fallback.areaConhecimento,
    componenteCurricular: output.componenteCurricular || fallback.componenteCurricular,
    resumoPedagogico: output.resumoPedagogico || fallback.resumoPedagogico,
    conteudos: conteudos.length >= 4 ? conteudos.slice(0, 8) : fallback.conteudos,
    objetivosGerais: uniq(Array.isArray(output.objetivosGerais) ? output.objetivosGerais.map(String) : fallback.objetivosGerais),
    palavrasChaveGerais: uniq(Array.isArray(output.palavrasChaveGerais) ? output.palavrasChaveGerais.map(String) : fallback.palavrasChaveGerais),
    materiaisRecomendados: Array.isArray(output.materiaisRecomendados) && output.materiaisRecomendados.length ? output.materiaisRecomendados : fallback.materiaisRecomendados,
    jogosRecomendados: Array.isArray(output.jogosRecomendados) && output.jogosRecomendados.length ? output.jogosRecomendados : fallback.jogosRecomendados,
    observacoesDeUso: uniq(Array.isArray(output.observacoesDeUso) ? output.observacoesDeUso.map(String) : fallback.observacoesDeUso),
    alertas: uniq([...(Array.isArray(output.alertas) ? output.alertas.map(String) : []), ...fallback.alertas]),
  };
}

export async function suggestMaterialContents(rawInput: MaterialContentSuggestionInput): Promise<MaterialContentSuggestionOutput> {
  if (!rawInput) throw new Error("Dados para sugestão não foram enviados.");
  if (!String(rawInput.etapa || "").trim()) throw new Error("Informe a etapa.");
  if (!String(rawInput.anoSerie || "").trim()) throw new Error("Informe o ano/série.");
  if (!String(rawInput.componenteCurricular || "").trim()) throw new Error("Informe o componente curricular.");
  if (!String(rawInput.tema || "").trim()) throw new Error("Informe o tema central.");

  const input: MaterialContentSuggestionInput = {
    ...rawInput,
    etapa: String(rawInput.etapa || "").trim(),
    anoSerie: String(rawInput.anoSerie || "").trim(),
    areaConhecimento: String(rawInput.areaConhecimento || "").trim(),
    componenteCurricular: String(rawInput.componenteCurricular || "").trim(),
    tema: String(rawInput.tema || "").trim(),
    tipo: String(rawInput.tipo || "jogo").trim(),
    modeloJogo: String(rawInput.modeloJogo || "cruzadinha").trim(),
    quantidade: rawInput.quantidade || 6,
    observacoes: String(rawInput.observacoes || "").trim(),
  };

  const fallback = fallbackSuggestedContents(input);

  try {
    const generated = await generateGeminiJSON<MaterialContentSuggestionOutput>({
      systemInstruction: buildMaterialContentSuggestionSystemInstruction(),
      prompt: buildMaterialContentSuggestionPrompt(input),
      temperature: 0.25,
      topP: 0.8,
      maxOutputTokens: 6500,
    });

    return normalizeSuggestionOutput(generated, fallback);
  } catch (error) {
    const message = error instanceof Error ? error.message : "IA indisponível";
    return {
      ...fallback,
      alertas: [`A IA não respondeu plenamente, então o Planify usou o núcleo pedagógico interno. Detalhe técnico: ${message}`],
    };
  }
}
