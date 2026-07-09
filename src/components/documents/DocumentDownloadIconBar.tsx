"use client";

import { PdfProductIcon } from "@/components/documents/PdfProductIcon";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";

type DocumentDownloadIconBarProps = {
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
  onDownloadDocx?: () => void;
  downloadingDocx?: boolean;
  disabled?: boolean;
  className?: string;
};

function DocxProductIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="2.5" fill="#2B579A" />
      <path
        d="M7.5 8.5h9M7.5 12h9M7.5 15.5h6"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Downloads locais (PDF / DOCX) na barra ao lado do Google. */
export function DocumentDownloadIconBar({
  onDownloadPdf,
  downloadingPdf = false,
  onDownloadDocx,
  downloadingDocx = false,
  disabled = false,
  className = "",
}: DocumentDownloadIconBarProps) {
  if (!onDownloadPdf && !onDownloadDocx) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {onDownloadDocx ? (
        <button
          type="button"
          disabled={disabled || downloadingDocx}
          onClick={onDownloadDocx}
          className={GOOGLE_ICON_ONLY_BUTTON_CLASS}
          aria-label={downloadingDocx ? "Baixando documento…" : "Baixar DOC/DOCX"}
          title={downloadingDocx ? "Baixando documento…" : "Baixar DOC/DOCX"}
        >
          <DocxProductIcon className={GOOGLE_PRODUCT_ICON_CLASS} />
        </button>
      ) : null}
      {onDownloadPdf ? (
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
      ) : null}
    </div>
  );
}
