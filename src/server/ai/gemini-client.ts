/**
 * Cliente de IA do Planify — uso exclusivo do servidor.
 *
 * - Lê GEMINI_API_KEY somente aqui. Nunca exposta ao frontend.
 * - Gemini 2.5 Flash é o modelo padrão para a maioria das ferramentas.
 * - Gemini 2.5 Pro fica preparado para tarefas avançadas via tier "advanced".
 * - A interface do professor nunca exibe nomes de modelos ou referências à IA subjacente.
 */

import type { AIModelTier } from "../../lib/ai/aiConfig";
import type { GeminiGenerateJSONOptions } from "../../types/ai";
import { getPlatformSettingsSync } from "../admin/platform-settings-service";
import { resolveGeminiCachedContentName } from "./gemini-context-cache";
import { getGeminiSdk } from "./gemini-sdk";
import {
  resolveGeminiCacheBundle,
  type GeminiCacheProfile,
} from "./gemini-static-context";

type GeminiCallResult = {
  text: string;
  httpStatus: number;
  error?: { message: string };
};

/** Modelos legados descontinuados — normaliza para equivalentes atuais. */
const LEGACY_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-pro",
  "gemini-1.5-pro-latest": "gemini-2.5-pro",
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-001": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash",
  "gemini-2.0-flash-lite-001": "gemini-2.5-flash",
};

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

const ADVANCED_MODEL_FALLBACKS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
] as const;

function normalizeModelName(model: string): string {
  const trimmed = model.trim();
  return LEGACY_MODEL_MAP[trimmed] ?? trimmed;
}

/**
 * Resolve o nome do modelo a partir do tier solicitado.
 *
 * Cadeia de fallback (retrocompatibilidade preservada):
 *   tier "advanced" → GEMINI_MODEL_ADVANCED → "gemini-2.5-pro"
 *   tier "default"  → GEMINI_MODEL_DEFAULT  → GEMINI_MODEL (legado) → "gemini-2.5-flash"
 *   model literal   → valor passado diretamente (uso legado)
 */
function resolveModel(
  tier?: AIModelTier,
  legacyModel?: string,
): string {
  if (tier === "advanced") {
    return normalizeModelName(
      process.env.GEMINI_MODEL_ADVANCED ?? "gemini-2.5-pro",
    );
  }

  if (legacyModel) {
    return normalizeModelName(legacyModel);
  }

  const settingsModel = getPlatformSettingsSync().defaultAiModel;
  const fromEnv =
    settingsModel ||
    process.env.GEMINI_MODEL_DEFAULT ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

  return normalizeModelName(fromEnv);
}

function resolveModelCandidates(
  tier?: AIModelTier,
  legacyModel?: string,
): string[] {
  const primary = resolveModel(tier, legacyModel);
  const pool =
    tier === "advanced"
      ? [...ADVANCED_MODEL_FALLBACKS]
      : [...DEFAULT_MODEL_FALLBACKS];

  return [...new Set([primary, ...pool])];
}

export function isGeminiQuotaError(message: string, status = 0): boolean {
  return (
    status === 429 ||
    /quota exceeded|rate limit|resource exhausted|too many requests/i.test(
      message,
    )
  );
}

export function isGeminiModelUnavailableError(
  message: string,
  status = 0,
): boolean {
  return (
    status === 404 ||
    /no longer available|not found|NOT_FOUND|model.*not.*supported/i.test(
      message,
    )
  );
}

export function isGeminiTransientOverloadError(
  message: string,
  status = 0,
): boolean {
  return (
    status === 503 ||
    /high demand|temporarily unavailable|UNAVAILABLE|overloaded|try again later/i.test(
      message,
    )
  );
}

export function humanizeGeminiError(message: string): string {
  if (isGeminiQuotaError(message)) {
    const retry = message.match(/retry in ([\d.]+)s/i);
    const wait = retry ? ` Aguarde cerca de ${Math.ceil(parseFloat(retry[1]))} segundos` : "";

    return (
      `Limite de uso da IA atingido neste minuto.${wait} e tente de novo. ` +
      "Se o problema continuar, habilite faturação no Google AI Studio ou use uma chave com cota maior."
    );
  }

  if (isGeminiTransientOverloadError(message)) {
    return (
      "A IA está com alta demanda no momento. Aguarde alguns segundos e tente novamente. " +
      "Se persistir, o sistema tentará automaticamente um modelo alternativo."
    );
  }

  if (/GEMINI_API_KEY/i.test(message)) {
    return "Chave GEMINI_API_KEY ausente ou inválida no servidor.";
  }

  if (
    /API key not valid|API_KEY_INVALID|invalid api key|permission denied|unauthorized|invalid authentication credentials|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(
      message,
    )
  ) {
    return (
      "Chave GEMINI_API_KEY rejeitada pelo Google. No AI Studio, use o botão Copiar na chave (formato AQ. ou AIza), cole sem espaços na Vercel, confira restrições da chave e faça redeploy."
    );
  }

  return message;
}

function parseRetryDelayMs(message: string, attempt = 0): number {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 800;
  }
  if (isGeminiTransientOverloadError(message)) {
    return 2500 + attempt * 2000;
  }
  return 4000;
}

const MAX_RETRIES_PER_MODEL = 3;

function shouldRetryGeminiCall(message: string, status: number): boolean {
  return (
    isGeminiQuotaError(message, status) ||
    isGeminiTransientOverloadError(message, status)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// Utilitários internos
// ---------------------------------------------------------------------------

function stripJsonFence(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Chamadas à API
// ---------------------------------------------------------------------------

/**
 * Gera uma resposta JSON estruturada via IA.
 * Usar para materiais com schema definido (planejamentos, materiais avançados).
 */
type GenerateContentPlan = {
  contents: string;
  config: Record<string, unknown>;
};

async function buildGeneratePlan(
  options: {
    systemInstruction: string;
    prompt: string;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseSchema?: unknown;
    responseMimeType?: string;
    cacheProfile?: GeminiCacheProfile;
    tier?: AIModelTier;
    model?: string;
  },
  model: string,
): Promise<GenerateContentPlan> {
  const config: Record<string, unknown> = {
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.8,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  if (options.responseMimeType) {
    config.responseMimeType = options.responseMimeType;
  }

  if (options.responseSchema) {
    config.responseSchema = options.responseSchema;
  }

  if (options.cacheProfile) {
    const bundle = resolveGeminiCacheBundle(options.cacheProfile);

    if (bundle) {
      const cachedContent = await resolveGeminiCachedContentName(
        options.cacheProfile,
        model,
        bundle,
      );

      if (cachedContent) {
        return {
          contents: options.prompt,
          config: {
            ...config,
            cachedContent,
          },
        };
      }

      const mergedPrompt = bundle.staticContext
        ? `${bundle.staticContext}\n\n${options.prompt}`
        : options.prompt;

      return {
        contents: mergedPrompt,
        config: {
          ...config,
          systemInstruction: bundle.systemInstruction,
        },
      };
    }
  }

  return {
    contents: options.prompt,
    config: {
      ...config,
      systemInstruction: options.systemInstruction,
    },
  };
}

async function callGeminiGenerateContent(
  model: string,
  plan: GenerateContentPlan,
): Promise<GeminiCallResult> {
  try {
    const response = await getGeminiSdk().models.generateContent({
      model,
      contents: plan.contents,
      config: plan.config,
    });

    const text = response.text?.trim() ?? "";

    if (!text) {
      return {
        text: "",
        httpStatus: 502,
        error: { message: "A IA não retornou conteúdo textual." },
      };
    }

    return { text, httpStatus: 200 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao chamar a IA.";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? Number((error as { status: number }).status)
        : 500;

    return {
      text: "",
      httpStatus: status,
      error: { message },
    };
  }
}

export async function generateGeminiJSON<T>(
  options: GeminiGenerateJSONOptions,
): Promise<T> {
  const models = resolveModelCandidates(options.tier, options.model);

  let lastError = "Erro ao chamar a IA.";

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt += 1) {
      const plan = await buildGeneratePlan(
        {
          ...options,
          responseMimeType: "application/json",
        },
        model,
      );
      const json = await callGeminiGenerateContent(model, plan);

      if (json.httpStatus >= 200 && json.httpStatus < 300 && !json.error) {
        const cleaned = stripJsonFence(json.text);

        try {
          return JSON.parse(cleaned) as T;
        } catch {
          throw new Error("A IA retornou um JSON inválido.");
        }
      }

      const message =
        json.error?.message ??
        `Erro ao chamar a IA. Status HTTP: ${json.httpStatus}`;

      lastError = message;

      if (isGeminiModelUnavailableError(message, json.httpStatus)) {
        break;
      }

      if (
        shouldRetryGeminiCall(message, json.httpStatus) &&
        attempt < MAX_RETRIES_PER_MODEL - 1
      ) {
        await sleep(parseRetryDelayMs(message, attempt));
        continue;
      }

      break;
    }
  }

  throw new Error(humanizeGeminiError(lastError));
}

/**
 * Gera conteúdo em texto livre (HTML, Markdown, etc.) via IA.
 * Usar para materiais didáticos com saída em HTML estruturado.
 */
export async function generateGeminiText(options: {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  tier?: AIModelTier;
  model?: string;
  cacheProfile?: GeminiCacheProfile;
}): Promise<string> {
  const models = resolveModelCandidates(options.tier, options.model);

  let lastError = "Erro ao chamar a IA.";

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt += 1) {
      const plan = await buildGeneratePlan(
        {
          ...options,
          temperature: options.temperature ?? 0.5,
          topP: options.topP ?? 0.9,
        },
        model,
      );
      const json = await callGeminiGenerateContent(model, plan);

      if (json.httpStatus >= 200 && json.httpStatus < 300 && !json.error) {
        return json.text;
      }

      const message =
        json.error?.message ??
        `Erro ao chamar a IA. Status HTTP: ${json.httpStatus}`;

      lastError = message;

      if (isGeminiModelUnavailableError(message, json.httpStatus)) {
        break;
      }

      if (
        shouldRetryGeminiCall(message, json.httpStatus) &&
        attempt < MAX_RETRIES_PER_MODEL - 1
      ) {
        await sleep(parseRetryDelayMs(message, attempt));
        continue;
      }

      break;
    }
  }

  throw new Error(humanizeGeminiError(lastError));
}
