import { getGeminiApiKey, getGeminiSdk } from "./gemini-sdk";

/** Atalhos aceitos em IMAGEN_MODEL (ex.: imagen-4 → modelo oficial da API). */
const IMAGEN_MODEL_ALIASES: Record<string, string> = {
  imagen: "imagen-4.0-generate-001",
  "imagen-4": "imagen-4.0-generate-001",
  "imagen-4.0": "imagen-4.0-generate-001",
  "imagen-4-standard": "imagen-4.0-generate-001",
  "imagen-4-fast": "imagen-4.0-fast-generate-001",
  "imagen-4-ultra": "imagen-4.0-ultra-generate-001",
};

export type ImagenAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export type GenerateImagenImageOptions = {
  aspectRatio?: ImagenAspectRatio;
  outputMimeType?: "image/png" | "image/jpeg";
  /** Limite do fluxo de Slides para impedir que uma imagem prenda o deck. */
  timeoutMs?: number;
};

const DEFAULT_IMAGEN_TIMEOUT_MS = 20_000;

/**
 * Resolve o modelo Imagen a partir de IMAGEN_MODEL (ou GEMINI_IMAGE_MODEL legado).
 * Usa a mesma GEMINI_API_KEY do restante do Planify.
 */
export function resolveImagenModel(): string {
  const raw =
    process.env.IMAGEN_MODEL?.trim() ||
    process.env.GEMINI_IMAGE_MODEL?.trim() ||
    "imagen-4.0-fast-generate-001";

  return IMAGEN_MODEL_ALIASES[raw.toLowerCase()] ?? raw;
}

function extractImageBytes(payload: unknown): { data: string; mime: string } | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;

  const generated = root.generatedImages;
  if (Array.isArray(generated) && generated.length > 0) {
    const image = (generated[0] as { image?: { imageBytes?: string; mimeType?: string } })
      ?.image;
    if (image?.imageBytes) {
      return {
        data: image.imageBytes,
        mime: image.mimeType || "image/png",
      };
    }
  }

  const predictions = root.predictions;
  if (Array.isArray(predictions) && predictions.length > 0) {
    const prediction = predictions[0] as Record<string, unknown>;
    const bytes =
      (prediction.bytesBase64Encoded as string | undefined) ||
      (prediction.imageBytes as string | undefined);
    if (bytes) {
      return {
        data: bytes,
        mime: (prediction.mimeType as string | undefined) || "image/png",
      };
    }
  }

  return null;
}

async function generateImagenImageViaRest(
  prompt: string,
  model: string,
  mime: GenerateImagenImageOptions["outputMimeType"],
  aspectRatio: ImagenAspectRatio,
  timeoutMs: number,
): Promise<{ data: Buffer; mime: string } | null> {
  const apiKey = getGeminiApiKey();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(Math.max(1, timeoutMs)),
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          outputOptions: { mimeType: mime ?? "image/png" },
        },
      }),
    });

    if (!response.ok) return null;

    const json = (await response.json()) as unknown;
    const extracted = extractImageBytes(json);
    if (!extracted) return null;

    return {
      data: Buffer.from(extracted.data, "base64"),
      mime: extracted.mime,
    };
  } catch {
    return null;
  }
}

async function withImagenTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("A geração da imagem demorou mais que o esperado.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Gera uma ilustração via Imagen (Gemini API) com GEMINI_API_KEY.
 * Retorna null se a API não estiver disponível ou a geração falhar.
 */
export async function generateImagenImage(
  prompt: string,
  options: GenerateImagenImageOptions = {},
): Promise<{ data: Buffer; mime: string } | null> {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const model = resolveImagenModel();
  const mime = options.outputMimeType ?? "image/png";
  const aspectRatio = options.aspectRatio ?? "16:9";
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_IMAGEN_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await withImagenTimeout(
      getGeminiSdk().models.generateImages({
        model,
        prompt: trimmed,
        config: {
          numberOfImages: 1,
          outputMimeType: mime,
          aspectRatio,
        },
      }),
      timeoutMs,
    );

    const extracted = extractImageBytes(response);
    if (extracted) {
      return {
        data: Buffer.from(extracted.data, "base64"),
        mime: extracted.mime,
      };
    }
  } catch {
    // fallback REST abaixo
  }

  const remainingMs = timeoutMs - (Date.now() - startedAt);
  if (remainingMs <= 0) return null;

  return generateImagenImageViaRest(
    trimmed,
    model,
    mime,
    aspectRatio,
    remainingMs,
  );
}
