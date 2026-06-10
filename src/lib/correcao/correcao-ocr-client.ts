import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

export class CorrectionOcrError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CorrectionOcrError";
    this.status = status;
  }
}

export async function extractTextFromUpload(params: {
  file: File;
  hint?: "resposta" | "prova_completa";
}): Promise<{ texto: string; avisos?: string[] }> {
  const form = new FormData();
  form.append("arquivo", params.file);
  if (params.hint) {
    form.append("hint", params.hint);
  }

  const response = await planifyAuthenticatedFetch("/api/correcao/extrair", {
    method: "POST",
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new CorrectionOcrError(
      data?.message || "Não foi possível ler o arquivo.",
      response.status,
    );
  }

  return {
    texto: String(data.texto || ""),
    avisos: Array.isArray(data.avisos) ? data.avisos.map(String) : undefined,
  };
}

/** Divide texto OCR de prova completa em respostas individuais. */
export function splitMultiStudentText(texto: string): string[] {
  const bySeparator = texto
    .split(/\n\s*---\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);

  if (bySeparator.length > 1) return bySeparator.slice(0, 5);

  const byAluno = texto
    .split(/(?=(?:^|\n)(?:Aluno|Nome|Estudante)\s*[:\-])/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);

  if (byAluno.length > 1) return byAluno.slice(0, 5);

  return [texto.trim()].filter((part) => part.length >= 15);
}
