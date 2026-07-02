import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type {
  EntranceExamExtractionConfig,
  EntranceExamExtractionReport,
  EntranceExamExtractedQuestion,
} from "@/types/entrance-exam-extractor";
import type { QuestionBankItem } from "@/types/question-bank";

export type PdfQuestionExtractionResult = {
  questions: EntranceExamExtractedQuestion[];
  items: QuestionBankItem[];
  reports: EntranceExamExtractionReport[];
  imported: number;
  duplicates: number;
};

export async function extractQuestionsFromPdfFiles(input: {
  files: File[];
  config?: EntranceExamExtractionConfig;
  importToBank?: boolean;
}): Promise<PdfQuestionExtractionResult> {
  const formData = new FormData();

  for (const file of input.files) {
    formData.append("pdfs", file);
  }

  if (input.config) {
    formData.set("config", JSON.stringify(input.config));
  }
  if (input.importToBank) {
    formData.set("import", "true");
  }

  const response = await planifyAuthenticatedFetch(
    "/api/banco-questoes/extrair-pdf",
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Nao foi possivel extrair questoes do PDF.");
  }

  return {
    questions: Array.isArray(data.questions) ? data.questions : [],
    items: Array.isArray(data.items) ? data.items : [],
    reports: Array.isArray(data.reports) ? data.reports : [],
    imported: Number(data.imported || 0),
    duplicates: Number(data.duplicates || 0),
  };
}
