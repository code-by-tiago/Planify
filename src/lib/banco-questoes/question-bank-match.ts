import {
  inferEtapaFromAnoSerie,
  inferSerieStage,
} from "@/lib/banco-questoes/question-bank-education";

export { inferSerieStage } from "@/lib/banco-questoes/question-bank-education";
import {
  bnccCodeMatchesStage,
  resolveBnccStageFromFields,
} from "@/lib/bncc/bncc-stage-filter";
import type { QuestionBankFilter, QuestionBankItem } from "@/types/question-bank";
import { DEFAULT_QUESTION_BANK_FILTER } from "@/types/question-bank";

export type RankedQuestionBankItem = QuestionBankItem & { matchScore: number };

export type QuestionBankSearchMode = "browse" | "search";

export type QuestionBankSearchFallback = "none" | "related";

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

function bnccComponentArea(code: string): string {
  const match = String(code || "")
    .trim()
    .toUpperCase()
    .match(/^(?:EM|EF|EI)\d{2}([A-Z]{2})/);
  return match?.[1] ?? "";
}

function itemEffectiveEtapa(item: QuestionBankItem): string {
  const fromField = item.etapa?.trim();
  if (fromField) return fromField;
  return inferEtapaFromAnoSerie(item.anoSerie) ?? "";
}

function itemEducationIsConsistent(item: QuestionBankItem): boolean {
  const fromAno = inferEtapaFromAnoSerie(item.anoSerie);
  const fromField = item.etapa?.trim();
  if (!fromAno || !fromField) return true;
  return fromAno === fromField;
}

export function isQuestionBankSearchActive(filter: QuestionBankFilter): boolean {
  return Boolean(
    filter.query.trim() ||
      filter.bncc.trim() ||
      filter.bnccCodigos?.length ||
      filter.bnccSearchTerms?.length,
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
  bnccTerms: string[] = [],
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
      if (wanted !== "geral" && got !== "geral" && wanted !== got) return 0;
      if (item.anoSerie !== anoSerie) score += 1;
    }
  }

  const searchTerms = [
    ...temaTokens(topic),
    ...bnccTerms.flatMap((term) => temaTokens(term)),
  ];

  if (!topic && searchTerms.length === 0) return Math.max(score, 1);

  let tokenHits = 0;
  for (const token of searchTerms) {
    if (haystack.includes(token)) {
      score += 3;
      tokenHits += 1;
    }
  }

  const itemTema = normalizeQuestionBankText(item.tema);
  if (topic && itemTema.includes(topic)) score += 8;
  if (topic && haystack.includes(topic)) score += 5;

  if (searchTerms.length > 0 && tokenHits === 0 && topic) return 0;

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
  if (!itemEducationIsConsistent(item)) return false;

  const itemEtapa = itemEffectiveEtapa(item);
  if (!itemEtapa) return false;
  return itemEtapa === etapa;
}

function passesComponenteFilter(item: QuestionBankItem, componente: string): boolean {
  if (componente === "todos") return true;
  return normalizeQuestionBankText(item.componente) === normalizeQuestionBankText(componente);
}

function passesAnoSerieFilter(
  item: QuestionBankItem,
  anoSerie: string,
  options?: { relaxWithinStage?: boolean },
): boolean {
  if (anoSerie === "todos") return true;
  if (item.anoSerie === anoSerie || item.anoSerie === "Geral") return true;
  if (!options?.relaxWithinStage) return false;

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
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
  }
  const manual = filter.bncc.trim();
  return manual ? [manual.toUpperCase()] : [];
}

function collectBnccSearchTerms(filter: QuestionBankFilter): string[] {
  const terms = (filter.bnccSearchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (terms.length > 0) return terms;
  if (filter.query.trim()) return [filter.query.trim()];
  return [];
}

function itemHaystack(item: QuestionBankItem): string {
  return normalizeQuestionBankText(
    [
      item.enunciado,
      item.textoApoio ?? "",
      item.tema,
      item.tags.join(" "),
      item.bnccCodigos.join(" "),
    ].join(" "),
  );
}

function passesBnccFilter(item: QuestionBankItem, filter: QuestionBankFilter): boolean {
  const codes = collectBnccCodes(filter);
  if (!codes.length) return true;

  const stage = resolveBnccStageFromFields(filter.etapa, filter.anoSerie);
  const itemCodes = item.bnccCodigos.map((code) => code.toUpperCase());
  const filterAreas = new Set(codes.map(bnccComponentArea).filter(Boolean));
  const searchTerms = collectBnccSearchTerms(filter);
  const haystack = itemHaystack(item);

  for (const code of codes) {
    const normalized = code.toUpperCase();
    if (itemCodes.some((itemCode) => itemCode === normalized)) {
      return true;
    }
  }

  for (const itemCode of itemCodes) {
    if (stage && !bnccCodeMatchesStage(itemCode, stage)) continue;

    const itemArea = bnccComponentArea(itemCode);
    if (filterAreas.size > 0 && itemArea && !filterAreas.has(itemArea)) continue;

    if (searchTerms.length > 0) {
      const tokens = searchTerms.flatMap((term) => temaTokens(term));
      if (tokens.some((token) => haystack.includes(token))) {
        return true;
      }
      continue;
    }

    if (filterAreas.size > 0 && itemArea && filterAreas.has(itemArea)) {
      return true;
    }
  }

  return false;
}

function rankPool(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
  minScore: number,
): RankedQuestionBankItem[] {
  const tema = filter.query.trim();
  const bnccTerms = collectBnccSearchTerms(filter);

  return items
    .map((item) => ({
      item,
      matchScore: scoreQuestionBankMatch(
        item,
        tema,
        filter.componente,
        filter.anoSerie,
        bnccTerms,
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
  options?: { relaxWithinStage?: boolean },
): QuestionBankItem[] {
  return items.filter(
    (item) =>
      passesSourceFilter(item, filter.source) &&
      passesEtapaFilter(item, filter.etapa) &&
      passesComponenteFilter(item, filter.componente) &&
      passesAnoSerieFilter(item, filter.anoSerie, options) &&
      passesBnccFilter(item, filter),
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
    bnccSearchTerms: undefined,
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
  const minScore = tema || filter.bnccSearchTerms?.length ? 3 : 1;
  const ranked = rankPool(pool, filter, minScore);

  if (ranked.length > 0) {
    return {
      mode: "search",
      items: ranked,
      related: [],
      poolSize: pool.length,
      fallback: "none",
    };
  }

  if (!tema && !filter.bnccSearchTerms?.length) {
    return {
      mode: "search",
      items: [],
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
  const relaxedPool = basePool(items, relaxedFilter, { relaxWithinStage: true });
  const related = rankPool(relaxedPool, relaxedFilter, 3).slice(0, 8);

  return {
    mode: "search",
    items: [],
    related,
    poolSize: pool.length,
    fallback: related.length > 0 ? "related" : "none",
  };
}

/** @deprecated Use searchQuestionBankItems */
export function filterQuestionBankItems(
  items: QuestionBankItem[],
  filter: QuestionBankFilter,
): QuestionBankItem[] {
  return searchQuestionBankItems(items, filter).items;
}
