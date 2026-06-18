"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBnccTemaSuggestions,
  type BnccTemaAutocompleteSuggestion,
} from "./bncc-tema-autocomplete";

type UseBnccTemaAutocompleteOptions = {
  query: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  enabled?: boolean;
  /** Prefetch temas BNCC do contexto ao focar (query vazia). */
  prefetchOnFocus?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
};

export function useBnccTemaAutocomplete({
  query,
  etapa,
  anoSerie,
  componente,
  enabled = true,
  prefetchOnFocus = false,
  debounceMs = 300,
  minQueryLength = 2,
}: UseBnccTemaAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<BnccTemaAutocompleteSuggestion[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trimmedQuery = query.trim();
  const contextReady = Boolean(
    componente?.trim() && (anoSerie?.trim() || etapa?.trim()),
  );
  const browseMode =
    prefetchOnFocus && contextReady && trimmedQuery.length < minQueryLength;
  const canSearch =
    enabled &&
    (trimmedQuery.length >= minQueryLength ||
      (browseMode && trimmedQuery.length === 0));

  const search = useCallback(async () => {
    if (!canSearch) {
      setSuggestions([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextSuggestions = await fetchBnccTemaSuggestions({
        query: trimmedQuery,
        etapa,
        anoSerie,
        componente,
        browse: browseMode,
      });
      setSuggestions(nextSuggestions);
    } catch (err) {
      setSuggestions([]);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar sugestões de tema BNCC.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    anoSerie,
    browseMode,
    canSearch,
    componente,
    etapa,
    trimmedQuery,
  ]);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setError("");
      return;
    }

    const timer = window.setTimeout(() => {
      void search();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, search]);

  return {
    trimmedQuery,
    canSearch,
    browseMode,
    suggestions,
    loading,
    error,
  };
}
