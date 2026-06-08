"use client";

import { GoogleDocsIcon } from "@/components/google/GoogleDocsIcon";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleDocs } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_DOCS_EXPORT_PENDING_KEY = "planify:google-docs-export-pending";

type GoogleDocsExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  className?: string;
  onStatus?: (message: string) => void;
};

export function GoogleDocsExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  className,
  onStatus,
}: GoogleDocsExportButtonProps) {
  const runExport = useCallback(async () => {
    const result = await exportToGoogleDocs({
      title,
      html: getHtml(),
    });

    return { openUrl: result.documentUrl };
  }, [getHtml, title]);

  return (
    <GoogleProductExportButton
      title={title}
      returnTo={returnTo}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
      }
      alwaysShowExport
      icon={<GoogleDocsIcon className="h-4 w-4 shrink-0" />}
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
