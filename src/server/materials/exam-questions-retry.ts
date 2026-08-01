import { normalizeQuestionOptions } from "@/lib/materiais/material-document-layout";
import { trimTeachyStatement } from "@/lib/materiais/material-document-layout";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import { generateGeminiJSON } from "../ai/gemini-client";
import {
  collectSingleExamQuestionIssues,
  getEngineOutputIssues,
} from "./material-engine-quality";
import {
  buildMaterialEngineHtmlFromStructure,
} from "./material-engine-service";
import { normalizeMaterialEngineRequest } from "./material-engine-validation";
import type {
  ExamQuestion,
  MaterialEngineInput,
  MaterialEngineResponse,
} from "./material-engine-types";

const PARTIAL_EXAM_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          number: { type: "INTEGER" },
          type: {
            type: "STRING",
            enum: ["multipla-escolha", "verdadeiro-falso", "dissertativa", "completar"],
          },
          statement: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          answer: { type: "STRING" },
        },
        required: ["number", "type", "statement", "options", "answer"],
      },
    },
  },
  required: ["questions"],
};

type WeakQuestion = {
  index: number;
  question: ExamQuestion;
  issues: string[];
};

function findWeakQuestions(
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  questions: ExamQuestion[],
): WeakQuestion[] {
  const weak: WeakQuestion[] = [];

  for (const [index, question] of questions.entries()) {
    const issues = collectSingleExamQuestionIssues(request, question);

    if (issues.length) {
      weak.push({ index, question, issues });
    }
  }

  return weak;
}

async function regenerateExamQuestions(
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  weak: WeakQuestion[],
): Promise<ExamQuestion[]> {
  const label = request.tipoMaterial === "lista" ? "exercício" : "questão";
  const prompt = [
    `Regenere SOMENTE as ${label}s abaixo para ${request.tipoMaterial} sobre "${request.tema}".`,
    `Componente: ${request.componenteCurricular}. Ano/série: ${request.anoSerie}.`,
    "Cada item deve citar o tema, ter enunciado direto (sem preâmbulo) e gabarito objetivo.",
    "MÚLTIPLA ESCOLHA: exatamente 4 alternativas no array options, SEM prefixo a) b) — cada alternativa com frase completa (mín. 35 caracteres), plausível e distinta, contextualizada no tema.",
    "PROIBIDO alternativas genéricas ('todas as anteriores', 'nenhuma das anteriores', 'conteúdo estudado', opções de 1–2 palavras).",
    "GABARITO: objetivas com letra/resposta curta (≤120 caracteres no total); dissertativas com passos concretos (40–120 caracteres).",
    "ENUNCIADO: no máximo 3 frases curtas e diretas — comando claro sem contextualização longa.",
    "",
    "Itens a corrigir:",
    ...weak.map(
      ({ question, issues }) =>
        `- ${label} ${question.number} (${question.type}): problemas: ${issues.join("; ")}`,
    ),
    "",
    `Retorne exatamente ${weak.length} item(ns) no array questions, preservando os números originais.`,
  ].join("\n");

  const generated = await generateGeminiJSON<{ questions: ExamQuestion[] }>({
    systemInstruction:
      "Você corrige questões escolares em JSON. Responda apenas com o schema solicitado.",
    prompt,
    cacheProfile: `material-engine:${request.tipoMaterial}`,
    tier: "default",
    temperature: 0.35,
    maxOutputTokens: 8000,
    responseSchema: PARTIAL_EXAM_SCHEMA,
  });

  return (generated.questions ?? []).map((question, index) => ({
    number: question.number ?? weak[index]?.question.number ?? index + 1,
    type: question.type || weak[index]?.question.type || "multipla-escolha",
    statement: trimTeachyStatement(String(question.statement || "")),
    options: normalizeQuestionOptions(
      Array.isArray(question.options)
        ? question.options.map((item) => String(item).trim()).filter(Boolean)
        : [],
    ),
    answer: String(question.answer || "").trim(),
  }));
}

export async function regenerateWeakExamQuestions(
  input: MaterialEngineInput,
  estrutura: MaterialEngineResponse,
): Promise<{
  html: string;
  estrutura: MaterialEngineResponse;
  questionsResolved: number;
  qualityIssues: string[];
  qualityScore: number;
}> {
  const request = normalizeMaterialEngineRequest(input);
  const questions = [...(estrutura.exam?.questions ?? [])];

  if (!questions.length) {
    const html = buildMaterialEngineHtmlFromStructure(input, estrutura);
    return {
      html,
      estrutura,
      questionsResolved: 0,
      qualityIssues: getEngineOutputIssues(request, estrutura),
      qualityScore: computeQualityScore(getEngineOutputIssues(request, estrutura)),
    };
  }

  const weak = findWeakQuestions(request, questions);

  if (!weak.length) {
    const issues = getEngineOutputIssues(request, estrutura);
    const html = buildMaterialEngineHtmlFromStructure(input, estrutura);
    return {
      html,
      estrutura,
      questionsResolved: 0,
      qualityIssues: issues,
      qualityScore: computeQualityScore(issues),
    };
  }

  const regenerated = await regenerateExamQuestions(request, weak);
  const nextQuestions = [...questions];

  let resolved = 0;
  for (const [idx, item] of regenerated.entries()) {
    const target = weak[idx];
    if (!target) continue;
    if (!item.statement.trim()) continue;
    nextQuestions[target.index] = item;
    resolved += 1;
  }

  const nextEstrutura: MaterialEngineResponse = {
    ...estrutura,
    exam: { questions: nextQuestions },
  };

  const issues = getEngineOutputIssues(request, nextEstrutura);
  const html = buildMaterialEngineHtmlFromStructure(input, nextEstrutura);

  return {
    html,
    estrutura: nextEstrutura,
    questionsResolved: resolved,
    qualityIssues: issues,
    qualityScore: computeQualityScore(issues),
  };
}
