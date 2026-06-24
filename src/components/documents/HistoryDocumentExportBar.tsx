"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import {
  getHistoryItemHtml,
  getHistoryPlanningPayload,
  resolveDocumentTypeFromHistoryItem,
} from "@/lib/documents/document-export-context";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import type { HistoryItem } from "@/types/history";
import { useCallback, useState } from "react";

type HistoryDocumentExportBarProps = {
  item: HistoryItem;
  returnTo?: string;
  onStatus?: (message: string) => void;
  onError?: (error: unknown) => void;
  classroomMode?: "panel" | "popover";
};

export function HistoryDocumentExportBar({
  item,
  returnTo = "/dashboard?secao=historico",
  onStatus,
  onError,
  classroomMode = "popover",
}: HistoryDocumentExportBarProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getHtml = useCallback(() => getHistoryItemHtml(item), [item]);
  const getPlanningPayload = useCallback(() => getHistoryPlanningPayload(item), [item]);
  const documentType = resolveDocumentTypeFromHistoryItem(item);

  const handleDownloadPdf = useCallback(async () => {
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
  }, [documentType, getHtml, item.title, onError, onStatus]);

  return (
    <GoogleDocumentExportBar
      title={item.title}
      getHtml={getHtml}
      getPlanningPayload={getPlanningPayload}
      documentType={documentType}
      returnTo={returnTo}
      onStatus={onStatus}
      onExportError={onError}
      compact
      classroomMode={classroomMode}
      onDownloadPdf={() => void handleDownloadPdf()}
      downloadingPdf={downloadingPdf}
    />
  );
}
