"use client";

import { GoogleDocsIcon } from "@/components/google/GoogleDocsIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import {
  fetchGoogleStatus,
  startGoogleOAuth,
} from "@/lib/google/google-api-client";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import { useCallback, useEffect, useState } from "react";

type OpenMaterialInGoogleDocsButtonProps = {
  materialId: string;
  title: string;
  returnTo?: string;
  onStatus?: (message: string) => void;
  onError?: (message: string) => void;
};

/**
 * Abre DOC/DOCX da Comunidade no Google Docs convertendo o arquivo original.
 */
export function OpenMaterialInGoogleDocsButton({
  materialId,
  title,
  returnTo,
  onStatus,
  onError,
}: OpenMaterialInGoogleDocsButtonProps) {
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    void fetchGoogleStatus()
      .then((status) => setConnected(Boolean(status.connected)))
      .catch(() => setConnected(false));
  }, []);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const status = await fetchGoogleStatus();
      if (!status.connected) {
        const resolvedReturnTo = normalizeGoogleOAuthReturnTo(
          returnTo ||
            (typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search}`
              : "/dashboard?secao=marketplace"),
        );
        await startGoogleOAuth(resolvedReturnTo);
        return;
      }

      const response = await fetch("/api/google/docs/from-material", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error?.message || "Não foi possível abrir no Google Docs.",
        );
      }

      const documentUrl = String(data.data?.documentUrl || "");
      if (!documentUrl) {
        throw new Error("URL do Google Docs não retornada.");
      }

      window.open(documentUrl, "_blank", "noopener,noreferrer");
      onStatus?.(`"${title}" aberto no Google Docs.`);
      setConnected(true);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir no Google Docs.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, materialId, onError, onStatus, returnTo, title]);

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
      aria-label={
        busy
          ? "Abrindo no Google Docs…"
          : connected
            ? "Abrir no Google Docs"
            : "Conectar Google e abrir no Docs"
      }
      title={
        busy
          ? "Abrindo no Google Docs…"
          : connected
            ? "Abrir no Google Docs (arquivo original)"
            : "Conectar Google e abrir no Docs"
      }
    >
      <GoogleDocsIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
    </button>
  );
}
