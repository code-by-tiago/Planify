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
import { resolveGeminiCachedContentName } from "./gemini-context-cache";
import {
  resolveGeminiCacheBundle,
  type GeminiCacheProfile,
} from "./gemini-static-context";

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

// ---------------------------------------------------------------------------
// Resolução segura de credenciais — somente no servidor
// ---------------------------------------------------------------------------

function getAIApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no servidor. " +
        "Adicione a variável ao .env.local.",
    );
  }

  if (!apiKey.startsWith("AIza")) {
    console.warn(
      "[gemini] GEMINI_API_KEY não usa o prefixo AIza do Google AI Studio. Se a IA falhar, gere uma chave em https://aistudio.google.com/apikey",
    );
  }

  return apiKey;
}

/** Modelos 1.5 foram descontinuados no free tier — normaliza para 2.5. */
const LEGACY_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-pro",
  "gemini-1.5-pro-latest": "gemini-2.5-pro",
};

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
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

  const fromEnv =
    process.env.GEMINI_MODEL_DEFAULT ??
    process.env.GEMINI_MODEL ??
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

export function humanizeGeminiError(message: string): string {
  if (isGeminiQuotaError(message)) {
    const retry = message.match(/retry in ([\d.]+)s/i);
    const wait = retry ? ` Aguarde cerca de ${Math.ceil(parseFloat(retry[1]))} segundos` : "";

    return (
      `Limite de uso da IA atingido neste minuto.${wait} e tente de novo. ` +
      "Se o problema continuar, habilite faturação no Google AI Studio ou use uma chave com cota maior."
    );
  }

  if (/GEMINI_API_KEY/i.test(message)) {
    return "Chave GEMINI_API_KEY ausente ou inválida no servidor.";
  }

  if (/API key not valid|API_KEY_INVALID|invalid api key|permission denied|unauthorized/i.test(message)) {
    return "Chave GEMINI_API_KEY rejeitada pelo Google. Gere uma nova em Google AI Studio (https://aistudio.google.com/apikey), confira a faturação do projeto e redeploy na Vercel.";
  }

  return message;
}

function parseRetryDelayMs(message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 800;
  }
  return 4000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// Utilitários internos
// ---------------------------------------------------------------------------

function extractTextFromResponse(response: GeminiResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("A IA não retornou conteúdo textual.");
  }

  return text;
}

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
async function buildGenerateBody(
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
): Promise<Record<string, unknown>> {
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.8,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
  };

  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }

  if (options.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
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
          cachedContent,
          contents: [
            {
              role: "user",
              parts: [{ text: options.prompt }],
            },
          ],
          generationConfig,
        };
      }

      const mergedPrompt = bundle.staticContext
        ? `${bundle.staticContext}\n\n${options.prompt}`
        : options.prompt;

      return {
        systemInstruction: {
          parts: [{ text: bundle.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: mergedPrompt }],
          },
        ],
        generationConfig,
      };
    }
  }

  return {
    systemInstruction: {
      parts: [{ text: options.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig,
  };
}

async function callGeminiGenerateContent(
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
): Promise<GeminiResponse & { httpStatus: number }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as GeminiResponse;

  return { ...json, httpStatus: response.status };
}

export async function generateGeminiJSON<T>(
  options: GeminiGenerateJSONOptions,
): Promise<T> {
  const apiKey = getAIApiKey();
  const models = resolveModelCandidates(options.tier, options.model);

  let lastError = "Erro ao chamar a IA.";

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const body = await buildGenerateBody(
        {
          ...options,
          responseMimeType: "application/json",
        },
        model,
      );
      const json = await callGeminiGenerateContent(apiKey, model, body);

      if (json.httpStatus >= 200 && json.httpStatus < 300 && !json.error) {
        const text = extractTextFromResponse(json);
        const cleaned = stripJsonFence(text);

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

      if (!isGeminiQuotaError(message, json.httpStatus)) {
        break;
      }

      if (attempt === 0) {
        await sleep(parseRetryDelayMs(message));
        continue;
      }
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
  const apiKey = getAIApiKey();
  const models = resolveModelCandidates(options.tier, options.model);

  let lastError = "Erro ao chamar a IA.";

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const body = await buildGenerateBody(
        {
          ...options,
          temperature: options.temperature ?? 0.5,
          topP: options.topP ?? 0.9,
        },
        model,
      );
      const json = await callGeminiGenerateContent(apiKey, model, body);

      if (json.httpStatus >= 200 && json.httpStatus < 300 && !json.error) {
        return extractTextFromResponse(json);
      }

      const message =
        json.error?.message ??
        `Erro ao chamar a IA. Status HTTP: ${json.httpStatus}`;

      lastError = message;

      if (!isGeminiQuotaError(message, json.httpStatus)) {
        break;
      }

      if (attempt === 0) {
        await sleep(parseRetryDelayMs(message));
        continue;
      }
    }
  }

  throw new Error(humanizeGeminiError(lastError));
}
