import "server-only";

import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";
import type { PedagogicalCacheEntry } from "./pedagogical-cache-db-service";

const TOKEN_OVERLAP_THRESHOLD = 0.5;

export function normalizeTema(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeTema(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function temaOverlap(
  queryTema: string,
  entryTitle: string,
  entryTags: string[] = [],
): boolean {
  const normalizedQuery = normalizeTema(queryTema);
  if (!normalizedQuery) return false;

  const candidates = [entryTitle, ...entryTags]
    .map(normalizeTema)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes(normalizedQuery) || normalizedQuery.includes(candidate)) {
      return true;
    }

    const queryTokens = tokenize(normalizedQuery);
    const candidateTokens = tokenize(candidate);
    if (!queryTokens.length || !candidateTokens.length) continue;

    const overlap = queryTokens.filter((token) =>
      candidateTokens.some(
        (candidateToken) =>
          candidateToken.includes(token) || token.includes(candidateToken),
      ),
    ).length;

    const ratio = overlap / Math.min(queryTokens.length, candidateTokens.length);
    if (ratio >= TOKEN_OVERLAP_THRESHOLD) return true;
  }

  return false;
}

function bnccOverlap(
  queryBncc: string[] | undefined,
  entryBncc: string[],
): boolean {
  if (!queryBncc?.length || !entryBncc?.length) return false;

  const querySet = new Set(
    queryBncc.map((code) => code.trim().toUpperCase()).filter(Boolean),
  );

  return entryBncc.some((code) => querySet.has(code.trim().toUpperCase()));
}

export type ConfidenceMatchResult =
  | { pass: true; entries: PedagogicalCacheEntry[]; reason: "tema" | "bncc" | "both" }
  | { pass: false; reason: string; entries: PedagogicalCacheEntry[] };

export function filterEntriesByConfidence(
  query: PedagogicalScrapeQuery,
  entries: PedagogicalCacheEntry[],
): ConfidenceMatchResult {
  if (!entries.length) {
    return { pass: false, reason: "no_entries", entries: [] };
  }

  const queryTema = query.tema?.trim() || "";
  const queryBncc = query.bnccCodigos;

  const matched = entries.filter((entry) => {
    const titleMatch = queryTema
      ? temaOverlap(queryTema, entry.title, entry.tags || [])
      : false;
    const codeMatch = bnccOverlap(queryBncc, entry.bncc_codigos || []);

    if (queryTema && queryBncc?.length) {
      return titleMatch || codeMatch;
    }
    if (queryTema) {
      return titleMatch;
    }
    if (queryBncc?.length) {
      return codeMatch;
    }
    return false;
  });

  if (!matched.length) {
    return {
      pass: false,
      reason: queryTema ? "weak_tema_match" : "weak_bncc_match",
      entries,
    };
  }

  const hasTema = matched.some((entry) =>
    queryTema ? temaOverlap(queryTema, entry.title, entry.tags || []) : false,
  );
  const hasBncc = matched.some((entry) =>
    bnccOverlap(queryBncc, entry.bncc_codigos || []),
  );

  const reason =
    hasTema && hasBncc ? "both" : hasBncc ? "bncc" : "tema";

  return { pass: true, entries: matched, reason };
}
