import "server-only";

import { generateGeminiText } from "@/server/ai/gemini-client";

const STRUCTURED_MARKERS = /^#{1,3}\s|^\*\*|^-\s/m;

export function isStructuredMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 80) return false;
  return STRUCTURED_MARKERS.test(trimmed);
}

export async function formatPedagogicalSnippet(input: {
  title: string;
  rawText: string;
}): Promise<{ bodyMarkdown: string; aiTokensUsed: number }> {
  if (isStructuredMarkdown(input.rawText)) {
    return { bodyMarkdown: input.rawText, aiTokensUsed: 0 };
  }

  const prompt = `Formate o texto abaixo em Markdown didático conciso (máx. 600 palavras).
Use títulos ##, listas e parágrafos curtos. Não invente fatos além do texto.

Título: ${input.title}

Texto bruto:
${input.rawText.slice(0, 3000)}`;

  const bodyMarkdown = await generateGeminiText({
    systemInstruction:
      "Você formata textos didáticos em Markdown. Responda apenas com Markdown, sem explicações.",
    prompt,
    model: "gemini-2.5-flash-lite",
    maxOutputTokens: 512,
    temperature: 0.2,
  });

  return {
    bodyMarkdown: bodyMarkdown.trim() || input.rawText,
    aiTokensUsed: 512,
  };
}
