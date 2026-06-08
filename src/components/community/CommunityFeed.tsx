"use client";

import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import type { CommunityFeedItem } from "@/lib/community/types";
import type { MarketplaceDownloadFormat } from "@/lib/marketplace/marketplace-download-client";

type CommunityFeedProps = {
  items: CommunityFeedItem[];
  loading?: boolean;
  downloadingKey: string | null;
  onDownload: (item: CommunityFeedItem, format: MarketplaceDownloadFormat) => void;
  onRemove?: (item: CommunityFeedItem) => void;
  mineOnly?: boolean;
  currentUserId?: string | null;
  onPublishClick?: () => void;
};

export function CommunityFeed({
  items,
  loading,
  downloadingKey,
  onDownload,
  onRemove,
  mineOnly,
  currentUserId,
  onPublishClick,
}: CommunityFeedProps) {
  if (loading && items.length === 0) {
    return (
      <div className="pl-hud-glass flex items-center justify-center rounded-2xl p-12">
        <span className="text-sm font-semibold text-cyan-700">Carregando feed…</span>
      </div>
    );
  }

  if (!items.length) {
    return (
      <section className="pl-hud-glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
        <PlanifyOwlMark size={80} glow />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-cyan-600">
          Comunidade vazia
        </p>
        <h3 className="mt-2 text-xl font-extrabold text-slate-950">
          Nenhum material compartilhado ainda
        </h3>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Seja o primeiro a publicar — ou ajuste os filtros de busca.
        </p>
        {onPublishClick ? (
          <button
            type="button"
            onClick={onPublishClick}
            className="pl-hud-btn mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold"
          >
            Publicar material
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      {items.map((item) => (
        <CommunityPostCard
          key={item.id}
          item={item}
          downloadingKey={downloadingKey}
          onDownload={onDownload}
          onRemove={onRemove}
          showRemove={Boolean(mineOnly && currentUserId && item.userId === currentUserId)}
        />
      ))}
    </div>
  );
}
