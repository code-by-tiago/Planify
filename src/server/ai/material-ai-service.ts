import type {
  MaterialAIGame,
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
} from "../../types/ai";
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
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function validateInput(input: MaterialAIInput): string | null {
  if (!input) {
    return "Dados do material não foram enviados.";
  }

  if (!String(input.titulo || "").trim()) {
    return "Informe o título do material.";
  }

  if (!String(input.etapa || "").trim()) {
    return "Informe a etapa.";
  }

  if (!String(input.anoSerie || "").trim()) {
    return "Informe o ano/série.";
  }

  if (!String(input.componenteCurricular || "").trim()) {
    return "Informe o componente curricular.";
  }

  if (!String(input.tipo || "").trim()) {
    return "Informe o tipo de material.";
  }

  if (!String(input.tema || "").trim()) {
    return "Informe o tema do material.";
  }

  if (normalizeConteudos(input.conteudos).length === 0) {
    return "Informe ao menos um conteúdo.";
  }

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

function normalizeSection(section: Partial<MaterialAISection>): MaterialAISection {
  return {
    titulo: String(section.titulo || "Seção").trim(),
    conteudo: String(section.conteudo || "").trim(),
    itens: normalizeStringArray(section.itens),
  };
}

function normalizeGame(game: MaterialAIGame | undefined): MaterialAIGame | undefined {
  if (!game) {
    return undefined;
  }

  return {
    nome: String(game.nome || "").trim(),
    objetivo: String(game.objetivo || "").trim(),
    materiais: normalizeStringArray(game.materiais),
    preparacao: normalizeStringArray(game.preparacao),
    regras: normalizeStringArray(game.regras),
    modoDeJogar: normalizeStringArray(game.modoDeJogar),
    variacoes: normalizeStringArray(game.variacoes),
    fechamento: String(game.fechamento || "").trim(),
  };
}

function normalizeOutput(output: MaterialAIOutput, input: MaterialAIInput): MaterialAIOutput {
  const type = normalizeType(input.tipo);

  return {
    titulo: output.titulo || input.titulo,
    subtitulo: output.subtitulo || `${input.tipo} de ${input.componenteCurricular}`,
    tipo: type,
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
    },
    objetivos: normalizeStringArray(output.objetivos),
    conteudos:
      normalizeStringArray(output.conteudos).length > 0
        ? normalizeStringArray(output.conteudos)
        : normalizeConteudos(input.conteudos),
    orientacoesProfessor: normalizeStringArray(output.orientacoesProfessor),
    orientacoesAluno: normalizeStringArray(output.orientacoesAluno),
    introducao: output.introducao || "",
    secoes: Array.isArray(output.secoes) ? output.secoes.map(normalizeSection) : [],
    questoes: Array.isArray(output.questoes)
      ? output.questoes.map((question, index) => normalizeQuestion(question, index))
      : [],
    jogo: isJogo(type) ? normalizeGame(output.jogo) : undefined,
    projeto: isProjeto(type) ? output.projeto : undefined,
    roteiro: isRoteiro(type) ? output.roteiro : undefined,
    criteriosAvaliacao: normalizeStringArray(output.criteriosAvaliacao),
    gabarito: normalizeStringArray(output.gabarito),
    adaptacoesInclusivas: normalizeStringArray(output.adaptacoesInclusivas),
    sugestoesUso: normalizeStringArray(output.sugestoesUso),
    alertas: normalizeStringArray(output.alertas),
  };
}

export async function generateMaterialWithAI(
  rawInput: MaterialAIInput,
): Promise<MaterialAIOutput> {
  const validationError = validateInput(rawInput);

  if (validationError) {
    throw new Error(validationError);
  }

  const input: MaterialAIInput = {
    ...rawInput,
    tipo: normalizeType(rawInput.tipo),
    conteudos: normalizeConteudos(rawInput.conteudos),
  };

  const generated = await generateGeminiJSON<MaterialAIOutput>({
    systemInstruction: buildMaterialSystemInstruction(),
    prompt: buildMaterialPrompt(input),
    temperature: 0.35,
    topP: 0.85,
    maxOutputTokens: 10000,
  });

  return normalizeOutput(generated, input);
}
