import type {
  QuestionBankCollection,
  QuestionBankItem,
} from "@/types/question-bank";

const CURATED_SOURCE_PREFIXES = ["ingest:official:", "ingest:licensed:"];

export function normalizeQuestionBankCollection(
  value: unknown,
): QuestionBankCollection {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "enem" ||
    normalized === "vestibular" ||
    normalized === "concurso" ||
    normalized === "superior" ||
    normalized === "escolar"
  ) {
    return normalized;
  }
  return "geral";
}

export function getQuestionBankCollection(
  item: Pick<QuestionBankItem, "collection" | "etapa" | "anoSerie">,
): QuestionBankCollection {
  if (item.collection) return normalizeQuestionBankCollection(item.collection);

  const haystack = `${item.etapa || ""} ${item.anoSerie || ""}`
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (haystack.includes("enem")) return "enem";
  if (haystack.includes("vestibular")) return "vestibular";
  if (haystack.includes("concurso")) return "concurso";
  if (haystack.includes("superior") || haystack.includes("graduacao")) return "superior";
  if (haystack.includes("ensino fundamental") || haystack.includes("ensino medio")) {
    return "escolar";
  }
  return "geral";
}

export function isHumanReviewedQuestion(
  item: Pick<QuestionBankItem, "reviewStatus" | "sourceType">,
): boolean {
  if (item.reviewStatus === "human-reviewed") return true;
  const sourceType = String(item.sourceType || "");
  return CURATED_SOURCE_PREFIXES.some((prefix) => sourceType.startsWith(prefix));
}

export function getQuestionReviewLabel(
  item: Pick<QuestionBankItem, "reviewStatus" | "sourceType">,
): string {
  if (isHumanReviewedQuestion(item)) return "Fonte humana revisada";
  if (
    item.reviewStatus === "automated" ||
    String(item.sourceType || "").startsWith("ingest:ai:")
  ) {
    return "Revisada pelo robô Planify";
  }
  if (item.reviewStatus === "pending") return "Em revisão";
  return "Acervo da comunidade";
}

export function isCuratedQuestion(
  item: Pick<QuestionBankItem, "reviewStatus" | "sourceType">,
): boolean {
  return isHumanReviewedQuestion(item) || item.reviewStatus === "automated";
}
