export type BnccTemaAutocompleteSkill = {
  id: string;
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
};

export type BnccTemaAutocompleteSuggestion = {
  id: string;
  label: string;
  tema: string;
  unidadeTematica?: string;
  objetoConhecimento?: string;
  componente?: string;
  habilidades: BnccTemaAutocompleteSkill[];
  score: number;
};

import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

export type BnccTemaAutocompleteQuery = {
  query: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  limit?: number;
  /** Lista temas BNCC do contexto quando query < 2 chars (prefetch ao focar). */
  browse?: boolean;
};

export async function fetchBnccTemaSuggestions(
  input: BnccTemaAutocompleteQuery,
): Promise<BnccTemaAutocompleteSuggestion[]> {
  const trimmedQuery = input.query.trim();
  const canBrowse =
    Boolean(input.browse) &&
    trimmedQuery.length < 2 &&
    Boolean(input.componente?.trim()) &&
    Boolean((input.anoSerie || input.etapa)?.trim());

  if (!canBrowse && trimmedQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams();
  if (trimmedQuery.length >= 2) {
    params.set("q", trimmedQuery);
  } else if (canBrowse) {
    params.set("q", "");
  }

  if (input.etapa?.trim()) params.set("etapa", input.etapa.trim());
  if (input.anoSerie?.trim()) params.set("anoSerie", input.anoSerie.trim());
  if (input.componente?.trim()) params.set("componente", input.componente.trim());
  if (input.limit) params.set("limit", String(input.limit));

  const response = await planifyAuthenticatedFetch(
    `/api/bncc/autocomplete?${params.toString()}`,
  );

  const data = (await response.json().catch(() => null)) as {
    success?: boolean;
    suggestions?: BnccTemaAutocompleteSuggestion[];
    error?: { message?: string };
  } | null;

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.error?.message || "Não foi possível buscar sugestões de tema BNCC.",
    );
  }

  return data.suggestions || [];
}
