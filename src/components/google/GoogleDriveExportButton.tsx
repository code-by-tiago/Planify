"use client";

import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleDrive } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_DRIVE_EXPORT_PENDING_KEY = "planify:google-drive-export-pending";

type GoogleDriveExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  className?: string;
  onStatus?: (message: string) => void;
};

export function GoogleDriveExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  className,
  onStatus,
}: GoogleDriveExportButtonProps) {
  const runExport = useCallback(async () => {
    const result = await exportToGoogleDrive({
      title,
      html: getHtml(),
    });

    const url =
      result.drive.webViewLink ||
      `https://drive.google.com/file/d/${result.drive.fileId}/view`;

    return { openUrl: url };
  }, [getHtml, title]);

  return (
    <GoogleProductExportButton
      title={title}
      returnTo={returnTo}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
      }
      alwaysShowExport
      icon={<GoogleDriveIcon className="h-4 w-4 shrink-0" />}
      productName="Google Drive"
      configLabel="Drive (config)"
      loginLabel="Drive"
      labels={{
        exportConnected: "Google Drive",
        exportConnect: "Conectar Google Drive",
        creating: "Salvando…",
        connecting: "Conectando…",
        connect: "Conectar Google",
      }}
      exportTitle="Salva uma cópia DOCX no Google Drive"
      pendingStorageKey={GOOGLE_DRIVE_EXPORT_PENDING_KEY}
      onExport={runExport}
      onStatus={onStatus}
    />
  );
}
