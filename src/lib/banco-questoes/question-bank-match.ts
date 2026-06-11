import type { QuestionBankFilter, QuestionBankItem } from "@/types/question-bank";

export type RankedQuestionBankItem = QuestionBankItem & { matchScore: number };

export type QuestionBankSearchMode = "browse" | "search";

export type QuestionBankSearchResult = {
  mode: QuestionBankSearchMode;
  items: RankedQuestionBankItem[];
  related: RankedQuestionBankItem[];
  poolSize: number;
};

const EM_SERIES = new Set(["1ª série", "2ª série", "3ª série"]);
const EF_YEARS = new Set([
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
]);

export function normalizeQuestionBankText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function inferSerieStage(anoSerie: string): "em" | "ef" | "geral" | "unknown" {
  if (!anoSerie || anoSerie === "Geral" || anoSerie === "todos") return "geral";
  if (EM_SERIES.has(anoSerie)) return "em";
  if (EF_YEARS.has(anoSerie)) return "ef";
  return "unknown";
}

export function isQuestionBankFilterActive(filter: QuestionBankFilter): boolean {
  return (
    filter.componente !== "todos" ||
    filter.anoSerie !== "todos" ||
    Boolean(filter.query.trim()) ||
    Boolean(filter.bncc.trim()) ||
    Boolean(filter.bnccCodigos?.length) ||
    filter.source !== "todas"
  );
}

export function scoreQuestionBankMatch(
  item: QuestionBankItem,
  tema: string,
  componente: string,
  anoSerie?: string,
): number {
  const topic = normalizeQuestionBankText(tema);
  const comp = normalizeQuestionBankText(componente);
  const haystack = normalizeQuestionBankText(
    [
      item.enunciado,
      item.textoApoio ?? "",
      item.tema,
      item.tags.join(" "),
      item.bnccCodigos.join(" "),
      item.componente,
    ].join(" "),
  );

  let score = 0;

  if (comp && comp !== "todos") {
    const itemComp = normalizeQuestionBankText(item.componente);
    if (itemComp === comp) score += 6;
    else if (itemComp.includes(comp) || comp.includes(itemComp)) score += 2;
    else return 0;
  }

  if (anoSerie && anoSerie !== "todos") {
    if (item.anoSerie === anoSerie) score += 6;
    else if (item.anoSerie === "Geral") score += 2;
    else {
      const wanted = inferSerieStage(anoSerie);
      const got = inferSerieStage(item.anoSerie);
      if (wanted !== "geral" && got !== "geral" && wanted !== got) score -= 4;
    }
  }

  if (!topic) return Math.max(score, 1);

  const tokens = topic.split(/\s+/).filter((w) => w.length > 2);
  let tokenHits = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 3;
      tokenHits += 1;
    }
  }

  const itemTema = normalizeQuestionBankText(item.tema);
  if (itemTema.includes(topic)) score += 8;
  if (haystack.includes(topic)) score += 5;

  if (tokens.length > 0 && tokenHits === 0) return 0;

  return Math.max(score, 0);
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
  return normalizeQuestionBankText(item.componente) === normalizeQuestionBankText(componente);
}

function passesAnoSerieFilter(
  item: QuestionBankItem,
  anoSerie: string,
  options?: { allowSameStage?: boolean },
): boolean {
  if (anoSerie === "todos") return true;
  if (item.anoSerie === anoSerie || item.anoSerie === "Geral") return true;
  if (!options?.allowSameStage) return false;

  const wanted = inferSerieStage(anoSerie);
  const got = inferSerieStage(item.anoSerie);
  if (wanted === "geral" || got === "geral" || wanted === "unknown" || got === "unknown") {
    return false;
  }
  return wanted === got;
}

function collectBnccCodes(filter: QuestionBankFilter): string[] {
  if (filter.bnccCodigos?.length) {
    return filter.bnccCodigos
      .map((code) => code.trim().toLowerCase())
      .filter(Boolean);
  }
  const manual = filter.bncc.trim();
  return manual ? [manual.toLowerCase()] : [];
}

function passesBnccFilter(item: QuestionBankItem, codes: string[]): boolean {
  if (!codes.length) return true;
  const itemCodes = item.bnccCodigos.map((code) => code.toLowerCase());
  return codes.some((code) =>
    itemCodes.some((itemCode) => itemCode === code || itemCode.includes(code)),
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

function basePool(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
  options?: { allowSameStage?: boolean },
): QuestionBankItem[] {
  const bnccCodes = collectBnccCodes(filter);
  return items.filter(
    (item) =>
      passesSourceFilter(item, filter.source) &&
      passesComponenteFilter(item, filter.componente) &&
      passesAnoSerieFilter(item, filter.anoSerie, options) &&
      passesBnccFilter(item, bnccCodes),
  );
}

function browsePool(items: QuestionBankItem[], filter: QuestionBankFilter): RankedQuestionBankItem[] {
  const pool = basePool(items, {
    ...filter,
    query: "",
    bncc: "",
    bnccCodigos: undefined,
  });

  return pool
    .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
    .slice(0, 60)
    .map((item) => ({ ...item, matchScore: 0 }));
}

export function searchQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankSearchResult {
  const tema = filter.query.trim();
  const active = isQuestionBankFilterActive(filter);

  if (!active) {
    const browse = browsePool(items, filter);
    return { mode: "browse", items: browse, related: [], poolSize: browse.length };
  }

  const pool = basePool(items, filter);
  const minScore = tema ? 3 : 1;
  const ranked = rankPool(pool, filter, minScore);

  if (ranked.length > 0 || !tema) {
    return {
      mode: "search",
      items: ranked,
      related: [],
      poolSize: pool.length,
    };
  }

  const relaxedFilter: QuestionBankFilter = {
    ...filter,
    anoSerie: "todos",
    bncc: "",
    bnccCodigos: undefined,
  };
  const relaxedPool = basePool(items, relaxedFilter, { allowSameStage: true });
  const related = rankPool(relaxedPool, relaxedFilter, 5).slice(0, 6);

  return {
    mode: "search",
    items: [],
    related,
    poolSize: pool.length,
  };
}

/** @deprecated Use searchQuestionBankItems */
export function filterQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankItem[] {
  return searchQuestionBankItems(items, filter).items;
}
