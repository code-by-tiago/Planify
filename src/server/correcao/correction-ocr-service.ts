import {
  generateGeminiTextFromMedia,
  type GeminiMediaPart,
} from "../ai/gemini-client";
import { logOperationalEvent } from "../telemetry/operational-telemetry";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const SYSTEM_INSTRUCTION = `Você é um assistente de OCR pedagógico brasileiro.
Extraia texto legível de fotos ou PDFs de provas e respostas de estudantes.
Preserve parágrafos e quebras de linha naturais.
Ignore cabeçalhos de escola, logos e marcas d'água quando possível.
Responda SOMENTE com o texto extraído, sem markdown nem comentários.`;

function normalizeMime(mimeType: string): GeminiMediaPart["mimeType"] | null {
  const normalized = mimeType.toLowerCase().split(";")[0].trim();
  if (normalized === "image/jpg") return "image/jpeg";
  if (ALLOWED_MIMES.has(normalized)) {
    return normalized as GeminiMediaPart["mimeType"];
  }
  return null;
}

function buildPrompt(hint: "resposta" | "prova_completa"): string {
  if (hint === "prova_completa") {
    return [
      "Extraia o texto de todas as respostas de estudantes neste documento (prova completa ou pilha de folhas).",
      "Separe cada aluno com uma linha contendo apenas --- entre blocos.",
      "Se houver identificação (Aluno:, Nome:, Estudante:), preserve-a no início de cada bloco.",
      "Cada bloco deve conter somente as respostas daquele estudante — não repita o enunciado da prova.",
      "Se o documento tiver até 20 páginas, processe todas; ignore páginas em branco.",
      "Se ilegível, responda apenas: ILEGIVEL: tire foto com mais luz ou recorte a área da resposta.",
    ].join("\n");
  }

  return [
    "Extraia a resposta manuscrita ou digitada do estudante nesta imagem/PDF.",
    "Foque na área da resposta, não no enunciado completo da prova se houver ambos.",
    "Se ilegível, responda apenas: ILEGIVEL: tire foto com mais luz ou recorte a área da resposta.",
  ].join("\n");
}

export async function extractStudentResponseFromUpload(params: {
  buffer: Buffer;
  mimeType: string;
  hint?: "resposta" | "prova_completa";
}): Promise<
  | { ok: true; texto: string; avisos?: string[] }
  | { ok: false; status: number; message: string }
> {
  const mime = normalizeMime(params.mimeType);
  if (!mime) {
    return {
      ok: false,
      status: 400,
      message: "Formato não suportado. Use JPG, PNG, WebP ou PDF.",
    };
  }

  const maxBytes = mime === "application/pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (params.buffer.length > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      status: 413,
      message: `Arquivo grande demais (máx. ${limitMb} MB). Recorte a imagem ou envie um PDF menor.`,
    };
  }

  const base64 = params.buffer.toString("base64");
  const hint = params.hint ?? "resposta";

  try {
    const raw = await generateGeminiTextFromMedia({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: buildPrompt(hint),
      media: [{ mimeType: mime, base64 }],
      tier: "default",
      maxOutputTokens: 8192,
    });

    const texto = raw.trim();
    const avisos: string[] = [];

    if (/^ILEGIVEL:/i.test(texto)) {
      return {
        ok: false,
        status: 422,
        message:
          "Não foi possível ler a resposta. Tire foto com mais luz ou recorte a área da resposta.",
      };
    }

    if (texto.length < 10) {
      logOperationalEvent({
        eventType: "correction_ocr_empty",
        toolTipo: "correcao-ocr",
        ok: false,
        errorCode: "empty_text",
        metadata: { textoLength: texto.length, mime },
      });
      return {
        ok: false,
        status: 422,
        message:
          "Texto extraído vazio ou muito curto. Tente outra foto ou cole manualmente.",
      };
    }

    if (mime === "application/pdf") {
      avisos.push("PDFs longos podem ter texto parcial; confira antes de corrigir.");
    }

    return { ok: true, texto, avisos: avisos.length ? avisos : undefined };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível extrair texto do arquivo.";
    return { ok: false, status: 502, message };
  }
}
