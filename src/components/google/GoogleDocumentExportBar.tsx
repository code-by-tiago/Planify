"use client";

import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { GoogleClassroomPopoverButton } from "@/components/google/GoogleClassroomPopoverButton";
import { GoogleDocsExportButton } from "@/components/google/GoogleDocsExportButton";
import { GoogleDriveExportButton } from "@/components/google/GoogleDriveExportButton";
import { GoogleFormsExportButton } from "@/components/google/GoogleFormsExportButton";
import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import {
  resolveSlideDeck,
  resolveSlidesExportCompatible,
} from "@/lib/google/document-type-detection";
import { extractSlideThemeFromHtml } from "@/lib/slides/slide-deck-utils";
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
}: GoogleDocumentExportBarProps) {
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

  const returnTo = useMemo(() => {
    if (returnToProp) return returnToProp;
    if (typeof window === "undefined") return "/dashboard?secao=editor";
    return `${window.location.pathname}${window.location.search}` || "/editor";
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
      } catch {
        setSlideTheme(slideThemeProp ?? null);
      }
    };

    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, [getHtml, documentType, isSlideDeckProp, slideThemeProp]);

  const gap = compact ? "gap-1" : "gap-1.5 sm:gap-2";
  const wrapTitle = disabled ? disabledTitle : undefined;

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

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center ${gap} ${className}`}
      title={wrapTitle}
    >
      {showSlidesExport ? (
        <GoogleSlidesExportButton
          title={title}
          getHtml={getHtml}
          theme={slideTheme ?? undefined}
          returnTo={returnTo}
          alwaysShowExport
          iconOnly
        />
      ) : null}
      {!isSlideMaterial ? (
        <>
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
          <GoogleDriveExportButton
            title={title}
            getHtml={getHtml}
            getPlanningPayload={getPlanningPayload}
            returnTo={returnTo}
            documentType={documentType}
            onStatus={onStatus}
            onExportError={onExportError}
            iconOnly
          />
        </>
      ) : null}
      <GoogleFormsExportButton
        title={title}
        getHtml={getHtml}
        returnTo={returnTo}
        onStatus={onStatus}
        onExportError={onExportError}
        iconOnly
      />
      {classroomMode === "popover" ? (
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
      )}
    </div>
  );
}
