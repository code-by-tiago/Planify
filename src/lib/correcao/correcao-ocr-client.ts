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
  const trimmed = texto.trim();
  if (!trimmed) return [];

  const bySeparator = trimmed
    .split(/\n\s*---\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);

  if (bySeparator.length > 1) return bySeparator.slice(0, 5);

  const byAluno = trimmed
    .split(
      /(?=(?:^|\n)(?:Aluno(?:\s+\d+)?|Nome(?:\s+do\s+aluno)?|Estudante|Candidato)\s*[:\-])/i,
    )
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);

  if (byAluno.length > 1) return byAluno.slice(0, 5);

  const byFolha = trimmed
    .split(/(?=(?:^|\n)(?:Folha|Ficha|Cart[ãa]o)\s*(?:de\s+resposta\s*)?\d*)/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);

  if (byFolha.length > 1) return byFolha.slice(0, 5);

  return [trimmed].filter((part) => part.length >= 15);
}
