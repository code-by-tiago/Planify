"use client";

import { useEffect, useState } from "react";
import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import {
  extractSlideThemeFromHtml,
  isSlideDeckHtml,
} from "@/lib/slides/slide-deck-utils";

type EditorShareBarProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
  /** Tipo salvo no documento (ex.: material:slides) — evita sumir o botão Google. */
  documentType?: string | null;
  /** Força detecção quando o HTML já é de slides. */
  isSlideDeck?: boolean;
  slideTheme?: string | null;
};

function resolveSlideDeck(
  getHtml: () => string,
  documentType?: string | null,
  forced?: boolean,
): boolean {
  if (forced) return true;
  const type = String(documentType || "").toLowerCase();
  if (type.includes("slides")) return true;
  try {
    return isSlideDeckHtml(getHtml());
  } catch {
    return false;
  }
}

/** Marketplace + Google Classroom + exportação Slides no topo do editor */
export function EditorShareBar({
  title,
  getHtml,
  onStatus,
  documentType,
  isSlideDeck: isSlideDeckProp,
  slideTheme: slideThemeProp,
}: EditorShareBarProps) {
  const [isSlideDeck, setIsSlideDeck] = useState(
    () => resolveSlideDeck(getHtml, documentType, isSlideDeckProp) === true,
  );
  const [slideTheme, setSlideTheme] = useState<string | null>(
    slideThemeProp ?? null,
  );

  useEffect(() => {
    const sync = () => {
      setIsSlideDeck(
        resolveSlideDeck(getHtml, documentType, isSlideDeckProp),
      );
      try {
        setSlideTheme(
          slideThemeProp ||
            extractSlideThemeFromHtml(getHtml()) ||
            null,
        );
      } catch {
        setSlideTheme(slideThemeProp ?? null);
      }
    };

    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, [getHtml, documentType, isSlideDeckProp, slideThemeProp]);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
      <MarketplacePublishButton
        title={title}
        getHtml={getHtml}
        label="Marketplace"
        compact
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
      />
      {isSlideDeck ? (
        <GoogleSlidesExportButton
          title={title}
          getHtml={getHtml}
          theme={slideTheme ?? undefined}
          returnTo="/dashboard?secao=editor"
          alwaysShowExport
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
        />
      ) : null}
      <GoogleClassroomPanel
        compact
        title={title}
        getHtml={getHtml}
        onStatus={onStatus}
      />
    </div>
  );
}
