"use client";

import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import type { CommunityFeedItem } from "@/lib/community/types";
import type { MarketplaceDownloadFormat } from "@/lib/marketplace/marketplace-download-client";

type CommunityFeedProps = {
  items: CommunityFeedItem[];
  featuredItems?: CommunityFeedItem[];
  loading?: boolean;
  downloadingKey: string | null;
  onDownload: (item: CommunityFeedItem, format: MarketplaceDownloadFormat) => void;
  onRemove?: (item: CommunityFeedItem) => void;
  onHideFromFeed?: (item: CommunityFeedItem) => void;
  onRestoreToFeed?: (item: CommunityFeedItem) => void;
  hiddenFeedIds?: Set<string>;
  showHiddenFeed?: boolean;
  mineOnly?: boolean;
  currentUserId?: string | null;
  onPublishClick?: () => void;
  onTagClick?: (tag: string) => void;
  onTemaClick?: (tema: string) => void;
};

export function CommunityFeed({
  items,
  featuredItems = [],
  loading,
  downloadingKey,
  onDownload,
  onRemove,
  onHideFromFeed,
  onRestoreToFeed,
  hiddenFeedIds,
  showHiddenFeed,
  mineOnly,
  currentUserId,
  onPublishClick,
  onTagClick,
  onTemaClick,
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

  const featuredIds = new Set(featuredItems.map((item) => item.id));
  const feedItems = items.filter((item) => !featuredIds.has(item.id));

  function renderCard(item: CommunityFeedItem, keyPrefix = "") {
    const isHiddenFromFeed = Boolean(
      showHiddenFeed && hiddenFeedIds?.has(item.id),
    );

    return (
      <CommunityPostCard
        key={`${keyPrefix}${item.id}`}
        item={item}
        downloadingKey={downloadingKey}
        viewerUserId={currentUserId}
        onDownload={onDownload}
        onRemove={onRemove}
        showRemove={Boolean(mineOnly && currentUserId && item.userId === currentUserId)}
        onHideFromFeed={onHideFromFeed}
        onRestoreToFeed={onRestoreToFeed}
        isHiddenFromFeed={isHiddenFromFeed}
        onTagClick={onTagClick}
        onTemaClick={onTemaClick}
      />
    );
  }

  return (
    <div className="space-y-6">
      {featuredItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
            Em destaque esta semana
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredItems.map((item) => renderCard(item, "featured-"))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {feedItems.map((item) => renderCard(item))}
      </div>
    </div>
  );
}
