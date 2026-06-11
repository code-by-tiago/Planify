import type { QuestionBankFilter, QuestionBankItem } from "@/types/question-bank";

export type RankedQuestionBankItem = QuestionBankItem & { matchScore: number };

export function scoreQuestionBankMatch(
  item: QuestionBankItem,
  tema: string,
  componente: string,
  anoSerie?: string,
): number {
  const topic = tema.trim().toLowerCase();
  const comp = componente.trim().toLowerCase();
  const haystack = [
    item.enunciado,
    item.textoApoio ?? "",
    item.tema,
    item.tags.join(" "),
    item.bnccCodigos.join(" "),
    item.componente,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  if (comp && comp !== "todos") {
    if (item.componente.toLowerCase() === comp) score += 4;
    else if (item.componente.toLowerCase().includes(comp)) score += 2;
  }

  if (anoSerie && anoSerie !== "todos") {
    if (item.anoSerie === anoSerie) score += 5;
    else if (item.anoSerie === "Geral") score += 1;
  }

  if (!topic) return Math.max(score, 1);

  for (const token of topic.split(/\s+/).filter((w) => w.length > 2)) {
    if (haystack.includes(token)) score += 2;
  }
  if (item.tema.trim().toLowerCase().includes(topic)) score += 6;
  if (haystack.includes(topic)) score += 4;

  return Math.max(score, topic ? 0 : 1);
}

function passesSourceFilter(
  item: QuestionBankItem,
  source: QuestionBankFilter["source"],
): boolean {
  if (source === "minhas" && (item.isCommunity || item.isSchool)) return false;
  if (source === "comunidade" && !item.isCommunity) return false;
  if (source === "escola" && !item.isSchool) return false;
  return true;
}

function passesComponenteFilter(item: QuestionBankItem, componente: string): boolean {
  if (componente === "todos") return true;
  return item.componente === componente;
}

function passesAnoSerieFilter(item: QuestionBankItem, anoSerie: string): boolean {
  if (anoSerie === "todos") return true;
  return item.anoSerie === anoSerie || item.anoSerie === "Geral";
}

function collectBnccCodes(filter: QuestionBankFilter): string[] {
  const codes = [...(filter.bnccCodigos ?? [])];
  const manual = filter.bncc.trim();
  if (manual) codes.push(manual);
  return codes.map((code) => code.toLowerCase()).filter(Boolean);
}

function passesBnccFilter(item: QuestionBankItem, codes: string[]): boolean {
  if (!codes.length) return true;
  const itemCodes = item.bnccCodigos.map((code) => code.toLowerCase());
  return codes.some((code) =>
    itemCodes.some((itemCode) => itemCode.includes(code) || code.includes(itemCode)),
  );
}

function rankPool(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
  minScore: number,
): RankedQuestionBankItem[] {
  const tema = filter.query.trim();

  return items
    .map((item) => ({
      item,
      matchScore: scoreQuestionBankMatch(
        item,
        tema,
        filter.componente,
        filter.anoSerie,
      ),
    }))
    .filter((entry) => entry.matchScore >= minScore)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (b.item.usageCount ?? 0) - (a.item.usageCount ?? 0);
    })
    .map((entry) => ({ ...entry.item, matchScore: entry.matchScore }));
}

function basePool(items: QuestionBankItem[], filter: QuestionBankFilter): QuestionBankItem[] {
  const bnccCodes = collectBnccCodes(filter);
  return items.filter(
    (item) =>
      passesSourceFilter(item, filter.source) &&
      passesComponenteFilter(item, filter.componente) &&
      passesAnoSerieFilter(item, filter.anoSerie) &&
      passesBnccFilter(item, bnccCodes),
  );
}

export type QuestionBankSearchResult = {
  items: RankedQuestionBankItem[];
  related: RankedQuestionBankItem[];
};

export function searchQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankSearchResult {
  const tema = filter.query.trim();
  const pool = basePool(items, filter);
  const minScore = tema ? 2 : 0;
  const ranked = rankPool(pool, filter, minScore);

  if (ranked.length > 0 || !tema) {
    return { items: ranked, related: [] };
  }

  const relaxedFilter: QuestionBankFilter = {
    ...filter,
    anoSerie: "todos",
    bncc: "",
    bnccCodigos: undefined,
  };
  const relaxedPool = basePool(items, relaxedFilter).filter(
    (item) => !pool.some((entry) => entry.id === item.id),
  );
  const related = rankPool(relaxedPool, relaxedFilter, 3).slice(0, 8);

  return { items: [], related };
}

/** @deprecated Use searchQuestionBankItems — mantido para compatibilidade */
export function filterQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankItem[] {
  return searchQuestionBankItems(items, filter).items;
}
