"use client";

import { GoogleDocsIcon } from "@/components/google/GoogleDocsIcon";
import { GOOGLE_PRODUCT_ICON_CLASS } from "@/components/google/google-icon-button-styles";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleDocs } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_DOCS_EXPORT_PENDING_KEY = "planify:google-docs-export-pending";

type GoogleDocsExportButtonProps = {
  title: string;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  returnTo?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
};

export function GoogleDocsExportButton({
  title,
  getHtml,
  getPlanningPayload,
  returnTo = "/dashboard?secao=editor",
  documentType,
  className,
  iconOnly,
  onStatus,
  onExportError,
}: GoogleDocsExportButtonProps) {
  const runExport = useCallback(async (params: {
    html: string;
    planningPayload?: Record<string, unknown> | null;
    previewWindow?: Window | null;
  }) => {
    const result = await exportToGoogleDocs({
      title,
      html: params.html,
      documentType,
      planningPayload: params.planningPayload,
    });

    const previewWindow = params.previewWindow;
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = result.documentUrl;
    }

    if (result.exportEngine === "official") {
      onStatus?.("Google Docs aberto com o modelo oficial do planejamento.");
    } else if (params.planningPayload) {
      onStatus?.("Google Docs aberto (matriz não reconhecida — layout simplificado).");
    }

    return { openUrl: result.documentUrl, openedInPreview: Boolean(previewWindow && !previewWindow.closed) };
  }, [documentType, onStatus, title]);

  return (
    <GoogleProductExportButton
      title={title}
      getHtml={getHtml}
      getPlanningPayload={getPlanningPayload}
      returnTo={returnTo}
      className={className}
      iconOnly={iconOnly}
      alwaysShowExport
      icon={<GoogleDocsIcon className={GOOGLE_PRODUCT_ICON_CLASS} />}
      productName="Google Docs"
      configLabel="Docs (config)"
      loginLabel="Docs"
      labels={{
        exportConnected: "Google Docs",
        exportConnect: "Conectar Google Docs",
        creating: "Abrindo…",
        connecting: "Conectando…",
        connect: "Conectar Google",
      }}
      exportTitle="Exporta o documento para o Google Docs"
      pendingStorageKey={GOOGLE_DOCS_EXPORT_PENDING_KEY}
      onExport={runExport}
      onStatus={onStatus}
      onExportError={onExportError}
    />
  );
}
