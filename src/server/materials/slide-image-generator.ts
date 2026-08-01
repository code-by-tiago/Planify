/**
 * Ilustrações de slides via Imagen 4 (GEMINI_API_KEY) + upload Supabase Storage.
 *
 * Materiais com imagePrompt nos slides passam por enrichSlidesWithImages → aqui.
 * A imagem vai para o Storage (URL pública leve), nunca em base64 no HTML.
 */

import { randomUUID } from "crypto";
import { generateImagenImage } from "../ai/imagen-client";
import { getSupabaseAdminClient } from "../supabase/admin-client";

const IMAGE_BUCKET =
  process.env.SUPABASE_SLIDE_IMAGES_BUCKET || "slide-images";

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

function buildEducationalIllustrationPrompt(input: {
  imagePrompt: string;
  tema: string;
}): string {
  const subject = (input.imagePrompt || "").trim() || (input.tema || "").trim();

  return [
    `Ilustração educacional em estilo vetorial plano (flat design), limpa e moderna, sobre: ${subject}.`,
    input.tema ? `Contexto da aula: ${input.tema}.` : "",
    "Composição central e clara, cores suaves e harmônicas, fundo claro.",
    "NÃO inclua texto, letras, números, legendas ou marcas d'água na imagem.",
    "Estilo adequado para um slide de sala de aula brasileira.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Gera ilustração com Imagen 4 (IMAGEN_MODEL + GEMINI_API_KEY) e devolve URL pública.
 */
export async function generateSlideIllustration(input: {
  imagePrompt: string;
  tema: string;
}, options?: { timeoutMs?: number }): Promise<{ url: string; alt: string } | null> {
  const subject = (input.imagePrompt || "").trim() || (input.tema || "").trim();
  if (!subject) return null;

  const prompt = buildEducationalIllustrationPrompt(input);
  const image = await generateImagenImage(prompt, {
    aspectRatio: "16:9",
    outputMimeType: "image/png",
    timeoutMs: options?.timeoutMs,
  });

  if (!image) return null;

  const url = await uploadImage(image.data, image.mime);
  if (!url) return null;

  return { url, alt: subject };
}
