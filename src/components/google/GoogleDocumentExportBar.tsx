"use client";

import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { GoogleClassroomPopoverButton } from "@/components/google/GoogleClassroomPopoverButton";
import { GoogleDocsExportButton } from "@/components/google/GoogleDocsExportButton";
import { GoogleDriveExportButton } from "@/components/google/GoogleDriveExportButton";
import { GoogleFormsExportButton } from "@/components/google/GoogleFormsExportButton";
import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import { SlidesPptxDownloadButton } from "@/components/documents/SlidesPptxDownloadButton";
import { DocumentDownloadIconBar } from "@/components/documents/DocumentDownloadIconBar";
import {
  resolveFormsExportCompatible,
  resolveSlideDeck,
  resolveSlidesExportCompatible,
} from "@/lib/google/document-type-detection";
import {
  materialExportAllows,
  resolveMaterialExportPolicy,
} from "@/lib/export/material-export-policy";
import { extractSlideThemeFromHtml } from "@/lib/slides/slide-deck-utils";
import { useGoogleOAuthResume } from "@/hooks/useGoogleOAuthResume";
import { useEffect, useMemo, useState } from "react";

export type GoogleDocumentExportBarProps = {
  title: string;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
  documentType?: string | null;
  isSlideDeck?: boolean;
  slideTheme?: string | null;
  returnTo?: string;
  compact?: boolean;
  classroomMode?: "panel" | "popover";
  disabled?: boolean;
  disabledTitle?: string;
  className?: string;
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
};

export function GoogleDocumentExportBar({
  title,
  getHtml,
  getPlanningPayload,
  onStatus,
  onExportError,
  documentType,
  isSlideDeck: isSlideDeckProp,
  slideTheme: slideThemeProp,
  returnTo: returnToProp,
  compact = true,
  classroomMode = "panel",
  disabled = false,
  disabledTitle,
  className = "",
  onDownloadPdf,
  downloadingPdf = false,
}: GoogleDocumentExportBarProps) {
  useGoogleOAuthResume({
    getHtml,
    getPlanningPayload,
    documentType,
    onStatus,
    onExportError,
  });

  const [isSlideMaterial, setIsSlideMaterial] = useState(
    () => resolveSlideDeck(getHtml, documentType, isSlideDeckProp) === true,
  );
  const [showSlidesExport, setShowSlidesExport] = useState(
    () =>
      resolveSlidesExportCompatible(getHtml, documentType, isSlideDeckProp) === true,
  );
  const [slideTheme, setSlideTheme] = useState<string | null>(
    slideThemeProp ?? null,
  );
  const [showFormsExport, setShowFormsExport] = useState(() =>
    resolveFormsExportCompatible(getHtml, documentType),
  );
  const [exportPolicy, setExportPolicy] = useState(() =>
    resolveMaterialExportPolicy(documentType, getHtml()),
  );

  const returnTo = useMemo(() => {
    if (returnToProp) return returnToProp;
    if (typeof window === "undefined") return "/dashboard?secao=editor";
    const current = `${window.location.pathname}${window.location.search}`;
    return current || "/dashboard?secao=editor";
  }, [returnToProp]);

  useEffect(() => {
    const sync = () => {
      const slideMaterial = resolveSlideDeck(getHtml, documentType, isSlideDeckProp);
      setIsSlideMaterial(slideMaterial);
      const slidesCompatible = resolveSlidesExportCompatible(
        getHtml,
        documentType,
        isSlideDeckProp,
      );
      setShowSlidesExport(slidesCompatible);
      try {
        setSlideTheme(
          slideThemeProp || extractSlideThemeFromHtml(getHtml()) || null,
        );
        setShowFormsExport(resolveFormsExportCompatible(getHtml, documentType));
        setExportPolicy(resolveMaterialExportPolicy(documentType, getHtml()));
      } catch {
        setSlideTheme(slideThemeProp ?? null);
        setShowFormsExport(false);
        setExportPolicy(resolveMaterialExportPolicy(documentType));
      }
    };

    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, [getHtml, documentType, isSlideDeckProp, slideThemeProp]);

  const gap = compact ? "gap-1" : "gap-1.5 sm:gap-2";
  const wrapTitle = disabled ? disabledTitle : exportPolicy.hint;

  const showDocsExport = materialExportAllows("google-docs", documentType, getHtml());
  const showDriveExport = materialExportAllows("google-drive", documentType, getHtml());
  const showClassroomExport = materialExportAllows(
    "google-classroom",
    documentType,
    getHtml(),
  );
  const showSlidesChannel = materialExportAllows("google-slides", documentType, getHtml());
  const showPptxExport = materialExportAllows("pptx-download", documentType, getHtml());
  const driveIsPdf = exportPolicy.driveFormat === "pdf";
  const showPdfDownload = Boolean(onDownloadPdf);

  if (disabled) {
    return (
      <div
        className={`flex min-w-0 flex-wrap items-center opacity-50 ${gap} ${className}`}
        title={wrapTitle}
      >
        <span className="text-[10px] font-bold text-slate-500">
          Exportação Google indisponível
        </span>
      </div>
    );
  }

  const exportIcons = (
    <>
      {showSlidesExport && showSlidesChannel ? (
        <>
          <GoogleSlidesExportButton
            title={title}
            getHtml={getHtml}
            theme={slideTheme ?? undefined}
            returnTo={returnTo}
            alwaysShowExport
            iconOnly
          />
          {showPptxExport ? (
            <SlidesPptxDownloadButton
              title={title}
              getHtml={getHtml}
              theme={slideTheme ?? undefined}
              documentType={documentType}
              iconOnly
            />
          ) : null}
        </>
      ) : null}
      {!isSlideMaterial && showDocsExport ? (
        <GoogleDocsExportButton
          title={title}
          getHtml={getHtml}
          getPlanningPayload={getPlanningPayload}
          returnTo={returnTo}
          documentType={documentType}
          onStatus={onStatus}
          onExportError={onExportError}
          iconOnly
        />
      ) : null}
      {!isSlideMaterial && showDriveExport ? (
        <GoogleDriveExportButton
          title={title}
          getHtml={getHtml}
          getPlanningPayload={getPlanningPayload}
          returnTo={returnTo}
          documentType={documentType}
          onStatus={onStatus}
          onExportError={onExportError}
          iconOnly
          exportTitle={
            driveIsPdf
              ? "Salva PDF no Google Drive (preserva layout visual)"
              : "Salva uma cópia no Google Drive"
          }
        />
      ) : null}
      {showFormsExport ? (
        <GoogleFormsExportButton
          title={title}
          getHtml={getHtml}
          returnTo={returnTo}
          onStatus={onStatus}
          onExportError={onExportError}
          iconOnly
        />
      ) : null}
      {showClassroomExport ? (
        classroomMode === "popover" ? (
          <GoogleClassroomPopoverButton
            title={title}
            getHtml={getHtml}
            onStatus={onStatus}
            returnTo={returnTo}
            documentType={documentType}
          />
        ) : (
          <GoogleClassroomPanel
            compact
            title={title}
            getHtml={getHtml}
            onStatus={onStatus}
            returnTo={returnTo}
            documentType={documentType}
          />
        )
      ) : null}
      {showPdfDownload ? (
        <DocumentDownloadIconBar
          onDownloadPdf={onDownloadPdf}
          downloadingPdf={downloadingPdf}
        />
      ) : null}
    </>
  );

  return (
    <div
      className={`flex min-w-0 items-center ${gap} ${className}`}
      title={wrapTitle}
    >
      {compact ? (
        <div className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/90 px-1 py-0.5">
          {exportIcons}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">{exportIcons}</div>
      )}
    </div>
  );
}
