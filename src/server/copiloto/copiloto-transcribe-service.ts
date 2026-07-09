import { generateGeminiTextFromMedia } from "@/server/ai/gemini-client";
import { isAllowedCopilotoAudioMime } from "@/lib/copiloto/copiloto-utils";
import {
  buildPedagogicalSttContextBlock,
  correctPedagogicalTranscript,
} from "@/lib/copiloto/pedagogical-glossary";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function normalizeMime(raw: string): string {
  const base = raw.split(";")[0]?.trim().toLowerCase() || "";
  if (base === "audio/x-wav") return "audio/wav";
  if (base === "audio/m4a") return "audio/x-m4a";
  return base;
}

export type CopilotoTranscribeResult =
  | { ok: true; transcript: string }
  | { ok: false; message: string; status: number; code?: string };

export async function transcribeCopilotoAudio(input: {
  buffer: Buffer;
  mimeType: string;
}): Promise<CopilotoTranscribeResult> {
  if (!input.buffer.length) {
    return { ok: false, message: "Áudio vazio.", status: 400, code: "empty_audio" };
  }

  if (input.buffer.length > MAX_AUDIO_BYTES) {
    return {
      ok: false,
      message: "Áudio muito grande. Grave até cerca de 60 segundos.",
      status: 413,
      code: "audio_too_large",
    };
  }

  const mime = normalizeMime(input.mimeType);
  if (
    !isAllowedCopilotoAudioMime(mime) &&
    !isAllowedCopilotoAudioMime(input.mimeType.toLowerCase())
  ) {
    return {
      ok: false,
      message: "Formato de áudio não suportado. Use WebM, MP4, WAV ou OGG.",
      status: 415,
      code: "unsupported_audio",
    };
  }

  const mimeForGemini = (
    mime.startsWith("audio/") ? mime : "audio/webm"
  ) as
    | "audio/webm"
    | "audio/mp4"
    | "audio/mpeg"
    | "audio/wav"
    | "audio/ogg"
    | "audio/x-m4a";

  try {
    const glossary = buildPedagogicalSttContextBlock();
    const text = await generateGeminiTextFromMedia({
      systemInstruction: [
        "Você é um transcritor pedagógico do Planify, especialista em educação básica brasileira.",
        "Transcreva o áudio do professor em português do Brasil.",
        glossary,
        "Preserve siglas exatamente como no dicionário (BNCC, PEI, TEA, TDAH, EJA, SAEB, ENEM, AEE, LIBRAS).",
        "Corrija erros óbvios de ditado de jargão educacional; preserve o sentido pedagógico.",
        "Retorne SOMENTE o texto transcrito, sem aspas, sem markdown e sem comentários.",
        "Se o áudio estiver inaudível, retorne exatamente: [inaudível]",
      ].join(" "),
      prompt:
        "Transcreva o pedido falado pelo professor para gerar material didático. Atenção especial a siglas pedagógicas.",
      media: [
        {
          mimeType: mimeForGemini,
          base64: input.buffer.toString("base64"),
        },
      ],
      tier: "default",
      maxOutputTokens: 2048,
    });

    const transcript = correctPedagogicalTranscript(
      text.replace(/^["'\s]+|["'\s]+$/g, "").trim(),
    );
    if (!transcript || transcript === "[inaudível]") {
      return {
        ok: false,
        message: "Não foi possível entender o áudio. Tente gravar de novo.",
        status: 422,
        code: "inaudible",
      };
    }

    return { ok: true, transcript };
  } catch (error) {
    console.error("[copiloto/transcribe]", error);
    return {
      ok: false,
      message: "Falha ao transcrever o áudio. Tente novamente.",
      status: 502,
      code: "transcribe_failed",
    };
  }
}
