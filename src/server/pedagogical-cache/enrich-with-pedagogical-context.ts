import "server-only";

import type { PedagogicalScrapeQuery } from "./adapters/pedagogical-source-adapter";
import {
  appendPedagogicalContext,
  resolvePedagogicalContext,
} from "./pedagogical-context-resolver";

export type EnrichWithPedagogicalContextInput = {
  observacoes?: string;
  tema?: string;
  componenteCurricular?: string;
  componente?: string;
  disciplina?: string;
  discipline?: string;
  etapa?: string;
  anoSerie?: string;
  bnccCodigos?: string[];
  habilidadesSelecionadas?: Array<{ codigo?: string }>;
  habilidadesBncc?: Array<{ codigo?: string }>;
};

export type EnrichWithPedagogicalContextOptions = {
  userId?: string | null;
  toolTipo?: string;
  allowScrape?: boolean;
};

function extractBnccCodigos(input: EnrichWithPedagogicalContextInput): string[] {
  const fromSkills = [
    ...(input.habilidadesSelecionadas || []),
    ...(input.habilidadesBncc || []),
  ]
    .map((skill) => String(skill.codigo || "").trim().toUpperCase())
    .filter(Boolean);

  return [...new Set([...(input.bnccCodigos || []), ...fromSkills])];
}

export function mapToPedagogicalQuery(
  input: EnrichWithPedagogicalContextInput,
): PedagogicalScrapeQuery | null {
  const tema = String(input.tema || "").trim();
  const bnccCodigos = extractBnccCodigos(input);

  if (!tema && !bnccCodigos.length) return null;

  return {
    tema,
    componente:
      input.componenteCurricular ||
      input.componente ||
      input.disciplina ||
      input.discipline,
    etapa: input.etapa,
    anoSerie: input.anoSerie,
    bnccCodigos,
  };
}

export async function enrichWithPedagogicalContext<
  T extends { observacoes?: string },
>(
  payload: T,
  input: EnrichWithPedagogicalContextInput,
  options?: EnrichWithPedagogicalContextOptions,
): Promise<T> {
  const query = mapToPedagogicalQuery(input);
  if (!query) return payload;

  const pedagogy = await resolvePedagogicalContext(query, {
    allowScrape: options?.allowScrape ?? true,
    minApproved: 1,
    userId: options?.userId ?? null,
    toolTipo: options?.toolTipo,
    trigger: "generation_inject",
  });

  if (pedagogy.kind !== "cache_hit" || !pedagogy.entries.length) {
    return payload;
  }

  return {
    ...payload,
    observacoes: appendPedagogicalContext(payload.observacoes, pedagogy.entries),
  };
}
