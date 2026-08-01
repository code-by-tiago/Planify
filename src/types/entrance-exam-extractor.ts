import type { QuestionBankItem } from "@/types/question-bank";

export type EntranceExamQuestionType = "MultipleChoice" | "OpenQuestion";

export type EntranceExamImageAsset = {
  url: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EntranceExamExtractedQuestion = {
  question_number: string;
  question_type: EntranceExamQuestionType;
  statement: string;
  alternatives: string[];
  image: string | null;
  images: EntranceExamImageAsset[];
  support_text?: string;
  source_pdf: string;
  page_start: number;
  page_end: number;
};

export type EntranceExamExtractionConfig = {
  columns?: "auto" | 1 | 2;
  questionPattern?: string;
  alternativePattern?: string;
  ignoreLinePatterns?: string[];
  supportTextMarkers?: string[];
  maxPages?: number;
  componente?: string;
  anoSerie?: string;
  etapa?: string;
  tema?: string;
};

export type EntranceExamExtractionReport = {
  pdfName: string;
  pageCount: number;
  textLineCount: number;
  questionsFound: number;
  multipleChoiceCount: number;
  openQuestionCount: number;
  imageCount: number;
  associatedImageCount: number;
  warnings: string[];
};

export type EntranceExamExtractionResult = {
  questions: EntranceExamExtractedQuestion[];
  items: QuestionBankItem[];
  report: EntranceExamExtractionReport;
};
