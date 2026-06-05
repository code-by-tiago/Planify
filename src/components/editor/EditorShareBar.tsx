"use client";

import { GoogleClassroomPanel } from "@/components/google/GoogleClassroomPanel";
import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";

type EditorShareBarProps = {
  title: string;
  getHtml: () => string;
  onStatus?: (message: string) => void;
};

/** Marketplace + Google Classroom sempre visíveis no topo do editor */
export function EditorShareBar({
  title,
  getHtml,
  onStatus,
}: EditorShareBarProps) {
  let isSlideDeck = false;
  try {
    isSlideDeck = getHtml().includes("planify-slide");
  } catch {
    isSlideDeck = false;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
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
          returnTo="/dashboard?secao=editor"
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
