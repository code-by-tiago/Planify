"use client";

import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useRef, useState } from "react";

type PreviewResponse = {
  preview?: {
    kind?: string;
    htmlContent?: string | null;
    isSlidePreview?: boolean;
  };
  error?: { message?: string };
};

const htmlCache = new Map<string, string>();

export function useMarketplaceMaterialHtml(materialId: string) {
  const [html, setHtml] = useState<string | null>(() => htmlCache.get(materialId) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPromiseRef = useRef<Promise<string> | null>(null);

  const ensureHtml = useCallback(async (): Promise<string> => {
    const cached = htmlCache.get(materialId);
    if (cached) {
      setHtml(cached);
      return cached;
    }

    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    setLoading(true);
    setError(null);

    const promise = (async () => {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/preview`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<PreviewResponse>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Pré-visualização indisponível.");
      }

      if (!data) {
        throw new Error("Pré-visualização indisponível.");
      }

      const preview = data.preview;
      const content = String(preview?.htmlContent || "").trim();

      if (preview?.kind !== "html" || !content) {
        throw new Error(
          "Exportação Google disponível apenas para materiais em HTML. Use Google Docs ou abra o material no editor.",
        );
      }

      htmlCache.set(materialId, content);
      setHtml(content);
      return content;
    })();

    fetchPromiseRef.current = promise;

    try {
      return await promise;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar material.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
      fetchPromiseRef.current = null;
    }
  }, [materialId]);

  const getHtml = useCallback(() => html || "", [html]);

  return {
    html,
    loading,
    error,
    ensureHtml,
    getHtml,
    canExportGoogle: Boolean(html),
  };
}
