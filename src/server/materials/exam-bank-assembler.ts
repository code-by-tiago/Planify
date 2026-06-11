import { normalizeQuestionOptions, trimTeachyStatement } from "@/lib/materiais/material-document-layout";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import type { QuestionBankItem } from "@/types/question-bank";
import { generateGeminiJSON } from "../ai/gemini-client";
import {
  getQuestionsByIds,
  incrementUsageCount,
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

const WEAK_BANK_MATCH_THRESHOLD = 4;

function parseTargetQuantity(quantidade: number): number {
  return Math.min(20, Math.max(3, quantidade || 10));
}

function scoreBankMatch(
  item: QuestionBankItem,
  tema: string,
  componente: string,
): number {
  const topic = tema.trim().toLowerCase();
  const comp = componente.trim().toLowerCase();
  const haystack = [
    item.enunciado,
    item.textoApoio ?? "",
    item.tema,
    item.tags.join(" "),
    item.componente,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  if (comp && item.componente.toLowerCase().includes(comp)) score += 3;
  if (!topic) return Math.max(score, 1);

  for (const token of topic.split(/\s+/).filter((w) => w.length > 2)) {
    if (haystack.includes(token)) score += 2;
  }
  if (item.tema.trim().toLowerCase().includes(topic)) score += 4;
  return Math.max(score, topic ? 0 : 1);
}

function rankBankItems(
  items: QuestionBankItem[],
  tema: string,
  componente: string,
  minScore = 0,
): QuestionBankItem[] {
  return items
    .map((item) => ({
      item,
      score: scoreBankMatch(item, tema, componente),
    }))
    .filter((entry) => entry.score > minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.usageCount ?? 0) - (a.item.usageCount ?? 0);
    })
    .map((entry) => entry.item);
}

function buildExamStatement(item: QuestionBankItem): string {
  const stem = trimTeachyStatement(item.enunciado);
  const apoio = item.textoApoio?.trim();
  if (!apoio) return stem;
  return `Texto para leitura:\n${apoio}\n\n${stem}`;
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
    statement: buildExamStatement(item),
    options: isMc ? alternatives : [],
    answer: String(item.respostaEsperada || item.criterioCorrecao || "").trim(),
  };
}

async function collectBankPool(
  input: {
    userId?: string | null;
    componente?: string;
    anoSerie?: string;
    tema: string;
    limit: number;
  },
  tier: "strict" | "relaxed" | "community",
): Promise<QuestionBankItem[]> {
  const filter = {
    componente: tier === "community" ? undefined : input.componente,
    anoSerie: tier === "strict" ? input.anoSerie : undefined,
    query: tier === "community" ? undefined : input.tema,
    limit: Math.max(input.limit * 4, 60),
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

  const minScore = tier === "community" ? 0 : 1;
  return rankBankItems(
    unique,
    input.tema,
    input.componente || "",
    minScore,
  ).slice(0, input.limit);
}

function selectStrongBankItems(
  items: QuestionBankItem[],
  tema: string,
  componente: string,
  target: number,
): { selected: QuestionBankItem[]; weakSkipped: number } {
  const ranked = rankBankItems(items, tema, componente, 0);
  const selected: QuestionBankItem[] = [];
  let weakSkipped = 0;

  for (const item of ranked) {
    if (selected.length >= target) break;
    const score = scoreBankMatch(item, tema, componente);
    if (score < WEAK_BANK_MATCH_THRESHOLD) {
      weakSkipped++;
      continue;
    }
    selected.push(item);
  }

  return { selected, weakSkipped };
}

async function searchBankQuestions(input: {
  userId?: string | null;
  componente: string;
  anoSerie: string;
  tema: string;
  limit: number;
}): Promise<QuestionBankItem[]> {
  const tiers: Array<"strict" | "relaxed" | "community"> = [
    "strict",
    "relaxed",
    "community",
  ];

  for (const tier of tiers) {
    const hits = await collectBankPool(input, tier);
    if (hits.length >= Math.ceil(input.limit * 0.4)) {
      return hits.slice(0, input.limit);
    }
  }

  return collectBankPool(input, "community");
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
      pipeline: "bank" | "bank-hybrid" | "bank-selected";
      qualityScore: number;
      qualityIssues: string[];
      alertas?: string[];
      bankQuestionIds?: string[];
    }
  | { ok: false; reason: "no_bank_hits" | "strict_bank_empty" };

async function finalizeExamAssembly(
  input: MaterialEngineInput,
  request: ReturnType<typeof normalizeMaterialEngineRequest>,
  questions: ExamQuestion[],
  pipeline: "bank" | "bank-hybrid" | "bank-selected",
  alertas: string[],
  bankQuestionIds?: string[],
  repairIfNeeded = true,
): Promise<Exclude<ExamBankAssemblyResult, { ok: false }>> {
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

  if (issues.length && repairIfNeeded) {
    const { regenerateWeakExamQuestions } = await import("./exam-questions-retry");
    const repaired = await regenerateWeakExamQuestions(input, estrutura);
    return {
      ok: true,
      html: repaired.html,
      estrutura: repaired.estrutura,
      pipeline: pipeline === "bank-selected" ? "bank-selected" : "bank-hybrid",
      qualityScore: repaired.qualityScore,
      qualityIssues: repaired.qualityIssues,
      alertas,
      bankQuestionIds,
    };
  }

  const html = buildMaterialEngineHtmlFromStructure(input, estrutura);
  return {
    ok: true,
    html,
    estrutura,
    pipeline,
    qualityScore: computeQualityScore(issues),
    qualityIssues: issues,
    alertas,
    bankQuestionIds,
  };
}

export async function tryAssembleExamFromBank(
  input: MaterialEngineInput,
  options?: { userId?: string | null; strictBank?: boolean },
): Promise<ExamBankAssemblyResult> {
  const request = normalizeMaterialEngineRequest(input);
  if (request.tipoMaterial !== "lista" && request.tipoMaterial !== "prova") {
    return { ok: false, reason: "no_bank_hits" };
  }

  const target = parseTargetQuantity(request.quantidade);
  const bankPool = await searchBankQuestions({
    userId: options?.userId,
    componente: request.componenteCurricular,
    anoSerie: request.anoSerie,
    tema: request.tema,
    limit: Math.max(target * 3, 30),
  });

  if (!bankPool.length) {
    return options?.strictBank
      ? { ok: false, reason: "strict_bank_empty" }
      : { ok: false, reason: "no_bank_hits" };
  }

  const { selected: strongItems, weakSkipped } = selectStrongBankItems(
    bankPool,
    request.tema,
    request.componenteCurricular,
    target,
  );

  let questions: ExamQuestion[] = strongItems.map((item, index) =>
    bankItemToExamQuestion(item, index + 1),
  );

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

  const iaFilled = missing > 0;
  const pipeline: "bank" | "bank-hybrid" = iaFilled ? "bank-hybrid" : "bank";
  const usedIds = strongItems.map((item) => item.id);

  for (const id of usedIds) {
    void incrementUsageCount(id);
  }

  const alertas: string[] = [];
  if (pipeline === "bank") {
    alertas.push(
      `Lista montada do banco (${questions.length} itens) — entrega rápida.`,
    );
  } else {
    alertas.push(`Banco + IA completaram ${questions.length} itens.`);
    if (weakSkipped > 0) {
      alertas.push(
        `${weakSkipped} item(ns) do banco foram genéricos demais para o tema — IA preencheu as lacunas.`,
      );
    }
  }

  return finalizeExamAssembly(
    input,
    request,
    questions,
    pipeline,
    alertas,
    usedIds,
    !iaFilled,
  );
}

/** Teachy "Banco de questões" — monta a partir de IDs escolhidos pelo professor. */
export async function assembleExamFromQuestionIds(
  input: MaterialEngineInput,
  questionIds: string[],
): Promise<ExamBankAssemblyResult> {
  const request = normalizeMaterialEngineRequest(input);
  if (request.tipoMaterial !== "lista" && request.tipoMaterial !== "prova") {
    return { ok: false, reason: "no_bank_hits" };
  }

  const uniqueIds = [...new Set(questionIds.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) {
    return { ok: false, reason: "strict_bank_empty" };
  }

  const items = await getQuestionsByIds(uniqueIds);
  if (!items.length) {
    return { ok: false, reason: "strict_bank_empty" };
  }

  const questions = items.map((item, index) => bankItemToExamQuestion(item, index + 1));

  for (const id of items.map((item) => item.id)) {
    void incrementUsageCount(id);
  }

  return finalizeExamAssembly(
    input,
    request,
    questions,
    "bank-selected",
    [`${questions.length} questão(ões) selecionada(s) do banco Planify.`],
    items.map((item) => item.id),
  );
}

/** Modo banco estrito sem hits: não gera — retorna falha para UI sugerir modo IA. */
export async function generateExamStrictBankOnly(
  input: MaterialEngineInput,
  userId?: string | null,
) {
  return tryAssembleExamFromBank(input, { userId, strictBank: true });
}
