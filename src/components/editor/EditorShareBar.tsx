"use client";

import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import { useAutoGoogleExport } from "@/hooks/useAutoGoogleExport";
import { extractSlideThemeFromHtml } from "@/lib/slides/slide-deck-utils";
import { useMemo, useState } from "react";

type EditorShareBarProps = {
  title: string;
  getHtml: () => string;
  getPlanningPayload?: () => Record<string, unknown> | null;
  onStatus?: (message: string) => void;
  documentType?: string | null;
  isSlideDeck?: boolean;
  slideTheme?: string | null;
  compact?: boolean;
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
    return `${window.location.pathname}${window.location.search}` || "/editor?from=materiais";
  }, []);

  useAutoGoogleExport({
    title,
    getHtml,
    slideTheme,
    returnTo,
    onStatus,
  });

  const shareGap = compact ? "gap-1" : "gap-1.5 sm:gap-2";
  const comunidadeClass = compact
    ? "inline-flex shrink-0 items-center gap-1 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
    : "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100";

  return (
    <div className={`flex min-w-0 flex-1 flex-wrap items-center ${shareGap}`}>
      <MarketplacePublishButton
        title={title}
        getHtml={getHtml}
        label={compact ? "Comunidade" : "Comunidade"}
        compact
        className={comunidadeClass}
      />
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
        classroomMode="panel"
      />
    </div>
  );
}
