/**
 * Middleware base de IA Planify — JSON strict + DNA pedagógico.
 * Uso: geração de materiais. NÃO usar em planejamento anual/trimestral.
 */

import { z } from "zod";
import type { AIModelTier } from "@/lib/ai/aiConfig";
import { generateGeminiJSON } from "@/server/ai/gemini-client";
import { withPlanifyPedagogicalDna } from "@/server/ai/prompts/planify-pedagogical-dna";
import type { GeminiCacheProfile } from "@/server/ai/gemini-static-context";

export type PlanifyAiJsonOptions<T> = {
  /** Identificador da ferramenta (telemetria / cache). */
  toolId: string;
  systemInstruction: string;
  prompt: string;
  /** Schema Gemini nativo (responseSchema). */
  responseSchema: unknown;
  /** Validação tipada pós-parse. */
  zodSchema: z.ZodType<T>;
  tier?: AIModelTier;
  cacheProfile?: GeminiCacheProfile;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  /** Retries extras só para falha de schema Zod (além dos maxAttempts do Gemini). */
  schemaRetryAttempts?: number;
};

export type PlanifyAiJsonSuccess<T> = {
  ok: true;
  data: T;
  schemaRetries: number;
};

export type PlanifyAiJsonFailure = {
  ok: false;
  message: string;
  issues: string[];
};

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 8).map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

function buildSchemaRepairPrompt(basePrompt: string, issues: string[]): string {
  return `${basePrompt}

CORREÇÃO ESTRUTURAL OBRIGATÓRIA:
O JSON anterior violou o schema. Reescreva o objeto COMPLETO corrigindo:
${issues.map((item) => `- ${item}`).join("\n")}
Responda SOMENTE com JSON válido no schema — sem markdown.`;
}

/**
 * Garante: DNA pedagógico + JSON Gemini + validação Zod (+ 1 retry estrutural).
 */
export async function runPlanifyAiJson<T>(
  options: PlanifyAiJsonOptions<T>,
): Promise<PlanifyAiJsonSuccess<T> | PlanifyAiJsonFailure> {
  const schemaRetriesMax = Math.max(0, options.schemaRetryAttempts ?? 1);
  let activePrompt = options.prompt;
  let schemaRetries = 0;
  let lastIssues: string[] = [];

  const systemInstruction = withPlanifyPedagogicalDna(options.systemInstruction);

  for (let attempt = 0; attempt <= schemaRetriesMax; attempt += 1) {
    const raw = await generateGeminiJSON<unknown>({
      systemInstruction,
      prompt: activePrompt,
      cacheProfile: options.cacheProfile,
      tier: options.tier,
      temperature: options.temperature,
      topP: options.topP,
      maxOutputTokens: options.maxOutputTokens,
      responseSchema: options.responseSchema,
      timeoutMs: options.timeoutMs,
      maxAttempts: options.maxAttempts,
    });

    const parsed = options.zodSchema.safeParse(raw);
    if (parsed.success) {
      return { ok: true, data: parsed.data, schemaRetries };
    }

    lastIssues = formatZodIssues(parsed.error);
    if (attempt >= schemaRetriesMax) break;

    schemaRetries += 1;
    activePrompt = buildSchemaRepairPrompt(options.prompt, lastIssues);
  }

  return {
    ok: false,
    message: `A IA retornou JSON fora do contrato (${options.toolId}).`,
    issues: lastIssues,
  };
}
