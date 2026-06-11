import { normalizeQuestionOptions, trimTeachyStatement } from "@/lib/materiais/material-document-layout";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import type { QuestionBankItem } from "@/types/question-bank";
import { generateGeminiJSON } from "../ai/gemini-client";
import {
  listCommunityQuestions,
  listSchoolQuestions,
  listUserQuestions,
} from "../banco-questoes/question-bank-db-service";
import { getPrimarySchoolIdForUser } from "../schools/school-access";
import { getEngineOutputIssues } from "./material-engine-quality";
import { buildMaterialEngineHtmlFromStructure } from "./material-engine-service";
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

function parseTargetQuantity(quantidade: number): number {
  return Math.min(20, Math.max(3, quantidade || 10));
}

function scoreBankMatch(item: QuestionBankItem, tema: string): number {
  const topic = tema.trim().toLowerCase();
  if (!topic) return 1;

  const haystack = [
    item.enunciado,
    item.tema,
    item.tags.join(" "),
    item.componente,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of topic.split(/\s+/).filter((w) => w.length > 2)) {
    if (haystack.includes(token)) score += 2;
  }
  if (item.tema.trim().toLowerCase().includes(topic)) score += 4;
  return score;
}

function bankItemToExamQuestion(
  item: QuestionBankItem,
  number: number,
): ExamQuestion {
  const alternatives = normalizeQuestionOptions(item.alternativas ?? []);
  const isMc =
    item.tipo === "multipla-escolha" ||
    item.tipo === "objetiva" ||
    alternatives.length >= 4;

  return {
    number,
    type: isMc ? "multipla-escolha" : "dissertativa",
    statement: trimTeachyStatement(item.enunciado),
    options: isMc ? alternatives : [],
    answer: String(item.respostaEsperada || item.criterioCorrecao || "").trim(),
  };
}

async function searchBankQuestions(input: {
  userId?: string | null;
  componente: string;
  anoSerie: string;
  tema: string;
  limit: number;
}): Promise<QuestionBankItem[]> {
  const filter = {
    componente: input.componente,
    anoSerie: input.anoSerie,
    query: input.tema,
    limit: Math.max(input.limit * 3, 30),
  };

  const pools: QuestionBankItem[] = [];

  if (input.userId) {
    pools.push(...(await listUserQuestions(input.userId, filter)));
    const schoolId = await getPrimarySchoolIdForUser(input.userId);
    if (schoolId) {
      pools.push(...(await listSchoolQuestions(schoolId, filter)));
    }
  }

  pools.push(...(await listCommunityQuestions(filter)));

  const seen = new Set<string>();
  const unique: QuestionBankItem[] = [];
  for (const item of pools) {
    const key = item.contentHash || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique
    .map((item) => ({ item, score: scoreBankMatch(item, input.tema) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, input.limit);
}

async function generateMissingQuestions(
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  existing: ExamQuestion[],
  missingCount: number,
): Promise<ExamQuestion[]> {
  if (missingCount <= 0) return [];

  const label = request.tipoMaterial === "lista" ? "exercício" : "questão";
  const prompt = [
    `Gere exatamente ${missingCount} ${label}(ões) novas sobre "${request.tema}".`,
    `Componente: ${request.componenteCurricular}. Ano/série: ${request.anoSerie}.`,
    "Não repita enunciados já usados:",
    ...existing.map((q) => `- ${q.statement.slice(0, 120)}`),
    "Múltipla escolha: 4 alternativas plausíveis sem prefixo a) b). Gabarito objetivo.",
    "Enunciado direto, no máximo 3 frases.",
  ].join("\n");

  const generated = await generateGeminiJSON<{ questions: ExamQuestion[] }>({
    systemInstruction:
      "Você gera questões escolares em JSON. Responda apenas com o schema solicitado.",
    prompt,
    cacheProfile: `material-engine:${request.tipoMaterial}`,
    tier: "default",
    temperature: 0.32,
    maxOutputTokens: 6000,
    responseSchema: PARTIAL_EXAM_SCHEMA,
  });

  const startNumber = existing.length + 1;
  return (generated.questions ?? []).slice(0, missingCount).map((question, index) => ({
    number: startNumber + index,
    type: question.type || "multipla-escolha",
    statement: trimTeachyStatement(String(question.statement || "")),
    options: normalizeQuestionOptions(
      Array.isArray(question.options)
        ? question.options.map((item) => String(item).trim()).filter(Boolean)
        : [],
    ),
    answer: String(question.answer || "").trim(),
  }));
}

export type ExamBankAssemblyResult =
  | {
      ok: true;
      html: string;
      estrutura: MaterialEngineResponse;
      pipeline: "bank" | "bank-hybrid";
      qualityScore: number;
      qualityIssues: string[];
      alertas?: string[];
    }
  | { ok: false; reason: "no_bank_hits" | "strict_bank_empty" };

export async function tryAssembleExamFromBank(
  input: MaterialEngineInput,
  options?: { userId?: string | null; strictBank?: boolean },
): Promise<ExamBankAssemblyResult> {
  const request = normalizeMaterialEngineRequest(input);
  if (request.tipoMaterial !== "lista" && request.tipoMaterial !== "prova") {
    return { ok: false, reason: "no_bank_hits" };
  }

  const target = parseTargetQuantity(request.quantidade);
  const bankItems = await searchBankQuestions({
    userId: options?.userId,
    componente: request.componenteCurricular,
    anoSerie: request.anoSerie,
    tema: request.tema,
    limit: target,
  });

  if (!bankItems.length) {
    return options?.strictBank
      ? { ok: false, reason: "strict_bank_empty" }
      : { ok: false, reason: "no_bank_hits" };
  }

  let questions: ExamQuestion[] = bankItems
    .slice(0, target)
    .map((item, index) => bankItemToExamQuestion(item, index + 1));

  const missing = target - questions.length;
  if (missing > 0) {
    const generated = await generateMissingQuestions(request, questions, missing);
    questions = [...questions, ...generated];
  }

  if (questions.length < Math.ceil(target * 0.5)) {
    return options?.strictBank
      ? { ok: false, reason: "strict_bank_empty" }
      : { ok: false, reason: "no_bank_hits" };
  }

  const estrutura: MaterialEngineResponse = {
    title: request.tema,
    subtitle: "",
    summary: "",
    sections: [],
    activities: [],
    answerKey: [],
    teacherNotes: [],
    exam: { questions },
  };

  let issues = getEngineOutputIssues(request, estrutura);
  let pipeline: "bank" | "bank-hybrid" = missing > 0 ? "bank-hybrid" : "bank";

  if (issues.length && missing === 0) {
    const { regenerateWeakExamQuestions } = await import("./exam-questions-retry");
    const repaired = await regenerateWeakExamQuestions(input, estrutura);
    issues = repaired.qualityIssues;
    const html = repaired.html;
    return {
      ok: true,
      html,
      estrutura: repaired.estrutura,
      pipeline: "bank-hybrid",
      qualityScore: repaired.qualityScore,
      qualityIssues: issues,
      alertas: [
        `Montado com ${questions.length} questões do banco Planify (modo rápido).`,
      ],
    };
  }

  const html = buildMaterialEngineHtmlFromStructure(input, estrutura);
  const qualityScore = computeQualityScore(issues);

  return {
    ok: true,
    html,
    estrutura,
    pipeline,
    qualityScore,
    qualityIssues: issues,
    alertas: [
      pipeline === "bank"
        ? `Lista montada do banco (${questions.length} itens) — entrega rápida.`
        : `Banco + IA completaram ${questions.length} itens.`,
    ],
  };
}

/** Modo banco estrito sem hits: não gera — retorna falha para UI sugerir modo IA. */
export async function generateExamStrictBankOnly(
  input: MaterialEngineInput,
  userId?: string | null,
) {
  return tryAssembleExamFromBank(input, { userId, strictBank: true });
}
