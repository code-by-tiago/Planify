"use client";

import { DocumentDownloadIconBar } from "@/components/documents/DocumentDownloadIconBar";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { useMarketplaceMaterialHtml } from "@/hooks/useMarketplaceMaterialHtml";
import { resolveDocumentTypeFromMarketplaceItem } from "@/lib/documents/document-export-context";
import { extractPlanningPayloadFromHtml } from "@/lib/planejamentos/planning-export-embed";
import type { CommunityFeedItem } from "@/lib/community/types";
import type { MarketplaceDownloadFormat } from "@/lib/marketplace/marketplace-download-client";
import { useCallback, useEffect, useState } from "react";

type CommunityMaterialExportBarProps = {
  item: CommunityFeedItem;
  downloadingKey: string | null;
  onDownload: (item: CommunityFeedItem, format: MarketplaceDownloadFormat) => void;
  onStatus?: (message: string) => void;
  returnTo?: string;
};

export function CommunityMaterialExportBar({
  item,
  downloadingKey,
  onDownload,
  onStatus,
  returnTo,
}: CommunityMaterialExportBarProps) {
  const { html, isSlideDeck, loading, error, ensureHtml, getHtml, canExportGoogle } =
    useMarketplaceMaterialHtml(item.id);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    void ensureHtml().catch(() => {
      // Falha silenciosa — PDF nativo ainda pode funcionar.
    });
  }, [ensureHtml]);

  const documentType = resolveDocumentTypeFromMarketplaceItem({
    tipoMaterial: item.tipoMaterial,
    fileMime: item.fileMime,
  });

  const isPdfNative =
    String(item.fileMime || "").includes("pdf") ||
    documentType.toLowerCase().includes("pdf");

  const getHtmlForExport = useCallback(() => {
    const content = getHtml();
    if (content.trim().length >= 20) {
      return content;
    }
    throw new Error("Conteúdo ainda não carregado.");
  }, [getHtml]);

  const getPlanningPayload = useCallback(() => {
    const content = getHtml();
    return extractPlanningPayloadFromHtml(content);
  }, [getHtml]);

  const handleStatus = useCallback(
    (message: string) => {
      setExportStatus(message);
      onStatus?.(message);
    },
    [onStatus],
  );

  const googleDisabled = !canExportGoogle && !loading;
  const googleDisabledTitle =
    error ||
    "Use Google Docs para exportar. Materiais sem HTML exigem abrir no editor primeiro.";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Exportar
        </span>
        {loading ? (
          <span className="text-[10px] font-semibold text-slate-400">Carregando…</span>
        ) : null}
        <GoogleDocumentExportBar
          title={item.title}
          getHtml={getHtmlForExport}
          getPlanningPayload={
            documentType.includes("planejamento") ? getPlanningPayload : undefined
          }
          documentType={documentType}
          isSlideDeck={isSlideDeck}
          returnTo={returnTo}
          onStatus={handleStatus}
          compact
          classroomMode="popover"
          disabled={googleDisabled}
          disabledTitle={googleDisabledTitle}
        />
        {isPdfNative ? (
          <DocumentDownloadIconBar
            onDownloadPdf={() => onDownload(item, "pdf")}
            downloadingPdf={downloadingKey === `${item.id}:pdf`}
          />
        ) : null}
      </div>
      {exportStatus ? (
        <p className="text-[10px] font-semibold text-emerald-700">{exportStatus}</p>
      ) : null}
      {error && !canExportGoogle ? (
        <p className="text-[10px] font-medium text-slate-500">{error}</p>
      ) : null}
    </div>
  );
}
