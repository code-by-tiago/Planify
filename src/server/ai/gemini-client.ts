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

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }

  return apiKey;
}

function getGeminiModel(model?: string): string {
  return model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function extractTextFromGeminiResponse(response: GeminiResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("A Gemini não retornou conteúdo textual.");
  }

  return text;
}

function cleanJsonText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```json")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  return trimmed;
}

export async function generateGeminiJSON<T>(
  options: GeminiGenerateJSONOptions,
): Promise<T> {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel(options.model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: options.systemInstruction,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: options.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        topP: options.topP ?? 0.8,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  const json = (await response.json()) as GeminiResponse;

  if (!response.ok || json.error) {
    throw new Error(
      json.error?.message ||
        `Erro ao chamar Gemini. Status HTTP: ${response.status}`,
    );
  }

  const text = extractTextFromGeminiResponse(json);
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("A Gemini retornou um JSON inválido.");
  }
}
