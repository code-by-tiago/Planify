import { getGeminiSdk } from "../ai/gemini-sdk";
import {
  buildLessonSimulatorPrompt,
  LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
  sanitizeLessonSimulatorTheme,
} from "../ai/prompts/lesson-simulator-prompt";

const MAX_THEME_LENGTH = 100;
const SIMULATOR_TIMEOUT_MS = 25_000;

export type LessonSimulatorErrorCode =
  | "generation_failed"
  | "empty_response"
  | "timeout";

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

export async function generateLessonSimulatorSkeleton(theme: string): Promise<string> {
  const safeTheme = sanitizeLessonSimulatorTheme(theme.trim());

  if (!safeTheme) {
    throw new LessonSimulatorError("generation_failed");
  }

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
}
