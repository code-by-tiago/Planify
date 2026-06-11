import {
  inferEtapaFromAnoSerie,
  inferSerieStage,
} from "@/lib/banco-questoes/question-bank-education";

export { inferSerieStage } from "@/lib/banco-questoes/question-bank-education";
import type { QuestionBankFilter, QuestionBankItem } from "@/types/question-bank";
import { DEFAULT_QUESTION_BANK_FILTER } from "@/types/question-bank";

export type RankedQuestionBankItem = QuestionBankItem & { matchScore: number };

export type QuestionBankSearchMode = "browse" | "search";

export type QuestionBankSearchFallback = "none" | "related" | "structural";

export type QuestionBankSearchResult = {
  mode: QuestionBankSearchMode;
  items: RankedQuestionBankItem[];
  related: RankedQuestionBankItem[];
  poolSize: number;
  fallback: QuestionBankSearchFallback;
};

export function normalizeQuestionBankText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function temaTokens(topic: string): string[] {
  return normalizeQuestionBankText(topic)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function isQuestionBankSearchActive(filter: QuestionBankFilter): boolean {
  return Boolean(
    filter.query.trim() ||
      filter.bncc.trim() ||
      filter.bnccCodigos?.length,
  );
}

export function isQuestionBankFilterActive(filter: QuestionBankFilter): boolean {
  return (
    filter.etapa !== DEFAULT_QUESTION_BANK_FILTER.etapa ||
    filter.componente !== DEFAULT_QUESTION_BANK_FILTER.componente ||
    filter.anoSerie !== DEFAULT_QUESTION_BANK_FILTER.anoSerie ||
    filter.source !== DEFAULT_QUESTION_BANK_FILTER.source ||
    isQuestionBankSearchActive(filter)
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

  const tokens = temaTokens(topic);
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

function passesEtapaFilter(item: QuestionBankItem, etapa: QuestionBankFilter["etapa"]): boolean {
  if (etapa === "todos") return true;

  const itemEtapa =
    item.etapa?.trim() || inferEtapaFromAnoSerie(item.anoSerie) || "";
  if (!itemEtapa) return true;
  return itemEtapa === etapa;
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
      passesEtapaFilter(item, filter.etapa) &&
      passesComponenteFilter(item, filter.componente) &&
      passesAnoSerieFilter(item, filter.anoSerie, options) &&
      passesBnccFilter(item, bnccCodes),
  );
}

function browsePool(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): RankedQuestionBankItem[] {
  const pool = basePool(items, {
    ...filter,
    query: "",
    bncc: "",
    bnccCodigos: undefined,
  });

  return pool
    .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
    .map((item) => ({ ...item, matchScore: 0 }));
}

export function searchQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankSearchResult {
  const tema = filter.query.trim();
  const searchActive = isQuestionBankSearchActive(filter);

  if (!searchActive) {
    const browse = browsePool(items, filter);
    return {
      mode: "browse",
      items: browse,
      related: [],
      poolSize: browse.length,
      fallback: "none",
    };
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
      fallback: "none",
    };
  }

  const relaxedFilter: QuestionBankFilter = {
    ...filter,
    anoSerie: "todos",
    bncc: "",
    bnccCodigos: undefined,
  };
  const relaxedPool = basePool(items, relaxedFilter, { allowSameStage: true });
  const related = rankPool(relaxedPool, relaxedFilter, 3).slice(0, 8);

  if (related.length > 0) {
    return {
      mode: "search",
      items: [],
      related,
      poolSize: pool.length,
      fallback: "related",
    };
  }

  const structural = browsePool(items, {
    ...filter,
    query: "",
    bncc: "",
    bnccCodigos: undefined,
  }).slice(0, 12);

  return {
    mode: "search",
    items: [],
    related: structural,
    poolSize: pool.length,
    fallback: "structural",
  };
}

/** @deprecated Use searchQuestionBankItems */
export function filterQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankItem[] {
  return searchQuestionBankItems(items, filter).items;
}
