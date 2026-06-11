import type { QuestionBankFilter, QuestionBankItem } from "@/types/question-bank";

const STORAGE_KEY = "planify:banco-questoes:items";
const MAX_ITEMS = 500;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function safeParse(raw: string | null): QuestionBankItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuestionBankItem[]) : [];
  } catch {
    return [];
  }
}

export function loadQuestionBankItems(): QuestionBankItem[] {
  if (!canUseStorage()) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function saveQuestionBankItems(items: QuestionBankItem[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_ITEMS)),
  );
}

export function upsertQuestionBankItem(item: QuestionBankItem): QuestionBankItem[] {
  const items = loadQuestionBankItems();
  const index = items.findIndex((entry) => entry.id === item.id);
  const next = [...items];
  if (index >= 0) {
    next[index] = item;
  } else {
    next.unshift(item);
  }
  saveQuestionBankItems(next);
  return next;
}

export function removeQuestionBankItem(id: string): QuestionBankItem[] {
  const next = loadQuestionBankItems().filter((item) => item.id !== id);
  saveQuestionBankItems(next);
  return next;
}

export { filterQuestionBankItems, searchQuestionBankItems } from "./question-bank-match";
export type { QuestionBankSearchResult, RankedQuestionBankItem } from "./question-bank-match";

export function readProvaInjectObservacoes(): string | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem("planify:banco-questoes:prova-inject");
    if (!raw) return null;
    sessionStorage.removeItem("planify:banco-questoes:prova-inject");
    const items = JSON.parse(raw) as Array<{
      enunciado: string;
      textoApoio?: string;
      tipo: string;
      alternativas?: string[];
      respostaEsperada?: string;
    }>;
    if (!Array.isArray(items) || !items.length) return null;

    const blocks = items.map((item, index) => {
      const alts =
        item.alternativas?.length
          ? `\nAlternativas: ${item.alternativas.join(" | ")}`
          : "";
      const gabarito = item.respostaEsperada
        ? `\nGabarito: ${item.respostaEsperada}`
        : "";
      const apoio = item.textoApoio?.trim()
        ? `Texto de apoio: ${item.textoApoio}\n`
        : "";
      return `${index + 1}. [${item.tipo}] ${apoio}${item.enunciado}${alts}${gabarito}`;
    });

    return [
      `Use exatamente estas ${items.length} questões; complete só transições se necessário.`,
      "QUESTÕES DO BANCO — reutilize no material (pode renumerar e harmonizar estilo):",
      ...blocks,
    ].join("\n\n");
  } catch {
    return null;
  }
}

export function stashQuestionsForProva(items: QuestionBankItem[]): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(
      "planify:banco-questoes:prova-inject",
      JSON.stringify(
        items.map((item) => ({
          enunciado: item.enunciado,
          textoApoio: item.textoApoio,
          tipo: item.tipo,
          alternativas: item.alternativas,
          respostaEsperada: item.respostaEsperada,
          criterioCorrecao: item.criterioCorrecao,
        })),
      ),
    );
  } catch {
    /* ignore */
  }
}
