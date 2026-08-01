import "server-only";

import type { PedagogicalSource } from "./pedagogical-cache-db-service";
import {
  bnccGovOrientacoesAdapter,
  bnccSkillsAdapter,
  createBnccGovAdapter,
} from "./adapters/bncc-gov-adapter";
import { oerStubAdapter } from "./adapters/oer-stub-adapter";
import type { PedagogicalSourceAdapter } from "./adapters/pedagogical-source-adapter";
import { wikipediaPtAdapter } from "./adapters/wikipedia-pt-adapter";

const STATIC_ADAPTERS: Record<string, PedagogicalSourceAdapter> = {
  "wikipedia-pt": wikipediaPtAdapter,
  "bncc-skills": bnccSkillsAdapter,
  "bncc-gov-orientacoes": bnccGovOrientacoesAdapter,
  "dominio-publico": oerStubAdapter,
};

export function resolveAdapterForSource(
  source: PedagogicalSource,
): PedagogicalSourceAdapter | null {
  if (STATIC_ADAPTERS[source.slug]) {
    return STATIC_ADAPTERS[source.slug];
  }

  const config = (source.config || {}) as Record<string, unknown>;
  const seedUrls = Array.isArray(config.seed_urls)
    ? (config.seed_urls as string[])
    : [];

  if (source.adapter_type === "bncc_local") {
    return createBnccGovAdapter({ slug: source.slug, mode: "bncc_local" });
  }

  if (source.adapter_type === "html_scrape") {
    return createBnccGovAdapter({
      slug: source.slug,
      mode: "html_scrape",
      seedUrls,
    });
  }

  if (source.adapter_type === "mediawiki" && source.slug === "wikipedia-pt") {
    return wikipediaPtAdapter;
  }

  if (source.adapter_type === "oer_api") {
    return oerStubAdapter;
  }

  return null;
}

export function getRegisteredAdapterSlugs(): string[] {
  return Object.keys(STATIC_ADAPTERS);
}
