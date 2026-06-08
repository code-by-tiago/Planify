"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityFeedInlinePreview } from "@/components/community/CommunityFeedInlinePreview";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import { MaterialLikeButton } from "@/components/community/MaterialLikeButton";
import { MaterialSaveButton } from "@/components/community/MaterialSaveButton";
import { CommunityMaterialComments } from "@/components/community/CommunityMaterialComments";
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

type CommunityPostCardProps = {
  item: CommunityFeedItem;
  downloadingKey: string | null;
  onDownload: (item: CommunityFeedItem, format: MarketplaceDownloadFormat) => void;
  onRemove?: (item: CommunityFeedItem) => void;
  showRemove?: boolean;
  onTagClick?: (tag: string) => void;
  onTemaClick?: (tema: string) => void;
};

export function CommunityPostCard({
  item,
  downloadingKey,
  onDownload,
  onRemove,
  showRemove,
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

  function copyShareLink() {
    const url = materialShareUrl(item.id);
    void navigator.clipboard.writeText(url).then(() => {
      setShareStatus("Link copiado!");
      window.setTimeout(() => setShareStatus(""), 2000);
    });
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-cyan-400/10 px-4 py-3">
        <CommunityAuthorAvatar
          userId={item.userId}
          name={item.authorName}
          avatarUrl={item.authorAvatarUrl}
        />
        <div className="min-w-0 flex-1">
          <CommunityAuthorLink userId={item.userId} name={item.authorName} />
          <p className="truncate text-[11px] font-medium text-slate-500">
            {item.componente} · {item.etapa} · {formatDate(item.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {commentsCount > 0 ? (
            <a
              href={`#comments-${item.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800"
            >
              <PlanifyIcon name="message" className="h-3 w-3" />
              {commentsCount}
            </a>
          ) : null}
          <span className="max-w-[7.5rem] truncate rounded-full border border-cyan-400/20 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800 sm:max-w-none">
            {item.tipoMaterial}
          </span>
        </div>
      </header>

      <div className="px-4 py-4">
        <h3 className="text-lg font-extrabold leading-snug text-slate-950">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>

        {item.tema ? (
          <button
            type="button"
            onClick={() => onTemaClick?.(item.tema)}
            className="mt-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 transition hover:bg-indigo-100"
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

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
          <span>{item.anoSerie}</span>
          <span>·</span>
          <span>{formatBytes(item.fileSize)}</span>
          {item.downloadsCount > 0 ? (
            <>
              <span>·</span>
              <span>{item.downloadsCount} download(s)</span>
            </>
          ) : null}
        </div>
      </div>

      <CommunityFeedInlinePreview materialId={item.id} title={item.title} />

      <div className="space-y-2 border-t border-cyan-400/10 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href={`/marketplace/material/${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-cyan-700"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60"
            title="Copiar link do material"
          >
            <PlanifyIcon name="externalLink" className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">{shareStatus || "Compartilhar"}</span>
            <span className="sm:hidden">{shareStatus ? "OK" : "Link"}</span>
          </button>
          <a
            href={`#comments-${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-800"
          >
            <PlanifyIcon name="message" className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">
              {commentsCount > 0 ? `${commentsCount} comentário(s)` : "Comentar"}
            </span>
            <span className="sm:hidden">{commentsCount > 0 ? commentsCount : "Chat"}</span>
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CommunityReportButton targetType="material" targetId={item.id} compact />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={Boolean(downloadingKey)}
              onClick={() => onDownload(item, "docx")}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 px-2.5 py-1.5 text-[11px] font-bold text-cyan-800 transition hover:bg-cyan-50 disabled:opacity-60"
            >
              <PlanifyIcon name="download" className="h-3.5 w-3.5" />
              {downloadingKey === `${item.id}:docx` ? "…" : "DOCX"}
            </button>
            <button
              type="button"
              disabled={Boolean(downloadingKey)}
              onClick={() => onDownload(item, "pdf")}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/20 px-2.5 py-1.5 text-[11px] font-bold text-indigo-800 transition hover:bg-indigo-50 disabled:opacity-60"
            >
              <PlanifyIcon name="download" className="h-3.5 w-3.5" />
              {downloadingKey === `${item.id}:pdf` ? "…" : "PDF"}
            </button>
          </div>
        </div>
      </div>

      {showRemove && onRemove ? (
        <div className="border-t border-cyan-400/10 px-4 py-2">
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
          >
            Remover meu material
          </button>
        </div>
      ) : null}

      <CommunityMaterialComments
        materialId={item.id}
        initialComments={item.comments ?? EMPTY_COMMENTS}
        onCommentsChange={setCommentsCount}
      />
    </article>
  );
}
