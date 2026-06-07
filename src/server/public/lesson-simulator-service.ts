import { generateGeminiText } from "../ai/gemini-client";
import {
  buildLessonSimulatorPrompt,
  LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
} from "../ai/prompts/lesson-simulator-prompt";

const MAX_THEME_LENGTH = 100;

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

  return null;
}

export async function generateLessonSimulatorSkeleton(theme: string): Promise<string> {
  return generateGeminiText({
    model: "gemini-2.5-flash",
    systemInstruction: LESSON_SIMULATOR_SYSTEM_INSTRUCTION,
    prompt: buildLessonSimulatorPrompt(theme.trim()),
    temperature: 0.3,
    maxOutputTokens: 300,
  });
}
