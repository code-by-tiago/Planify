"use client";

import { useEffect, useState } from "react";
import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { GoogleDocsExportButton } from "@/components/google/GoogleDocsExportButton";
import { GoogleDriveExportButton } from "@/components/google/GoogleDriveExportButton";
import { GoogleFormsExportButton } from "@/components/google/GoogleFormsExportButton";
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

function resolveQuizDocument(
  getHtml: () => string,
  documentType?: string | null,
): boolean {
  const type = String(documentType || "").toLowerCase();
  if (
    type.includes("prova") ||
    type.includes("lista") ||
    type.includes("quiz") ||
    type.includes("jogo")
  ) {
    return true;
  }

  try {
    return /planify-questao/i.test(getHtml());
  } catch {
    return false;
  }
}

/** Marketplace + integrações Google no topo do editor */
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
  const [isQuizDocument, setIsQuizDocument] = useState(
    () => resolveQuizDocument(getHtml, documentType),
  );
  const [slideTheme, setSlideTheme] = useState<string | null>(
    slideThemeProp ?? null,
  );

  useEffect(() => {
    const sync = () => {
      setIsSlideDeck(
        resolveSlideDeck(getHtml, documentType, isSlideDeckProp),
      );
      setIsQuizDocument(resolveQuizDocument(getHtml, documentType));
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

  const returnTo = "/dashboard?secao=editor";

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
      <MarketplacePublishButton
        title={title}
        getHtml={getHtml}
        label="Comunidade"
        compact
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-800 transition hover:bg-fuchsia-100"
      />
      {isSlideDeck ? (
        <GoogleSlidesExportButton
          title={title}
          getHtml={getHtml}
          theme={slideTheme ?? undefined}
          returnTo={returnTo}
          alwaysShowExport
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white transition hover:bg-amber-600"
        />
      ) : (
        <>
          <GoogleDocsExportButton
            title={title}
            getHtml={getHtml}
            returnTo={returnTo}
            onStatus={onStatus}
          />
          <GoogleDriveExportButton
            title={title}
            getHtml={getHtml}
            returnTo={returnTo}
            onStatus={onStatus}
          />
        </>
      )}
      {isQuizDocument ? (
        <GoogleFormsExportButton
          title={title}
          getHtml={getHtml}
          returnTo={returnTo}
          onStatus={onStatus}
        />
      ) : null}
      <GoogleClassroomPanel
        compact
        title={title}
        getHtml={getHtml}
        onStatus={onStatus}
        returnTo={returnTo}
      />
    </div>
  );
}
