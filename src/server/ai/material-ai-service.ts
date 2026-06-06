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
import { buildHardPedagogicalMaterial, enhanceHardPedagogicalMaterial, shouldUseHardPedagogicalEngine } from "../../lib/materiais/pedagogical-hard-engine";
import { enforceMaterialTypeContract } from "../../lib/materiais/material-type-validator";
import { guardMaterialQuality } from "../../lib/materiais/material-quality-guardian";
import { auditMaterialAgainstKnowledgeEngine } from "../../lib/materiais/material-quality-auditor";
import { getModelTierForMaterialType } from "@/lib/ai/material-generation-policy";
import { generateGeminiJSON } from "./gemini-client";
import {
  buildMaterialDynamicPrompt,
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
  const value = String(model || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (value === "trilha") return "trilha";
  if (
    [
      "caca_palavras",
      "cruzadinha",
      "bingo",
      "memoria",
      "domino",
      "quiz",
      "cartas",
      "trilha",
    ].includes(value)
  ) {
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
  return ["atividade", "prova", "lista", "revisao"].includes(normalizeType(type));
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
  const conteudos = normalizeConteudos(input.conteudos);
  if (conteudos.length === 0 && !String(input.tema || "").trim()) {
    return "Informe ao menos um conteúdo.";
  }
  if (needsQuestionQuantity(input.tipo) && !String(input.quantidadeQuestoes || "").trim()) {
    return "Informe a quantidade de questões para atividade ou prova.";
  }
  if (isJogo(input.tipo) && !String(input.modeloJogo || "").trim()) {
    return "Selecione o formato do jogo.";
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

function finalizeMaterial(input: MaterialAIInput, output: MaterialAIOutput): MaterialAIOutput {
  return auditMaterialAgainstKnowledgeEngine(input, guardMaterialQuality(input, output));
}

function buildVerifiedRecoveryMaterial(input: MaterialAIInput): MaterialAIOutput {
  const deterministic = normalizeCommonOutput(buildHardPedagogicalMaterial(input), input);
  const enhanced = enhanceHardPedagogicalMaterial(input, deterministic);
  const contracted = enforceMaterialTypeContract(input, enhanced);
  return finalizeMaterial(input, contracted);
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
        prompt: buildMaterialDynamicPrompt(input),
        cacheProfile: "material-json",
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 9000,
      });
      return finalizeMaterial(input, enforceMaterialTypeContract(input, mergeGameWithAI(input, generated)));
    } catch {
      return finalizeMaterial(input, enforceMaterialTypeContract(input, mergeGameWithAI(
        input,
        undefined,
        "O Planify preparou uma versão visual pronta para uso em sala.",
      )));
    }
  }

  if (shouldUseHardPedagogicalEngine(input.tipo)) {
    try {
      const generated = await generateGeminiJSON<MaterialAIOutput>({
        systemInstruction: buildMaterialSystemInstruction(),
        prompt: buildMaterialDynamicPrompt(input),
        cacheProfile: "material-json",
        tier: getModelTierForMaterialType(input.tipo),
        temperature: 0.18,
        topP: 0.78,
        maxOutputTokens: 18000,
      });

      const normalized = normalizeCommonOutput(generated, input);
      const contracted = enforceMaterialTypeContract(input, enhanceHardPedagogicalMaterial(input, normalized));
      return finalizeMaterial(input, contracted);
    } catch {
      return buildVerifiedRecoveryMaterial(input);
    }
  }

  try {
    const generated = await generateGeminiJSON<MaterialAIOutput>({
      systemInstruction: buildMaterialSystemInstruction(),
      prompt: buildMaterialDynamicPrompt(input),
      cacheProfile: "material-json",
      tier: getModelTierForMaterialType(input.tipo),
      temperature: 0.22,
      topP: 0.8,
      maxOutputTokens: 14000,
    });

    const contracted = enforceMaterialTypeContract(input, normalizeCommonOutput(generated, input));
    return finalizeMaterial(input, contracted);
  } catch {
    return buildVerifiedRecoveryMaterial(input);
  }
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
  } else if ((component.includes("geografia") || component.includes("ciencias humanas") || component.includes("humanas")) && theme.includes("amazonia")) {
    conteudos = [
      content("c1", "Localização e dimensão territorial da Amazônia", "Estudo da Amazônia como região de grande extensão, presença em diferentes estados brasileiros e importância para a organização do território.", ["Amazônia", "território", "região", "Brasil"], ["Localizar a Amazônia no território brasileiro.", "Relacionar extensão territorial e diversidade regional."], "Básico"),
      content("c2", "Biodiversidade, rios e clima", "Análise da floresta, dos rios, do clima equatorial, da biodiversidade e das relações entre elementos naturais.", ["biodiversidade", "rios", "clima", "floresta"], ["Reconhecer características naturais da Amazônia.", "Explicar relações entre clima, água, vegetação e biodiversidade."], "Intermediário"),
      content("c3", "Povos indígenas e comunidades tradicionais", "Estudo de povos indígenas, ribeirinhos, quilombolas, extrativistas e saberes tradicionais ligados ao território amazônico.", ["povos indígenas", "ribeirinhos", "quilombolas", "saberes tradicionais"], ["Valorizar a diversidade sociocultural da Amazônia.", "Relacionar território, cultura e modos de vida."], "Intermediário"),
      content("c4", "Economia, trabalho e uso dos recursos naturais", "Reflexão sobre atividades econômicas, extrativismo, agricultura, mineração, transporte, energia e conflitos pelo uso do território.", ["economia", "extrativismo", "mineração", "recursos naturais"], ["Analisar formas de uso econômico da Amazônia.", "Reconhecer conflitos e impactos relacionados aos recursos naturais."], "Intermediário"),
      content("c5", "Desmatamento, queimadas e impactos ambientais", "Análise de causas e consequências do desmatamento, das queimadas e da perda de biodiversidade, com foco em leitura crítica e cidadania ambiental.", ["desmatamento", "queimadas", "impactos", "conservação"], ["Identificar impactos ambientais na Amazônia.", "Relacionar ações humanas e transformação da paisagem."], "Intermediário"),
      content("c6", "Conservação, cidadania e futuro da Amazônia", "Síntese sobre proteção ambiental, desenvolvimento sustentável, políticas públicas, ciência, educação e participação social.", ["conservação", "sustentabilidade", "cidadania", "futuro"], ["Propor atitudes de conservação e cidadania.", "Elaborar síntese crítica sobre o futuro da Amazônia."], "Intermediário"),
    ];
    palavrasChaveGerais = ["Amazônia", "território", "biodiversidade", "rios", "clima", "povos indígenas", "ribeirinhos", "extrativismo", "desmatamento", "queimadas", "conservação", "sustentabilidade"];
  } else if (component.includes("matematica")) {
    conteudos = [
      content("c1", "Conceitos essenciais", `Retomada dos conceitos matemáticos centrais ligados ao tema ${tema}.`, ["conceito", "definição", "propriedade", "relação"], ["Identificar conceitos matemáticos do tema.", "Usar linguagem matemática adequada."], "Básico"),
      content("c2", "Procedimentos de resolução", "Prática de estratégias, cálculos, representações e conferência de resultados.", ["cálculo", "estratégia", "resultado", "procedimento"], ["Resolver situações-problema.", "Explicar procedimentos utilizados."], "Intermediário"),
      content("c3", "Problemas contextualizados", "Aplicação do conteúdo em situações próximas da realidade dos estudantes.", ["problema", "contexto", "aplicação", "raciocínio"], ["Aplicar o conteúdo em problemas.", "Interpretar dados e comandos."], "Intermediário"),
      content("c4", "Revisão por desafios", "Desafios graduados para fixação, cooperação e avaliação formativa.", ["desafio", "revisão", "jogo", "fixação"], ["Consolidar procedimentos.", "Colaborar na resolução de desafios."], "Intermediário"),
    ];
    palavrasChaveGerais = ["problema", "cálculo", "raciocínio", "estratégia", "resultado", "desafio", "revisão", "aplicação"];
  } else if (component.includes("redacao") || component.includes("redação")) {
    conteudos = [
      content("c1", "Tema, recorte e tese", `Definição do recorte do tema ${tema}, construção de ponto de vista e formulação de tese clara.`, ["tese", "tema", "recorte", "ponto de vista"], ["Formular tese pertinente ao tema.", "Delimitar o recorte argumentativo."], "Básico"),
      content("c2", "Argumentos e repertório", "Construção de argumentos consistentes com repertório sociocultural pertinente e explicado.", ["argumento", "repertório", "evidência", "exemplo"], ["Selecionar repertório pertinente.", "Relacionar evidências à tese."], "Intermediário"),
      content("c3", "Coesão, coerência e parágrafo", "Organização de parágrafos, conectivos, progressão textual e unidade de sentido.", ["coesão", "coerência", "conectivos", "parágrafo"], ["Usar conectivos adequados.", "Organizar parágrafos com progressão."], "Intermediário"),
      content("c4", "Conclusão e proposta de intervenção", "Elaboração de conclusão, síntese e proposta de intervenção quando o gênero solicitar.", ["conclusão", "intervenção", "agente", "ação"], ["Concluir o texto com coerência.", "Elaborar proposta detalhada quando necessário."], "Intermediário"),
      content("c5", "Reescrita e revisão orientada", "Revisão de linguagem, adequação, clareza, concordância, pontuação e melhoria da argumentação.", ["reescrita", "revisão", "clareza", "adequação"], ["Revisar o próprio texto.", "Melhorar precisão e clareza."], "Intermediário"),
    ];
    palavrasChaveGerais = ["tese", "argumento", "repertório", "coesão", "coerência", "parágrafo", "conclusão", "intervenção", "reescrita", "revisão"];
  } else if (component.includes("escrita criativa")) {
    conteudos = [
      content("c1", "Personagem e ponto de vista", `Criação de personagem, narrador e foco narrativo ligados ao tema ${tema}.`, ["personagem", "narrador", "foco narrativo", "voz"], ["Criar personagem coerente.", "Experimentar ponto de vista narrativo."], "Básico"),
      content("c2", "Cenário e atmosfera", "Construção de espaço, tempo, detalhes sensoriais e atmosfera narrativa.", ["cenário", "atmosfera", "descrição", "detalhes"], ["Descrever ambiente com expressividade.", "Usar detalhes sensoriais."], "Intermediário"),
      content("c3", "Conflito, clímax e desfecho", "Organização da progressão narrativa com problema, tensão, clímax e resolução.", ["conflito", "clímax", "desfecho", "tensão"], ["Criar conflito narrativo.", "Conduzir a história a um desfecho coerente."], "Intermediário"),
      content("c4", "Diálogo e ritmo", "Uso de diálogo, travessão, pausas, ritmo e naturalidade nas falas.", ["diálogo", "travessão", "fala", "ritmo"], ["Escrever diálogos claros.", "Usar pontuação adequada."], "Intermediário"),
      content("c5", "Oficina de reescrita criativa", "Revisão de narrativa, ampliação de cenas, cortes, melhoria de imagens e escolha de palavras.", ["reescrita", "imagem", "cena", "estilo"], ["Reescrever cenas com intenção.", "Aprimorar estilo e clareza."], "Intermediário"),
    ];
    palavrasChaveGerais = ["personagem", "narrador", "cenário", "conflito", "clímax", "desfecho", "diálogo", "descrição", "reescrita", "autoria"];
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
      { tipo: "atividade", titulo: "Atividade guiada estilo livro", motivo: "Boa para registrar compreensão individual com comandos variados e gabarito." },
      { tipo: "prova", titulo: "Prova com gabarito comentado", motivo: "Avalia compreensão com questões objetivas, discursivas e contextualizadas." },
      { tipo: "lista", titulo: "Lista de exercícios progressiva", motivo: "Organiza exercícios básicos, intermediários e desafios." },
      { tipo: "revisao", titulo: "Revisão guiada", motivo: "Retoma conteúdos com síntese, exercícios e autoavaliação." },
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
    conteudos:
      conteudos.length > 0
        ? conteudos.slice(0, 8)
        : fallback.conteudos,
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

    const normalized = normalizeSuggestionOutput(generated, fallback);

    if (!normalized.conteudos.length) {
      throw new Error("A IA não retornou conteúdos utilizáveis para este tema.");
    }

    return normalized;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao sugerir conteúdos com IA.";

    console.error("[suggestMaterialContents] Falha na IA:", message);

    throw new Error(message);
  }
}
