"use client";

import { PdfProductIcon } from "@/components/documents/PdfProductIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";

type DocumentDownloadIconBarProps = {
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Download local em PDF — ícone na barra de exportação ao lado do Google. */
export function DocumentDownloadIconBar({
  onDownloadPdf,
  downloadingPdf = false,
  disabled = false,
  className = "",
}: DocumentDownloadIconBarProps) {
  if (!onDownloadPdf) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        disabled={disabled || downloadingPdf}
        onClick={onDownloadPdf}
        className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
        aria-label={downloadingPdf ? "Gerando PDF…" : "Baixar PDF"}
        title={downloadingPdf ? "Gerando PDF…" : "Baixar PDF"}
      >
        <PdfProductIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
      </button>
    </div>
  );
}
