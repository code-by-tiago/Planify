/**
 * Geração de ilustrações de slide por IA (Gemini) + upload para Supabase Storage.
 *
 * Por que IA em vez de banco de fotos: temas abstratos (gramática, matemática)
 * não têm foto de stock correspondente — a busca devolve imagens aleatórias.
 * Gerar a ilustração a partir do conteúdo do slide garante uma imagem que
 * SEMPRE condiz com o assunto. A imagem vai para o Storage (URL pública leve),
 * nunca embutida em base64 no HTML (que estouraria o localStorage do editor).
 */

import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const IMAGE_BUCKET =
  process.env.SUPABASE_SLIDE_IMAGES_BUCKET || "slide-images";

function getImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
}

type GeminiInlinePart = {
  inlineData?: { data?: string; mimeType?: string };
  inline_data?: { data?: string; mime_type?: string };
};

async function callGeminiImage(
  prompt: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${getImageModel()}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiInlinePart[] } }>;
    };

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData ?? part.inline_data;
      const data = inline?.data;
      if (data) {
        const mime =
          (part.inlineData?.mimeType || part.inline_data?.mime_type) ??
          "image/png";
        return { data: Buffer.from(data, "base64"), mime };
      }
    }

    return null;
  } catch {
    return null;
  }
}

let bucketReady = false;

async function ensureBucket(
  client: ReturnType<typeof getSupabaseAdminClient>,
): Promise<boolean> {
  if (bucketReady) return true;

  try {
    const { data } = await client.storage.getBucket(IMAGE_BUCKET);
    if (data) {
      bucketReady = true;
      return true;
    }
  } catch {
    // segue para criar
  }

  try {
    await client.storage.createBucket(IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });
    bucketReady = true;
    return true;
  } catch {
    // Pode falhar se já existir (corrida) — assume pronto e tenta usar.
    bucketReady = true;
    return true;
  }
}

async function uploadImage(buffer: Buffer, mime: string): Promise<string | null> {
  try {
    const client = getSupabaseAdminClient();
    const ok = await ensureBucket(client);
    if (!ok) return null;

    const ext = mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : "jpg";
    const path = `slides/${randomUUID()}.${ext}`;

    const { error } = await client.storage
      .from(IMAGE_BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });

    if (error) return null;

    const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Gera uma ilustração que corresponde ao conteúdo do slide e devolve a URL
 * pública (Supabase Storage). Retorna null se a IA/Storage não estiver
 * disponível — o chamador então recorre a foto de stock ou nenhuma imagem.
 */
export async function generateSlideIllustration(input: {
  imagePrompt: string;
  tema: string;
}): Promise<{ url: string; alt: string } | null> {
  const subject = (input.imagePrompt || "").trim() || (input.tema || "").trim();
  if (!subject) return null;

  const prompt = [
    `Ilustração educacional em estilo vetorial plano (flat design), limpa e moderna, sobre: ${subject}.`,
    input.tema ? `Contexto da aula: ${input.tema}.` : "",
    "Composição central e clara, cores suaves e harmônicas, fundo claro.",
    "NÃO inclua texto, letras, números, legendas ou marcas d'água na imagem.",
    "Estilo adequado para um slide de sala de aula.",
  ]
    .filter(Boolean)
    .join(" ");

  const image = await callGeminiImage(prompt);
  if (!image) return null;

  const url = await uploadImage(image.data, image.mime);
  if (!url) return null;

  return { url, alt: subject };
}
