"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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

/** Download local apenas PDF (materiais nativos). Documentos textuais usam Google Docs. */
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
        aria-label="Baixar PDF"
        title="Baixar PDF"
      >
        <PlanifyIcon
          name="download"
          className={`${GOOGLE_PRODUCT_ICON_CLASS} text-rose-700`}
        />
      </button>
    </div>
  );
}
