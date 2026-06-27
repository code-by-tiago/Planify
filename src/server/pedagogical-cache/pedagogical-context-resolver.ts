import "server-only";

import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";
import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";
import { findApprovedCorpusCandidates } from "@/server/corpus/corpus-candidates-db-service";
import {
  estimateTokensSaved,
  findApprovedEntries,
  recordCacheHit,
  recordCacheMissUsage,
  type PedagogicalCacheEntry,
} from "./pedagogical-cache-db-service";
import { filterEntriesByConfidence } from "./pedagogical-match-confidence";
import { scrapePedagogicalSources } from "./scrape-orchestrator";

export type PedagogicalContextResult =
  | { kind: "cache_hit"; entries: PedagogicalCacheEntry[]; tokensSaved: number }
  | { kind: "cache_miss"; scraped: PedagogicalCacheEntry[]; jobId: string }
  | { kind: "empty" };

export function appendPedagogicalContext(
  observacoes: string | undefined,
  entries: PedagogicalCacheEntry[],
): string {
  if (!entries.length) return observacoes?.trim() || "";

  const lines = entries.map((entry) => {
    const label = entry.source_title || entry.title;
    const bncc =
      entry.bncc_codigos?.length > 0 ? `[${entry.bncc_codigos.join(", ")}] ` : "";
    return `- ${bncc}${label}: ${entry.summary}`;
  });

  const block = [
    "CONTEXTO VERIFICADO DO RESERVATÓRIO PLANIFY (não invente fatos além disto):",
    ...lines,
  ].join("\n");

  return [observacoes?.trim(), block].filter(Boolean).join("\n\n");
}

async function recordApprovedHits(
  entries: PedagogicalCacheEntry[],
  options?: {
    userId?: string | null;
    toolTipo?: string;
    trigger?: string;
  },
): Promise<void> {
  for (const entry of entries) {
    await recordCacheHit(
      entry.id,
      options?.userId ?? null,
      options?.trigger === "snippet" ? "snippet" : "generation_inject",
      options?.toolTipo,
    );
  }
}

function logInjectSkipped(
  query: PedagogicalScrapeQuery,
  reason: string,
  options?: { toolTipo?: string; candidateCount?: number },
): void {
  logOperationalEvent({
    eventType: "pedagogical_inject_skipped",
    toolTipo: options?.toolTipo || "pedagogical_cache",
    ok: true,
    metadata: {
      reason,
      tema: query.tema,
      candidateCount: options?.candidateCount ?? 0,
    },
  });
}

export async function resolvePedagogicalContext(
  query: PedagogicalScrapeQuery,
  options?: {
    allowScrape?: boolean;
    minApproved?: number;
    userId?: string | null;
    toolTipo?: string;
    trigger?: string;
  },
): Promise<PedagogicalContextResult> {
  const minApproved = options?.minApproved ?? 1;
  const [cacheApproved, corpusApproved] = await Promise.all([
    findApprovedEntries(query),
    findApprovedCorpusCandidates(query),
  ]);

  const seenIds = new Set<string>();
  const approved = [...cacheApproved, ...corpusApproved].filter((entry) => {
    if (seenIds.has(entry.id)) return false;
    seenIds.add(entry.id);
    return true;
  });

  if (approved.length >= minApproved) {
    const confidence = filterEntriesByConfidence(query, approved);

    if (!confidence.pass) {
      logInjectSkipped(query, confidence.reason, {
        toolTipo: options?.toolTipo,
        candidateCount: approved.length,
      });
      return { kind: "empty" };
    }

    const entries = confidence.entries.slice(0, minApproved === 1 ? 3 : minApproved);

    await recordApprovedHits(entries, options);

    logOperationalEvent({
      eventType: "pedagogical_cache_hit",
      toolTipo: options?.toolTipo || "pedagogical_cache",
      ok: true,
      metadata: {
        count: entries.length,
        tema: query.tema,
        match: confidence.reason,
      },
    });

    return {
      kind: "cache_hit",
      entries,
      tokensSaved: estimateTokensSaved(entries.length),
    };
  }

  if (!options?.allowScrape) {
    if (options?.userId) {
      await recordCacheMissUsage(options.userId, options?.toolTipo);
    }
    return { kind: "empty" };
  }

  logOperationalEvent({
    eventType: "pedagogical_cache_miss",
    toolTipo: options?.toolTipo || "pedagogical_cache",
    ok: true,
    metadata: {
      tema: query.tema,
      componente: query.componente,
      etapa: query.etapa,
    },
  });

  const { entries: scraped, jobId } = await scrapePedagogicalSources({
    query,
    trigger: options?.trigger || "user_miss",
    requestedBy: options?.userId ?? null,
  });

  const newlyApproved = scraped.filter((e) => e.review_status === "approved");

  if (newlyApproved.length >= minApproved) {
    const confidence = filterEntriesByConfidence(query, newlyApproved);

    if (!confidence.pass) {
      logInjectSkipped(query, confidence.reason, {
        toolTipo: options?.toolTipo,
        candidateCount: newlyApproved.length,
      });
      return {
        kind: "cache_miss",
        scraped,
        jobId,
      };
    }

    const entries = confidence.entries.slice(0, minApproved === 1 ? 3 : minApproved);

    await recordApprovedHits(entries, { ...options, trigger: "snippet" });

    return {
      kind: "cache_hit",
      entries,
      tokensSaved: estimateTokensSaved(entries.length),
    };
  }

  return {
    kind: "cache_miss",
    scraped,
    jobId,
  };
}
