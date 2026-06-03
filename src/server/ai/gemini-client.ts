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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no servidor. " +
        "Adicione a variável ao .env.local.",
    );
  }

  return apiKey;
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
    return (
      process.env.GEMINI_MODEL_ADVANCED ??
      "gemini-2.5-pro"
    );
  }

  if (legacyModel) {
    return legacyModel;
  }

  return (
    process.env.GEMINI_MODEL_DEFAULT ??
    process.env.GEMINI_MODEL ??
    "gemini-2.5-flash"
  );
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
export async function generateGeminiJSON<T>(
  options: GeminiGenerateJSONOptions,
): Promise<T> {
  const apiKey = getAIApiKey();
  const model = resolveModel(options.tier, options.model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: options.systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: options.prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        topP: options.topP ?? 0.8,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
        responseMimeType: "application/json",
        ...(options.responseSchema
          ? { responseSchema: options.responseSchema }
          : {}),
      },
    }),
  });

  const json = (await response.json()) as GeminiResponse;

  if (!response.ok || json.error) {
    throw new Error(
      json.error?.message ??
        `Erro ao chamar a IA. Status HTTP: ${response.status}`,
    );
  }

  const text = extractTextFromResponse(json);
  const cleaned = stripJsonFence(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("A IA retornou um JSON inválido.");
  }
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
}): Promise<string> {
  const apiKey = getAIApiKey();
  const model = resolveModel(options.tier, options.model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: options.systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: options.prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.5,
        topP: options.topP ?? 0.9,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
      },
    }),
  });

  const json = (await response.json()) as GeminiResponse;

  if (!response.ok || json.error) {
    throw new Error(
      json.error?.message ??
        `Erro ao chamar a IA. Status HTTP: ${response.status}`,
    );
  }

  return extractTextFromResponse(json);
}
