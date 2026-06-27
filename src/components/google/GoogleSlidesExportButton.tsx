"use client";

import {
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import { GoogleProductExportButton } from "@/components/google/GoogleProductExportButton";
import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";
import { exportToGoogleSlides } from "@/lib/google/google-api-client";
import { useCallback } from "react";

export const GOOGLE_SLIDES_EXPORT_PENDING_KEY =
  "planify:google-slides-export-pending";

type GoogleSlidesExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
};

export function GoogleSlidesExportButton({
  title,
  getHtml,
  returnTo = "/dashboard",
  documentType,
  className,
  iconOnly,
  onStatus,
  onExportError,
}: GoogleSlidesExportButtonProps) {
  const runExport = useCallback(async (params: {
    html: string;
    previewWindow?: Window | null;
  }) => {
    const result = await exportToGoogleSlides({
      title,
      html: params.html,
      documentType,
    });

    const previewWindow = params.previewWindow;
    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = result.presentationUrl;
    }

    if (result.slideCount > 0) {
      onStatus?.(`${result.slideCount} slides criados no Google Slides.`);
    }

    return {
      openUrl: result.presentationUrl,
      openedInPreview: Boolean(previewWindow && !previewWindow.closed),
    };
  }, [documentType, onStatus, title]);

  return (
    <GoogleProductExportButton
      title={title}
      getHtml={getHtml}
      returnTo={returnTo}
      className={className}
      iconOnly={iconOnly}
      alwaysShowExport
      icon={<GoogleProductIcon product="slides" className={GOOGLE_PRODUCT_ICON_CLASS} />}
      productName="Google Slides"
      configLabel="Slides (config)"
      loginLabel="Slides"
      labels={{
        exportConnected: "Google Slides",
        exportConnect: "Conectar Google Slides",
        creating: "Criando slides...",
        connecting: "Conectando...",
        connect: "Conectar Google",
      }}
      exportTitle="Cria uma apresentacao editavel no Google Slides"
      pendingStorageKey={GOOGLE_SLIDES_EXPORT_PENDING_KEY}
      onExport={runExport}
      onStatus={onStatus}
      onExportError={onExportError}
    />
  );
}
