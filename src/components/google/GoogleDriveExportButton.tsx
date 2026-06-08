"use client";

import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import { GOOGLE_PRODUCT_ICON_CLASS } from "@/components/google/google-icon-button-styles";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { exportToGoogleDrive } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_DRIVE_EXPORT_PENDING_KEY = "planify:google-drive-export-pending";

type GoogleDriveExportButtonProps = {
  title: string;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  returnTo?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
};

export function GoogleDriveExportButton({
  title,
  getHtml,
  getPlanningPayload,
  returnTo = "/dashboard?secao=editor",
  documentType,
  className,
  iconOnly,
  onStatus,
}: GoogleDriveExportButtonProps) {
  const runExport = useCallback(async (params: {
    html: string;
    planningPayload?: Record<string, unknown> | null;
  }) => {
    const result = await exportToGoogleDrive({
      title,
      html: params.html,
      documentType,
      planningPayload: params.planningPayload,
    });

    const url =
      result.drive.webViewLink ||
      `https://drive.google.com/file/d/${result.drive.fileId}/view`;

    return { openUrl: url };
  }, [documentType, title]);

  return (
    <GoogleProductExportButton
      title={title}
      getHtml={getHtml}
      getPlanningPayload={getPlanningPayload}
      returnTo={returnTo}
      className={className}
      iconOnly={iconOnly}
      alwaysShowExport
      icon={<GoogleDriveIcon className={GOOGLE_PRODUCT_ICON_CLASS} />}
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
