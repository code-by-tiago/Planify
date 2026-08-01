export type PedagogicalContextEntry = {
  id: string;
  title: string;
  summary: string;
  bodyMarkdown?: string;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  sourceLicense?: string | null;
  bnccCodigos?: string[];
  reviewStatus?: string;
  sourceSlug?: string;
};

export type PedagogicalContextResponse = {
  success: boolean;
  kind: "cache_hit" | "cache_miss" | "empty";
  entries: PedagogicalContextEntry[];
  tokensSaved?: number;
  jobId?: string;
  message?: string;
};

export type PedagogicalContextQuery = {
  tema: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
  bnccCodigos?: string[];
};

export async function fetchPedagogicalContext(
  query: PedagogicalContextQuery,
  options?: { search?: boolean },
): Promise<PedagogicalContextResponse> {
  if (options?.search) {
    const response = await fetch("/api/pedagogico/buscar", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    return (await response.json()) as PedagogicalContextResponse;
  }

  const params = new URLSearchParams();
  if (query.tema) params.set("tema", query.tema);
  if (query.componente) params.set("componente", query.componente);
  if (query.etapa) params.set("etapa", query.etapa);
  if (query.anoSerie) params.set("anoSerie", query.anoSerie);
  if (query.bnccCodigos?.length) {
    params.set("bncc", query.bnccCodigos.join(","));
  }

  const response = await fetch(`/api/pedagogico/contexto?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });

  return (await response.json()) as PedagogicalContextResponse;
}

export function buildPedagogicalObservacoes(
  entries: PedagogicalContextEntry[],
  existing?: string,
): string {
  if (!entries.length) return existing?.trim() || "";

  const lines = entries.map((entry) => {
    const bncc =
      entry.bnccCodigos?.length ? `[${entry.bnccCodigos.join(", ")}] ` : "";
    const label = entry.sourceTitle || entry.title;
    return `- ${bncc}${label}: ${entry.summary}`;
  });

  const block = [
    "CONTEXTO VERIFICADO DO RESERVATÓRIO PLANIFY (não invente fatos além disto):",
    ...lines,
  ].join("\n");

  return [existing?.trim(), block].filter(Boolean).join("\n\n");
}
