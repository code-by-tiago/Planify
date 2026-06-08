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
  returnTo?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
};

export function GoogleDocsExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  documentType,
  className,
  iconOnly,
  onStatus,
}: GoogleDocsExportButtonProps) {
  const runExport = useCallback(async () => {
    const result = await exportToGoogleDocs({
      title,
      html: getHtml(),
      documentType,
    });

    return { openUrl: result.documentUrl };
  }, [documentType, getHtml, title]);

  return (
    <GoogleProductExportButton
      title={title}
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
    />
  );
}
