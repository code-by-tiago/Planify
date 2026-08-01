/**
 * Cliente Google Gen AI (@google/genai) — JSON estruturado para pipeline do banco de questões.
 */

import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

/** Schema ETAPA 1 — questão gerada */
export const GENERATOR_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    enunciado: { type: "STRING" },
    texto_apoio: { type: "STRING", nullable: true },
    alternativas: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    gabarito: {
      type: "STRING",
      enum: ["A", "B", "C", "D", "E"],
    },
    justificativa: { type: "STRING" },
    componente: { type: "STRING" },
    anoSerie: { type: "STRING" },
    tema: { type: "STRING" },
    tags: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    bncc_codigos: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: [
    "enunciado",
    "alternativas",
    "gabarito",
    "justificativa",
    "componente",
    "anoSerie",
    "tema",
    "tags",
  ],
};

/** Schema ETAPA 2 — avaliação do revisor */
export const REVIEWER_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    aprovado: { type: "BOOLEAN" },
    nota: { type: "NUMBER" },
    motivo: { type: "STRING" },
  },
  required: ["aprovado", "nota", "motivo"],
};

/**
 * @returns {string}
 */
export function getDefaultGeminiModel() {
  return DEFAULT_MODEL;
}

/**
 * @param {string} [apiKey]
 * @returns {GoogleGenAI}
 */
export function createGeminiClient(apiKey) {
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("Defina GEMINI_API_KEY no .env.local");
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * @param {number} attempt
 */
function backoffMs(attempt) {
  const base = Math.min(30_000, 1000 * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 400);
  return base + jitter;
}

/**
 * @param {string} message
 * @param {number} attempt
 */
function parseRetryDelayMs(message, attempt) {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 800;
  }
  if (/high demand|temporarily unavailable|UNAVAILABLE|overloaded/i.test(message)) {
    return 2500 + attempt * 2000;
  }
  return backoffMs(attempt);
}

/**
 * @param {unknown} error
 */
function isRetryableError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 0;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /quota|rate limit|resource exhausted|too many requests|overloaded|UNAVAILABLE|high demand/i.test(
      message,
    )
  );
}

/**
 * @param {string} raw
 */
export function parseJsonFromModel(raw) {
  const trimmed = String(raw || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Resposta do modelo não é JSON válido.");
  }
}

/**
 * @param {{
 *   client: GoogleGenAI;
 *   systemInstruction: string;
 *   prompt: string;
 *   schema?: object;
 *   temperature?: number;
 *   model?: string;
 *   maxRetries?: number;
 *   log?: (msg: string) => void;
 * }} opts
 */
export async function callGeminiJson(opts) {
  const {
    client,
    systemInstruction,
    prompt,
    schema,
    temperature = 0.4,
    model = DEFAULT_MODEL,
    maxRetries = 5,
    log = () => {},
  } = opts;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const config = {
        systemInstruction,
        temperature,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      };

      if (schema) {
        config.responseSchema = schema;
      }

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error("Gemini retornou resposta vazia.");
      }

      return parseJsonFromModel(text);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        const message = error instanceof Error ? error.message : String(error);
        const wait = parseRetryDelayMs(message, attempt);
        log(`Rate limit/erro Gemini — retry ${attempt + 1}/${maxRetries} em ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (attempt < maxRetries && !(error instanceof SyntaxError)) {
        const wait = backoffMs(attempt);
        log(`Falha na chamada Gemini — retry ${attempt + 1}/${maxRetries} em ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Falha Gemini após retries.");
}
