import "server-only";

import { computeContentHash } from "@/lib/pedagogical-cache/topic-signature";
import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";
import { resolveAdapterForSource } from "./pedagogical-adapter-registry";
import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";
import { formatPedagogicalSnippet } from "./format-pedagogical-snippet";
import {
  createScrapeJob,
  getActiveSources,
  type PedagogicalCacheEntry,
  updateScrapeJob,
  upsertCacheEntry,
} from "./pedagogical-cache-db-service";

const SCRAPE_TIMEOUT_MS = 12_000;
const MAX_RESULTS = 2;

type SourceConfig = {
  auto_approve?: boolean;
  confidence_threshold?: number;
  ttl_days?: number;
};

function expiresAtFromTtl(days?: number): string | null {
  if (!days || days <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function scrapePedagogicalSources(input: {
  query: PedagogicalScrapeQuery;
  trigger: string;
  requestedBy?: string | null;
}): Promise<{ entries: PedagogicalCacheEntry[]; jobId: string }> {
  const started = Date.now();
  const jobId = await createScrapeJob({
    trigger: input.trigger,
    query: input.query,
    requestedBy: input.requestedBy,
  });

  await updateScrapeJob(jobId, {
    status: "running",
    started_at: new Date().toISOString(),
  });

  const sources = await getActiveSources();
  const seenHashes = new Set<string>();
  const entries: PedagogicalCacheEntry[] = [];
  const attempted: string[] = [];
  let created = 0;
  let updated = 0;

  const work = async () => {
    for (const source of sources) {
      if (entries.length >= MAX_RESULTS) break;

      const adapter = resolveAdapterForSource(source);
      if (!adapter || !adapter.canHandle(input.query)) continue;

      attempted.push(source.slug);

      try {
        const result = await adapter.fetch(input.query);
        if (!result) continue;

        const contentHash = computeContentHash(result.bodyMarkdown, result.title);
        if (seenHashes.has(contentHash)) continue;
        seenHashes.add(contentHash);

        let bodyMarkdown = result.bodyMarkdown;
        let formatApplied = false;
        let aiTokensUsed = 0;

        if (!bodyMarkdown.includes("##")) {
          const formatted = await formatPedagogicalSnippet({
            title: result.title,
            rawText: result.bodyMarkdown,
          });
          bodyMarkdown = formatted.bodyMarkdown;
          formatApplied = formatted.aiTokensUsed > 0;
          aiTokensUsed = formatted.aiTokensUsed;

          if (formatApplied) {
            logOperationalEvent({
              eventType: "pedagogical_format_only",
              toolTipo: "pedagogical_cache",
              ok: true,
              metadata: { source: source.slug, tokens: aiTokensUsed },
            });
          }
        }

        const config = (source.config || {}) as SourceConfig;
        const threshold = config.confidence_threshold ?? 0.95;
        const autoApprove =
          Boolean(config.auto_approve) && result.confidence >= threshold;

        const { entry, created: wasCreated } = await upsertCacheEntry({
          query: input.query,
          sourceId: source.id,
          sourceSlug: source.slug,
          title: result.title,
          summary: result.summary,
          bodyMarkdown,
          contentType: result.contentType,
          sourceUrl: result.sourceUrl,
          sourceTitle: result.sourceTitle,
          sourceLicense: result.license,
          bnccCodigos: result.bnccCodigos,
          reviewStatus: autoApprove ? "approved" : "pending",
          formatApplied,
          aiTokensUsed,
          expiresAt: expiresAtFromTtl(config.ttl_days),
        });

        entries.push(entry);
        if (wasCreated) created += 1;
        else updated += 1;
      } catch {
        continue;
      }
    }
  };

  try {
    await Promise.race([
      work(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SCRAPE_TIMEOUT")), SCRAPE_TIMEOUT_MS),
      ),
    ]);

    await updateScrapeJob(jobId, {
      status: "completed",
      sources_attempted: attempted,
      entries_created: created,
      entries_updated: updated,
      duration_ms: Date.now() - started,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed";
    await updateScrapeJob(jobId, {
      status: message === "SCRAPE_TIMEOUT" ? "skipped" : "failed",
      sources_attempted: attempted,
      entries_created: created,
      entries_updated: updated,
      error_code: message === "SCRAPE_TIMEOUT" ? "timeout" : "scrape_error",
      error_message: message,
      duration_ms: Date.now() - started,
      completed_at: new Date().toISOString(),
    });
  }

  return { entries, jobId };
}
