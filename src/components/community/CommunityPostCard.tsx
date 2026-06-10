"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityMaterialComments } from "@/components/community/CommunityMaterialComments";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import { MaterialLikeButton } from "@/components/community/MaterialLikeButton";
import { MaterialSaveButton } from "@/components/community/MaterialSaveButton";
import { CommunityMaterialExportBar } from "@/components/documents/CommunityMaterialExportBar";
import { PlanifyMaterialHubCard } from "@/components/materials/PlanifyMaterialHubCard";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityFeedItem } from "@/lib/community/types";
import { formatMaterialBytes } from "@/lib/materials/format-material-bytes";
import type { MarketplaceDownloadFormat } from "@/lib/marketplace/marketplace-download-client";
import {
  canOpenMarketplaceMaterialInEditor,
  openMarketplaceMaterialInEditor,
} from "@/lib/marketplace/marketplace-editor-open";
import Link from "next/link";
import { useState } from "react";

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
  const [openingEditor, setOpeningEditor] = useState(false);
  const [editorError, setEditorError] = useState("");

  const isOwnMaterial = Boolean(viewerUserId && item.userId === viewerUserId);
  const canOpenEditor = canOpenMarketplaceMaterialInEditor(item);

  async function handleOpenEditor() {
    setOpeningEditor(true);
    setEditorError("");

    try {
      await openMarketplaceMaterialInEditor(item);
    } catch (err) {
      setEditorError(
        err instanceof Error ? err.message : "Não foi possível abrir no editor.",
      );
      setOpeningEditor(false);
    }
  }

  function copyShareLink() {
    const url = materialShareUrl(item.id);
    void navigator.clipboard.writeText(url).then(() => {
      setShareStatus("Link copiado!");
      window.setTimeout(() => setShareStatus(""), 2000);
    });
  }

  const metaSecondary = [
    item.tema ? `#${item.tema}` : "",
    formatDate(item.createdAt),
    item.downloadsCount > 0 ? `${item.downloadsCount} download(s)` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`flex flex-col gap-3 ${isHiddenFromFeed ? "opacity-85" : ""}`}
    >
      <PlanifyMaterialHubCard
        badge={item.tipoMaterial || "Material"}
        title={item.title}
        description={item.description || undefined}
        metaPrimary={`${item.componente} · ${item.etapa}${item.anoSerie ? ` · ${item.anoSerie}` : ""}`}
        metaSecondary={metaSecondary || undefined}
        metaTertiary={formatMaterialBytes(item.fileSize) || undefined}
        onSelect={() => {
          window.location.href = `/marketplace/material/${item.id}`;
        }}
        headerSlot={
          <div className="flex items-center gap-2">
            <CommunityAuthorAvatar
              userId={item.userId}
              name={item.authorName}
              avatarUrl={item.authorAvatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <CommunityAuthorLink userId={item.userId} name={item.authorName} />
            </div>
            {commentsCount > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                <PlanifyIcon name="message" className="h-3 w-3" />
                {commentsCount}
              </span>
            ) : null}
          </div>
        }
        footer={
          <div className="space-y-2">
            {item.tema ? (
              <button
                type="button"
                onClick={() => onTemaClick?.(item.tema)}
                className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 transition hover:bg-indigo-100"
              >
                Tema: {item.tema}
              </button>
            ) : null}
            {item.tags?.length ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 4).map((tag) => (
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
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/marketplace/material/${item.id}`}
                className="pl-hud-btn inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold"
              >
                <PlanifyIcon name="fileText" className="h-3.5 w-3.5" />
                Ver
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
                className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-cyan-50/60"
              >
                <PlanifyIcon name="externalLink" className="h-3 w-3" />
                {shareStatus || "Link"}
              </button>
            </div>
            <CommunityMaterialExportBar
              item={item}
              downloadingKey={downloadingKey}
              onDownload={onDownload}
              returnTo="/marketplace"
            />
            {canOpenEditor ? (
              <button
                type="button"
                disabled={openingEditor}
                onClick={() => void handleOpenEditor()}
                className="pl-hud-btn inline-flex w-full items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-60"
              >
                <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
                {openingEditor ? "Abrindo…" : "Abrir no editor"}
              </button>
            ) : null}
            {editorError ? (
              <p className="text-[10px] font-semibold text-rose-700">{editorError}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CommunityReportButton targetType="material" targetId={item.id} compact />
              {!isOwnMaterial && onHideFromFeed && !isHiddenFromFeed ? (
                <button
                  type="button"
                  onClick={() => onHideFromFeed(item)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Ocultar
                </button>
              ) : null}
              {!isOwnMaterial && onRestoreToFeed && isHiddenFromFeed ? (
                <button
                  type="button"
                  onClick={() => onRestoreToFeed(item)}
                  className="text-[10px] font-bold text-amber-700"
                >
                  Restaurar
                </button>
              ) : null}
              {showRemove && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="text-[10px] font-bold text-rose-600"
                >
                  Excluir
                </button>
              ) : null}
            </div>
          </div>
        }
      />

      <CommunityMaterialComments
        materialId={item.id}
        materialOwnerId={item.userId}
        viewerUserId={viewerUserId}
        initialComments={item.comments ?? EMPTY_COMMENTS}
        onCommentsChange={setCommentsCount}
      />
    </div>
  );
}
