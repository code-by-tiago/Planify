import "server-only";

import type {
  PedagogicalScrapeQuery,
  PedagogicalScrapeResult,
  PedagogicalSourceAdapter,
} from "./pedagogical-source-adapter";

/**
 * Stub para OER futuros (Domínio Público, etc.).
 * canHandle sempre false na v1 — ver docs/pedagogical-cache-adapters.md.
 */
export const oerStubAdapter: PedagogicalSourceAdapter = {
  slug: "dominio-publico",

  canHandle(_query: PedagogicalScrapeQuery): boolean {
    return false;
  },

  async fetch(_query: PedagogicalScrapeQuery): Promise<PedagogicalScrapeResult | null> {
    return null;
  },
};
