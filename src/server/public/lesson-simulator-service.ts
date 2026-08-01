<<<<<<< HEAD
import { getGeminiSdk } from "../ai/gemini-sdk";
import {
  buildLessonSimulatorPrompt,
  LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
  sanitizeLessonSimulatorTheme,
} from "../ai/prompts/lesson-simulator-prompt";

const MAX_THEME_LENGTH = 100;
const SIMULATOR_TIMEOUT_MS = 25_000;
=======
import {
  DEFAULT_MATERIAL_EDUCATION,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  normalizeMaterialEducation,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";
import { generateGeminiJSON } from "../ai/gemini-client";
import { suggestBnccByConteudos } from "../bncc/bncc-suggestion-engine";
import {
  buildLessonSimulatorPrompt,
  LESSON_SIMULATOR_RESPONSE_SCHEMA,
  LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
  sanitizeLessonSimulatorTheme,
} from "../ai/prompts/lesson-simulator-prompt";
import { buildLessonSimulatorListaHtml } from "./lesson-simulator-html";
import { renderLessonSimulatorPdf } from "./lesson-simulator-pdf";

const MAX_THEME_LENGTH = 100;
const SIMULATOR_TIMEOUT_MS = 55_000;
const MIN_QUESTIONS = 10;
const MAX_QUESTIONS = 10;
const MIN_MC_OPTIONS = 5;
const MAX_MC_OPTIONS = 8;

export type LessonSimulatorQuestionType =
  | "multipla-escolha"
  | "verdadeiro-falso"
  | "complete"
  | "responda";

export type LessonSimulatorQuestion = {
  number: number;
  type: LessonSimulatorQuestionType;
  statement: string;
  options?: string[];
};

export type LessonSimulatorAnswer = {
  number: number;
  answer: string;
};

export type LessonSimulatorLista = {
  title: string;
  componenteCurricular: string;
  anoSerie: string;
  etapa: string;
  areaConhecimento?: string;
  instructions: string;
  bnccHint: string;
  questions: LessonSimulatorQuestion[];
  answerKey: LessonSimulatorAnswer[];
};

export type LessonSimulatorResult = {
  lista: LessonSimulatorLista;
  html: string;
  pdfBase64: string;
  filename: string;
};
>>>>>>> origin/aplicar-melhorias-na-producao

export type LessonSimulatorErrorCode =
  | "generation_failed"
  | "empty_response"
<<<<<<< HEAD
  | "timeout";
=======
  | "timeout"
  | "invalid_payload"
  | "pdf_failed";
>>>>>>> origin/aplicar-melhorias-na-producao

export class LessonSimulatorError extends Error {
  readonly code: LessonSimulatorErrorCode;

  constructor(code: LessonSimulatorErrorCode) {
    super(code);
    this.name = "LessonSimulatorError";
    this.code = code;
  }
}

export function validateLessonSimulatorTheme(theme: unknown): string | null {
  if (typeof theme !== "string") {
    return "Informe um tema de aula.";
  }

  const trimmed = theme.trim();

  if (!trimmed) {
    return "Informe um tema de aula.";
  }

  if (trimmed.length > MAX_THEME_LENGTH) {
    return `O tema deve ter no máximo ${MAX_THEME_LENGTH} caracteres.`;
  }

  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    return "O tema contém caracteres inválidos.";
  }

  return null;
}

<<<<<<< HEAD
export async function generateLessonSimulatorSkeleton(theme: string): Promise<string> {
=======
function asCleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : fallback;
}

/** Valida e normaliza os campos de educação contra o catálogo estático do produto. */
export function validateLessonSimulatorEducation(
  input: Partial<MaterialEducationFields> | null | undefined,
): { ok: true; education: MaterialEducationFields } | { ok: false; message: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "Informe etapa, ano/série, área e disciplina." };
  }

  const etapa = asCleanString(input.etapa);
  const anoSerie = asCleanString(input.anoSerie);
  const areaConhecimento = asCleanString(input.areaConhecimento);
  const componente = asCleanString(input.componente);

  if (!etapa || !anoSerie || !areaConhecimento || !componente) {
    return { ok: false, message: "Informe etapa, ano/série, área e disciplina." };
  }

  const years = getYearOptions(etapa);
  if (!years.includes(anoSerie)) {
    return { ok: false, message: "Ano/série inválido para a etapa selecionada." };
  }

  const areas = getAreaOptions(etapa);
  if (!areas.includes(areaConhecimento)) {
    return { ok: false, message: "Área do conhecimento inválida para a etapa selecionada." };
  }

  const components = getComponentOptions(etapa, areaConhecimento);
  if (!components.includes(componente)) {
    return {
      ok: false,
      message: "Disciplina/componente inválido para a área selecionada.",
    };
  }

  return {
    ok: true,
    education: normalizeMaterialEducation(DEFAULT_MATERIAL_EDUCATION, {
      etapa,
      anoSerie,
      areaConhecimento,
      componente,
    }),
  };
}

function normalizeQuestionType(value: unknown): LessonSimulatorQuestionType {
  const raw = asCleanString(value).toLowerCase();
  if (raw === "multipla-escolha" || raw === "múltipla escolha" || raw === "multipla escolha") {
    return "multipla-escolha";
  }
  if (raw === "verdadeiro-falso" || raw === "verdadeiro ou falso" || raw === "v/f") {
    return "verdadeiro-falso";
  }
  if (raw === "complete" || raw === "completar" || raw === "complete as lacunas") {
    return "complete";
  }
  return "responda";
}

function normalizeLista(
  raw: Partial<LessonSimulatorLista>,
  theme: string,
  education: MaterialEducationFields,
  verifiedBnccHint: string,
): LessonSimulatorLista {
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const answersRaw = Array.isArray(raw.answerKey) ? raw.answerKey : [];

  const questions = questionsRaw
    .map((item, index) => {
      const type = normalizeQuestionType(item?.type);
      const statement = asCleanString(item?.statement);
      if (!statement) return null;

      const options = Array.isArray(item?.options)
        ? item.options.map((option) => asCleanString(option)).filter(Boolean)
        : [];

      if (type === "verdadeiro-falso") {
        return {
          number:
            typeof item?.number === "number" && Number.isFinite(item.number)
              ? item.number
              : index + 1,
          type,
          statement,
          options: (options.length >= 2 ? options : ["Verdadeiro", "Falso"]).slice(0, 2),
        } satisfies LessonSimulatorQuestion;
      }

      if (type === "multipla-escolha") {
        const mcOptions = options.slice(0, MAX_MC_OPTIONS);
        if (mcOptions.length < MIN_MC_OPTIONS) {
          return null;
        }

        return {
          number:
            typeof item?.number === "number" && Number.isFinite(item.number)
              ? item.number
              : index + 1,
          type,
          statement,
          options: mcOptions,
        } satisfies LessonSimulatorQuestion;
      }

      return {
        number:
          typeof item?.number === "number" && Number.isFinite(item.number)
            ? item.number
            : index + 1,
        type,
        statement,
        options: undefined,
      } satisfies LessonSimulatorQuestion;
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .slice(0, MAX_QUESTIONS)
    .map((item, index): LessonSimulatorQuestion => ({ ...item, number: index + 1 }));

  if (questions.length < MIN_QUESTIONS) {
    throw new LessonSimulatorError("invalid_payload");
  }

  const answerMap = new Map<number, string>();
  for (const entry of answersRaw) {
    const number =
      typeof entry?.number === "number" && Number.isFinite(entry.number)
        ? entry.number
        : NaN;
    const answer = asCleanString(entry?.answer);
    if (Number.isFinite(number) && answer) {
      answerMap.set(number, answer);
    }
  }

  const answerKey = questions.map((question) => ({
    number: question.number,
    answer: answerMap.get(question.number) || "Ver enunciado / resposta esperada pelo professor.",
  }));

  return {
    title: asCleanString(raw.title, `Lista de atividades — ${theme}`),
    // Sempre preferir o contexto escolhido pelo professor (fonte da verdade).
    componenteCurricular: education.componente,
    anoSerie: education.anoSerie,
    etapa: education.etapa,
    areaConhecimento: education.areaConhecimento,
    instructions: asCleanString(
      raw.instructions,
      "Leia com atenção e responda às atividades a seguir.",
    ),
    bnccHint: verifiedBnccHint,
    questions,
    answerKey,
  };
}

async function resolveVerifiedBnccHint(
  theme: string,
  education: MaterialEducationFields,
): Promise<string> {
  try {
    const suggestion = await suggestBnccByConteudos({
      etapa: education.etapa,
      anoSerie: education.anoSerie,
      areaConhecimento: education.areaConhecimento,
      componenteCurricular: education.componente,
      tema: theme,
      conteudos: theme,
    });

    const skills = (suggestion.habilidades || []).slice(0, 3);
    if (skills.length === 0) {
      return "Consulte o catálogo BNCC para habilidades deste tema.";
    }

    return skills
      .map((skill) => `${skill.codigo} — ${skill.descricao}`)
      .join("; ");
  } catch {
    return "Habilidade BNCC sugerida conforme o tema.";
  }
}

export async function generateLessonSimulatorLista(
  theme: string,
  educationInput?: Partial<MaterialEducationFields>,
): Promise<LessonSimulatorResult> {
>>>>>>> origin/aplicar-melhorias-na-producao
  const safeTheme = sanitizeLessonSimulatorTheme(theme.trim());

  if (!safeTheme) {
    throw new LessonSimulatorError("generation_failed");
  }

<<<<<<< HEAD
  const generatePromise = getGeminiSdk().models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildLessonSimulatorPrompt(safeTheme),
    config: {
      systemInstruction: LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new LessonSimulatorError("timeout"));
    }, SIMULATOR_TIMEOUT_MS);
  });

  try {
    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text?.trim();

    if (!text) {
      throw new LessonSimulatorError("empty_response");
    }

    return text;
  } catch (error) {
    if (error instanceof LessonSimulatorError) {
      throw error;
    }

    throw new LessonSimulatorError("generation_failed");
  }
=======
  const educationResult = validateLessonSimulatorEducation(
    educationInput ?? DEFAULT_MATERIAL_EDUCATION,
  );
  if (!educationResult.ok) {
    throw new LessonSimulatorError("invalid_payload");
  }
  const education = educationResult.education;
  const verifiedBnccHint = await resolveVerifiedBnccHint(safeTheme, education);

  let raw: Partial<LessonSimulatorLista>;

  try {
    raw = await generateGeminiJSON<Partial<LessonSimulatorLista>>({
      prompt: buildLessonSimulatorPrompt(safeTheme, education, verifiedBnccHint),
      systemInstruction: LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
      responseSchema: LESSON_SIMULATOR_RESPONSE_SCHEMA,
      temperature: 0.35,
      maxOutputTokens: 8192,
      timeoutMs: SIMULATOR_TIMEOUT_MS,
      tier: "default",
    });
  } catch (error) {
    if (error instanceof LessonSimulatorError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (/timeout|aborted|AbortError/i.test(message)) {
      throw new LessonSimulatorError("timeout");
    }
    throw new LessonSimulatorError("generation_failed");
  }

  const lista = normalizeLista(raw, safeTheme, education, verifiedBnccHint);
  const html = buildLessonSimulatorListaHtml(lista, safeTheme);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderLessonSimulatorPdf(lista.title, html);
  } catch (error) {
    console.error("[lesson-simulator] pdf failed:", error);
    throw new LessonSimulatorError("pdf_failed");
  }

  const safeFilename = lista.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();

  return {
    lista,
    html,
    pdfBase64: pdfBuffer.toString("base64"),
    filename: `${safeFilename || "lista-de-atividades-planify"}.pdf`,
  };
}

/** @deprecated Use generateLessonSimulatorLista — kept for older callers during transition. */
export async function generateLessonSimulatorSkeleton(theme: string): Promise<string> {
  const result = await generateLessonSimulatorLista(theme);
  return result.lista.title;
>>>>>>> origin/aplicar-melhorias-na-producao
}
