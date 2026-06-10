import "server-only";

import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";
import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";
import {
  estimateTokensSaved,
  findApprovedEntries,
  recordCacheHit,
  recordCacheMissUsage,
  type PedagogicalCacheEntry,
} from "./pedagogical-cache-db-service";
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
  const approved = await findApprovedEntries(query);

  if (approved.length >= minApproved) {
    for (const entry of approved) {
      await recordCacheHit(
        entry.id,
        options?.userId ?? null,
        options?.trigger === "snippet" ? "snippet" : "generation_inject",
        options?.toolTipo,
      );
    }

    logOperationalEvent({
      eventType: "pedagogical_cache_hit",
      toolTipo: options?.toolTipo || "pedagogical_cache",
      ok: true,
      metadata: { count: approved.length, tema: query.tema },
    });

    return {
      kind: "cache_hit",
      entries: approved,
      tokensSaved: estimateTokensSaved(approved.length),
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
    metadata: { tema: query.tema },
  });

  const { entries: scraped, jobId } = await scrapePedagogicalSources({
    query,
    trigger: options?.trigger || "user_miss",
    requestedBy: options?.userId ?? null,
  });

  const newlyApproved = scraped.filter((e) => e.review_status === "approved");

  if (newlyApproved.length >= minApproved) {
    for (const entry of newlyApproved) {
      await recordCacheHit(
        entry.id,
        options?.userId ?? null,
        "snippet",
        options?.toolTipo,
      );
    }

    return {
      kind: "cache_hit",
      entries: newlyApproved,
      tokensSaved: estimateTokensSaved(newlyApproved.length),
    };
  }

  return {
    kind: "cache_miss",
    scraped,
    jobId,
  };
}
