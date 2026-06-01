import type {
  MaterialAIGame,
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
} from "../../types/ai";
import { buildVisualGameMaterial } from "../../lib/materiais/game-builder";
import { generateGeminiJSON } from "./gemini-client";
import {
  buildMaterialPrompt,
  buildMaterialSystemInstruction,
} from "./prompts/material-prompt";

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
  const visual = buildVisualGameMaterial(input);
  const output = aiOutput || {};
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
