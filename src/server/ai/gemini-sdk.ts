import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no servidor. Adicione a variável ao .env.local ou na Vercel.",
    );
  }

  return apiKey;
}

export function getGeminiSdk(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }

  return client;
}

export function resetGeminiSdkForTests() {
  client = null;
}
