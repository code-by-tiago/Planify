"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { useMarketplaceMaterialHtml } from "@/hooks/useMarketplaceMaterialHtml";
import { resolveDocumentTypeFromMarketplaceItem } from "@/lib/documents/document-export-context";
import { materialExportAllows } from "@/lib/export/material-export-policy";
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
  const { html, loading, error, ensureHtml, getHtml, canExportGoogle } =
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

  const isPlanningMaterial = documentType.includes("planejamento");
  const planningPayloadReady =
    !isPlanningMaterial || Boolean(html && extractPlanningPayloadFromHtml(html));

  const googleDisabled = (!canExportGoogle && !loading) || (isPlanningMaterial && !planningPayloadReady);
  const googleDisabledTitle = isPlanningMaterial && !planningPayloadReady
    ? "Planejamento publicado sem matriz oficial. Abra no editor e republica na Comunidade para exportar com o modelo oficial."
    : error ||
      "Conteúdo ainda não carregado. Abra no editor ou aguarde o carregamento.";

  const canDownloadPdf =
    materialExportAllows("pdf-download", documentType, html || undefined) ||
    String(item.fileMime || "").includes("pdf");

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
          returnTo={returnTo}
          onStatus={handleStatus}
          compact
          classroomMode="popover"
          disabled={googleDisabled}
          disabledTitle={googleDisabledTitle}
          onDownloadPdf={
            canDownloadPdf ? () => onDownload(item, "pdf") : undefined
          }
          downloadingPdf={downloadingKey === `${item.id}:pdf`}
        />
      </div>
      {exportStatus ? (
        <p className="text-[10px] font-semibold text-emerald-700">{exportStatus}</p>
      ) : null}
      {error && !canExportGoogle ? (
        <p className="text-[10px] font-medium text-slate-500">{error}</p>
      ) : null}
      {isPlanningMaterial && canExportGoogle && !planningPayloadReady ? (
        <p className="text-[10px] font-medium text-amber-700">{googleDisabledTitle}</p>
      ) : null}
    </div>
  );
}
