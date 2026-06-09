"use client";

import type { CommunityProfileSearchResult } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useState } from "react";

type UseCommunityProfileSearchOptions = {
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
};

export function useCommunityProfileSearch({
  enabled = true,
  debounceMs = 300,
  minQueryLength = 2,
}: UseCommunityProfileSearchOptions = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommunityProfileSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trimmedQuery = query.trim();
  const canSearch = enabled && trimmedQuery.length >= minQueryLength;

  const search = useCallback(async () => {
    if (!canSearch) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("q", trimmedQuery);

      const response = await fetch(`/api/community/profiles/search?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        profiles?: CommunityProfileSearchResult[];
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível buscar professores.");
      }

      setResults(data?.profiles || []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Erro ao buscar professores.");
    } finally {
      setLoading(false);
    }
  }, [canSearch, trimmedQuery]);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setError("");
      return;
    }

    const timer = window.setTimeout(() => {
      void search();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, search]);

  return {
    query,
    setQuery,
    trimmedQuery,
    canSearch,
    results,
    loading,
    error,
    refresh: search,
  };
}
