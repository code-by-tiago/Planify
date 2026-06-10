"use client";

import { DocumentDownloadIconBar } from "@/components/documents/DocumentDownloadIconBar";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import {
  getHistoryItemHtml,
  getHistoryPlanningPayload,
  resolveDocumentTypeFromHistoryItem,
} from "@/lib/documents/document-export-context";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import { isSlideDeckHtml } from "@/lib/slides/slide-deck-utils";
import type { HistoryItem } from "@/types/history";
import { useCallback, useState } from "react";

type HistoryDocumentExportBarProps = {
  item: HistoryItem;
  returnTo?: string;
  onStatus?: (message: string) => void;
  onError?: (error: unknown) => void;
  classroomMode?: "panel" | "popover";
  showDownloads?: boolean;
};

export function HistoryDocumentExportBar({
  item,
  returnTo = "/dashboard?secao=historico",
  onStatus,
  onError,
  classroomMode = "popover",
  showDownloads = true,
}: HistoryDocumentExportBarProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getHtml = useCallback(() => getHistoryItemHtml(item), [item]);
  const getPlanningPayload = useCallback(() => getHistoryPlanningPayload(item), [item]);
  const documentType = resolveDocumentTypeFromHistoryItem(item);
  const html = getHistoryItemHtml(item);
  const isSlideDeck =
    documentType.includes("slides") || (html ? isSlideDeckHtml(html) : false);
  const isPdfNative = documentType.toLowerCase().includes("pdf");

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      await downloadEditorExport({
        title: item.title,
        html: getHtml(),
        format: "pdf",
        documentType,
      });
      onStatus?.("Download PDF iniciado.");
    } catch (err) {
      onError?.(err);
      onStatus?.(err instanceof Error ? err.message : "Erro no download.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <GoogleDocumentExportBar
        title={item.title}
        getHtml={getHtml}
        getPlanningPayload={getPlanningPayload}
        documentType={documentType}
        isSlideDeck={isSlideDeck}
        returnTo={returnTo}
        onStatus={onStatus}
        onExportError={onError}
        compact
        classroomMode={classroomMode}
      />
      {showDownloads && isPdfNative ? (
        <DocumentDownloadIconBar
          onDownloadPdf={() => void handleDownloadPdf()}
          downloadingPdf={downloadingPdf}
        />
      ) : null}
    </div>
  );
}
