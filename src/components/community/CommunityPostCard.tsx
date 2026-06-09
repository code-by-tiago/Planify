"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityFeedInlinePreview } from "@/components/community/CommunityFeedInlinePreview";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import { MaterialLikeButton } from "@/components/community/MaterialLikeButton";
import { MaterialSaveButton } from "@/components/community/MaterialSaveButton";
import { CommunityMaterialComments } from "@/components/community/CommunityMaterialComments";
import { CommunityMaterialExportBar } from "@/components/documents/CommunityMaterialExportBar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityFeedItem } from "@/lib/community/types";
import type { MarketplaceDownloadFormat } from "@/lib/marketplace/marketplace-download-client";
import Link from "next/link";
import { useState } from "react";

function formatBytes(value: number) {
  if (!value) return "0 KB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

const EMPTY_COMMENTS: CommunityFeedItem["comments"] = [];

function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function materialShareUrl(materialId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/marketplace/material/${materialId}`;
  }
  return `https://iaplanify.com.br/marketplace/material/${materialId}`;
}

function tipoAccentClass(tipo: string): string {
  const normalized = tipo.toLowerCase();
  if (normalized.includes("planejamento")) {
    return "from-cyan-500 to-blue-600";
  }
  if (normalized.includes("slide")) {
    return "from-violet-500 to-fuchsia-600";
  }
  if (normalized.includes("avalia")) {
    return "from-amber-500 to-orange-600";
  }
  return "from-slate-600 to-cyan-700";
}

type CommunityPostCardProps = {
  item: CommunityFeedItem;
  downloadingKey: string | null;
  viewerUserId?: string | null;
  onDownload: (item: CommunityFeedItem, format: MarketplaceDownloadFormat) => void;
  onRemove?: (item: CommunityFeedItem) => void;
  showRemove?: boolean;
  onHideFromFeed?: (item: CommunityFeedItem) => void;
  onRestoreToFeed?: (item: CommunityFeedItem) => void;
  isHiddenFromFeed?: boolean;
  onTagClick?: (tag: string) => void;
  onTemaClick?: (tema: string) => void;
};

export function CommunityPostCard({
  item,
  downloadingKey,
  viewerUserId,
  onDownload,
  onRemove,
  showRemove,
  onHideFromFeed,
  onRestoreToFeed,
  isHiddenFromFeed,
  onTagClick,
  onTemaClick,
}: CommunityPostCardProps) {
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [commentsCount, setCommentsCount] = useState(
    item.commentsCount ?? item.comments?.length ?? 0,
  );
  const [likedByMe, setLikedByMe] = useState(item.likedByMe);
  const [savedByMe, setSavedByMe] = useState(item.savedByMe ?? false);
  const [shareStatus, setShareStatus] = useState("");

  const isOwnMaterial = Boolean(viewerUserId && item.userId === viewerUserId);
  const accentClass = tipoAccentClass(item.tipoMaterial);

  function copyShareLink() {
    const url = materialShareUrl(item.id);
    void navigator.clipboard.writeText(url).then(() => {
      setShareStatus("Link copiado!");
      window.setTimeout(() => setShareStatus(""), 2000);
    });
  }

  function handleHideFromFeed() {
    if (!onHideFromFeed) return;
    onHideFromFeed(item);
  }

  function handleRestoreToFeed() {
    if (!onRestoreToFeed) return;
    onRestoreToFeed(item);
  }

  function handlePermanentDelete() {
    onRemove?.(item);
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-white/90 shadow-sm backdrop-blur-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg ${
        isHiddenFromFeed ? "opacity-80 ring-2 ring-amber-200/80" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
        aria-hidden
      />

      <Link
        href={`/marketplace/material/${item.id}`}
        className="relative block overflow-hidden"
      >
        <div className={`bg-gradient-to-br ${accentClass} px-5 py-6 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                {item.tipoMaterial}
              </p>
              <p className="mt-1 text-sm font-bold text-white/95">
                {item.componente} · {item.etapa}
              </p>
              <p className="mt-0.5 text-xs font-medium text-white/75">
                {item.anoSerie}
              </p>
            </div>
            <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
              {formatBytes(item.fileSize)}
            </span>
          </div>
        </div>
      </Link>

      <header className="flex items-center gap-3 border-b border-cyan-400/10 px-4 py-3">
        <CommunityAuthorAvatar
          userId={item.userId}
          name={item.authorName}
          avatarUrl={item.authorAvatarUrl}
        />
        <div className="min-w-0 flex-1">
          <CommunityAuthorLink userId={item.userId} name={item.authorName} />
          <p className="truncate text-[11px] font-medium text-slate-500">
            {formatDate(item.createdAt)}
            {item.downloadsCount > 0 ? ` · ${item.downloadsCount} download(s)` : ""}
          </p>
        </div>
        {commentsCount > 0 ? (
          <a
            href={`#comments-${item.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800"
          >
            <PlanifyIcon name="message" className="h-3 w-3" />
            {commentsCount}
          </a>
        ) : null}
      </header>

      <div className="px-4 py-4">
        <Link href={`/marketplace/material/${item.id}`}>
          <h3 className="text-lg font-extrabold leading-snug text-slate-950 transition group-hover:text-cyan-800 sm:text-xl">
            {item.title}
          </h3>
        </Link>
        {item.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        ) : null}

        {item.tema ? (
          <button
            type="button"
            onClick={() => onTemaClick?.(item.tema)}
            className="mt-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 transition hover:bg-indigo-100"
          >
            #{item.tema}
          </button>
        ) : null}

        {item.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick?.(tag)}
                className="rounded-full border border-cyan-400/20 bg-white px-2 py-0.5 text-[10px] font-semibold text-cyan-800 transition hover:bg-cyan-50"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <CommunityFeedInlinePreview materialId={item.id} title={item.title} />

      <div className="space-y-3 border-t border-cyan-400/10 bg-slate-50/40 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href={`/marketplace/material/${item.id}`}
            className="pl-hud-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold"
          >
            <PlanifyIcon name="fileText" className="h-3.5 w-3.5" />
            Ver material
          </Link>
          <MaterialLikeButton
            materialId={item.id}
            initialCount={likesCount}
            initialLiked={likedByMe}
            onChange={(state) => {
              setLikesCount(state.likesCount);
              setLikedByMe(state.likedByMe);
            }}
            compact
          />
          <MaterialSaveButton
            materialId={item.id}
            initialSaved={savedByMe}
            onChange={setSavedByMe}
          />
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60"
            title="Copiar link do material"
          >
            <PlanifyIcon name="externalLink" className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">{shareStatus || "Compartilhar"}</span>
            <span className="sm:hidden">{shareStatus ? "OK" : "Link"}</span>
          </button>
          <a
            href={`#comments-${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-800"
          >
            <PlanifyIcon name="message" className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">
              {commentsCount > 0 ? `${commentsCount} comentário(s)` : "Comentar"}
            </span>
            <span className="sm:hidden">{commentsCount > 0 ? commentsCount : "Chat"}</span>
          </a>
        </div>

        <CommunityMaterialExportBar
          item={item}
          downloadingKey={downloadingKey}
          onDownload={onDownload}
          returnTo="/marketplace"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <CommunityReportButton targetType="material" targetId={item.id} compact />
          {!isOwnMaterial && onHideFromFeed && !isHiddenFromFeed ? (
            <button
              type="button"
              onClick={handleHideFromFeed}
              className="text-[11px] font-bold text-slate-500 transition hover:text-slate-700"
            >
              Ocultar do feed
            </button>
          ) : null}
          {!isOwnMaterial && onRestoreToFeed && isHiddenFromFeed ? (
            <button
              type="button"
              onClick={handleRestoreToFeed}
              className="text-[11px] font-bold text-amber-700 transition hover:text-amber-800"
            >
              Mostrar no feed
            </button>
          ) : null}
        </div>
      </div>

      {showRemove && onRemove ? (
        <div className="border-t border-rose-100 bg-rose-50/40 px-4 py-2.5">
          <button
            type="button"
            onClick={handlePermanentDelete}
            className="text-[11px] font-bold text-rose-600 transition hover:text-rose-700"
          >
            Excluir permanentemente
          </button>
        </div>
      ) : null}

      <CommunityMaterialComments
        materialId={item.id}
        materialOwnerId={item.userId}
        viewerUserId={viewerUserId}
        initialComments={item.comments ?? EMPTY_COMMENTS}
        onCommentsChange={setCommentsCount}
      />
    </article>
  );
}
