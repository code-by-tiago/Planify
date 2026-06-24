"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import { useAutoGoogleExport } from "@/hooks/useAutoGoogleExport";
import { extractSlideThemeFromHtml } from "@/lib/slides/slide-deck-utils";
import { useMemo, useState } from "react";
import { extractComponenteFromPlanningPayload } from "@/lib/marketplace/marketplace-publish";

function tipoMaterialFromDocumentType(documentType?: string | null): string | undefined {
  if (!documentType) return undefined;
  const lower = documentType.toLowerCase();
  if (lower.includes("planejamento")) return "Planejamento";
  if (lower.startsWith("material:")) {
    const tool = lower.replace("material:", "");
    if (!tool) return undefined;
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  }
  return documentType;
}

type EditorShareBarProps = {
  title: string;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  onStatus?: (message: string) => void;
  documentType?: string | null;
  isSlideDeck?: boolean;
  slideTheme?: string | null;
  compact?: boolean;
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
};

/** Marketplace + integrações Google no topo do editor */
export function EditorShareBar({
  title,
  getHtml,
  getPlanningPayload,
  onStatus,
  documentType,
  isSlideDeck: isSlideDeckProp,
  slideTheme: slideThemeProp,
  compact = false,
  onDownloadPdf,
  downloadingPdf = false,
}: EditorShareBarProps) {
  const [slideTheme] = useState<string | null>(() => {
    try {
      return slideThemeProp || extractSlideThemeFromHtml(getHtml()) || null;
    } catch {
      return slideThemeProp ?? null;
    }
  });

  const returnTo = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard?secao=editor";
    return `${window.location.pathname}${window.location.search}` || "/dashboard?secao=editor";
  }, []);

  const publishComponente = useMemo(
    () => extractComponenteFromPlanningPayload(getPlanningPayload?.() ?? null),
    [getPlanningPayload],
  );

  const publishTipoMaterial = useMemo(
    () => tipoMaterialFromDocumentType(documentType),
    [documentType],
  );

  useAutoGoogleExport({
    title,
    getHtml,
    slideTheme,
    returnTo,
    onStatus,
  });

  const comunidadeClass = compact
    ? "inline-flex shrink-0 items-center gap-1 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
    : "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100";

  return (
    <div
      className={`flex min-w-0 flex-1 flex-wrap items-center ${
        compact ? "gap-1.5" : "gap-2 sm:gap-3"
      }`}
    >
      <MarketplacePublishButton
        title={title}
        getHtml={getHtml}
        getPlanningPayload={getPlanningPayload}
        componente={publishComponente}
        tipoMaterial={publishTipoMaterial}
        label={compact ? "Comunidade" : "Comunidade"}
        compact
        className={comunidadeClass}
      />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {compact ? (
          <span className="hidden shrink-0 text-[9px] font-black uppercase tracking-wide text-slate-400 sm:inline">
            Exportar
          </span>
        ) : null}
        <GoogleDocumentExportBar
          title={title}
          getHtml={getHtml}
          getPlanningPayload={getPlanningPayload}
          onStatus={onStatus}
          documentType={documentType}
          isSlideDeck={isSlideDeckProp}
          slideTheme={slideThemeProp ?? slideTheme}
          returnTo={returnTo}
          compact
          classroomMode="popover"
          className="min-w-0 flex-1"
          onDownloadPdf={onDownloadPdf}
          downloadingPdf={downloadingPdf}
        />
      </div>
    </div>
  );
}
