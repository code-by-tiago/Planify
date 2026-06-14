"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityMaterialPreview } from "@/components/community/CommunityMaterialPreview";
import { DocumentDownloadIconBar } from "@/components/documents/DocumentDownloadIconBar";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MaterialLikeButton } from "@/components/community/MaterialLikeButton";
import { MarketplaceComments } from "@/components/marketplace/MarketplaceComments";
import {
  hideFeedMaterial,
  isFeedMaterialHidden,
} from "@/lib/community/hidden-feed-materials";
import { resolveDocumentTypeFromMarketplaceItem } from "@/lib/documents/document-export-context";
import { extractPlanningPayloadFromHtml } from "@/lib/planejamentos/planning-export-embed";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import {
  downloadMarketplaceMaterial,
  type MarketplaceDownloadFormat,
} from "@/lib/marketplace/marketplace-download-client";
import { openMarketplaceMaterialInEditor } from "@/lib/marketplace/marketplace-editor-open";
import type { MarketplacePreviewKind } from "@/server/marketplace/marketplace-preview";
import { comunidadeRoutes } from "@/lib/community/docente-utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type MaterialPreviewData = {
  viewerUserId?: string | null;
  material: {
    id: string;
    userId: string;
    authorName: string;
    authorAvatarUrl: string | null;
    title: string;
    description: string;
    etapa: string;
    anoSerie: string;
    componente: string;
    tipoMaterial: string;
    tema: string;
    tags: string[];
    fileName: string;
    fileMime: string;
    fileSize: number;
    downloadsCount: number;
    createdAt: string | null;
    likesCount: number;
    likedByMe: boolean;
  };
  preview: {
    kind: MarketplacePreviewKind;
    signedUrl: string | null;
    htmlContent: string | null;
    isSlidePreview: boolean;
    downloadFormats: MarketplaceDownloadFormat[];
  };
};

type MarketplaceMaterialViewClientProps = {
  materialId: string;
  embeddedInCommunity?: boolean;
  variant?: "standalone" | "embedded";
  backHref?: string;
};

function formatBytes(value: number) {
  if (!value) return "0 KB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

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

export function MarketplaceMaterialViewClient({
  materialId,
  embeddedInCommunity = false,
  variant = "standalone",
  backHref,
}: MarketplaceMaterialViewClientProps) {
  const router = useRouter();
  const [data, setData] = useState<MaterialPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [openingEditor, setOpeningEditor] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [hiddenFromFeed, setHiddenFromFeed] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [metaExpanded, setMetaExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/preview`, {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await parseJsonResponse<MaterialPreviewData & {
        success?: boolean;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Não foi possível carregar o material.");
      }

      if (!payload?.material || !payload?.preview) {
        throw new Error("Material indisponível.");
      }

      setData(payload);
      setLikesCount(payload.material.likesCount);
      setLikedByMe(payload.material.likedByMe);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar material.");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setHiddenFromFeed(isFeedMaterialHidden(materialId));
  }, [materialId]);

  async function handlePermanentDelete() {
    if (!data?.material) return;

    const confirmed = window.confirm(
      `Excluir permanentemente "${data.material.title}" da Comunidade?\n\nEsta ação não pode ser desfeita. O material deixará de aparecer para todos.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setActionStatus("Excluindo material...");

    try {
      const response = await fetch(`/api/marketplace/materiais?id=${data.material.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Não foi possível excluir o material.");
      }

      router.push(
        backHref ||
          (embeddedInCommunity || variant === "embedded"
            ? comunidadeRoutes.homeEmbedded
            : "/dashboard?secao=marketplace"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir material.");
      setActionStatus("");
    }
  }

  function handleHideFromFeed() {
    hideFeedMaterial(materialId);
    setHiddenFromFeed(true);
    setActionStatus("Material oculto do seu feed.");
  }

  async function handleOpenEditor() {
    if (!material) return;

    setOpeningEditor(true);
    setError("");

    try {
      await openMarketplaceMaterialInEditor(material);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir no editor.");
      setOpeningEditor(false);
    }
  }

  async function handleDownload(format: MarketplaceDownloadFormat) {
    if (!data) return;

    const downloadKey = `${data.material.id}:${format}`;
    setDownloadingKey(downloadKey);
    setError("");

    try {
      await downloadMarketplaceMaterial({
        id: data.material.id,
        format,
        fallbackFileName: data.material.fileName || `${data.material.title}.${format}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar material.");
    } finally {
      setDownloadingKey(null);
    }
  }

  const material = data?.material;
  const preview = data?.preview;
  const isOwnMaterial = Boolean(
    data?.viewerUserId && material && data.viewerUserId === material.userId,
  );
  const exportHtml = preview?.htmlContent || "";
  const canGoogleExport = preview?.kind === "html" && exportHtml.trim().length >= 20;
  const documentType = material
    ? resolveDocumentTypeFromMarketplaceItem({
        tipoMaterial: material.tipoMaterial,
        fileMime: material.fileMime,
      })
    : null;

  const getPlanningPayload = useCallback(() => {
    if (!exportHtml.trim()) return null;
    return extractPlanningPayloadFromHtml(exportHtml);
  }, [exportHtml]);

  const isPlanningMaterial = Boolean(documentType?.includes("planejamento"));
  const planningPayloadReady =
    !isPlanningMaterial || Boolean(exportHtml && extractPlanningPayloadFromHtml(exportHtml));
  const googleExportDisabled =
    !canGoogleExport || (isPlanningMaterial && !planningPayloadReady);
  const googleDisabledTitle = isPlanningMaterial && !planningPayloadReady
    ? "Planejamento publicado sem matriz oficial. Abra no editor e republica na Comunidade para exportar com o modelo oficial."
    : "Exportação Google indisponível para este formato.";
  const canOpenEditor = preview?.kind === "html" || preview?.kind === "docx";

  const openEditorButton = canOpenEditor ? (
    <button
      type="button"
      disabled={openingEditor}
      onClick={() => void handleOpenEditor()}
      className="pl-hud-btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-60"
    >
      <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
      {openingEditor ? "Abrindo…" : "Abrir no editor"}
    </button>
  ) : null;

  const exportBar = material && preview ? (
    <>
      <GoogleDocumentExportBar
        title={material.title}
        getHtml={() => exportHtml}
        getPlanningPayload={
          documentType?.includes("planejamento") ? getPlanningPayload : undefined
        }
        documentType={documentType}
        isSlideDeck={preview.isSlidePreview}
        returnTo={`/marketplace/material/${material.id}`}
        compact
        classroomMode="popover"
        disabled={googleExportDisabled}
        disabledTitle={googleDisabledTitle}
      />
      <DocumentDownloadIconBar
        onDownloadPdf={
          preview.downloadFormats.includes("pdf")
            ? () => void handleDownload("pdf")
            : undefined
        }
        downloadingPdf={downloadingKey === `${material.id}:pdf`}
      />
    </>
  ) : null;

  const moderationActions = material ? (
    !isOwnMaterial ? (
      <button
        type="button"
        onClick={handleHideFromFeed}
        disabled={hiddenFromFeed}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {hiddenFromFeed ? "Oculto do feed" : "Ocultar do feed"}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => void handlePermanentDelete()}
        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100"
      >
        Excluir
      </button>
    )
  ) : null;

  const isEmbeddedVariant = embeddedInCommunity || variant === "embedded";
  const resolvedBackHref =
    backHref || (isEmbeddedVariant ? comunidadeRoutes.homeEmbedded : "/dashboard?secao=marketplace");

  return (
    <PlanifyWorkspacePane>
      <div
        className={[
          "mx-auto space-y-3",
          isEmbeddedVariant ? "max-w-4xl" : "planify-hud pl-hud-hub max-w-6xl",
        ].join(" ")}
      >
        {!isEmbeddedVariant ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-cyan-400/10 pb-3">
          <Link
            href={resolvedBackHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-400/20 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50/60"
          >
            <PlanifyIcon name="arrowLeft" className="h-3.5 w-3.5" />
            Feed
          </Link>
          {material ? (
            <>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <CommunityAuthorAvatar
                  userId={material.userId}
                  name={material.authorName}
                  avatarUrl={material.authorAvatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{material.title}</p>
                  <p className="truncate text-[10px] font-medium text-slate-500">
                    <CommunityAuthorLink
                      userId={material.userId}
                      name={material.authorName}
                      className="font-semibold text-cyan-700"
                    />
                    {" · "}
                    {material.tipoMaterial}
                    {" · "}
                    {formatBytes(material.fileSize)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMetaExpanded((value) => !value)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
              >
                {metaExpanded ? "Menos info" : "Mais info"}
              </button>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-600">Material da Comunidade</p>
          )}
        </div>
        ) : null}

        {loading ? (
          <section className="pl-hud-glass flex items-center justify-center rounded-2xl p-12">
            <span className="text-sm font-semibold text-cyan-700">Carregando material…</span>
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </section>
        ) : material && preview ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="min-w-0 space-y-3">
              {metaExpanded ? (
                <section className="rounded-xl border border-cyan-400/15 bg-white/90 px-3 py-2.5 text-xs text-slate-600 shadow-sm">
                  <p className="font-semibold text-slate-800">
                    {material.componente} · {material.etapa} · {material.anoSerie}
                  </p>
                  {material.description ? (
                    <p className="mt-1 leading-5">{material.description}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-slate-500">
                    Publicado em {formatDate(material.createdAt)}
                    {material.downloadsCount > 0 ? ` · ${material.downloadsCount} download(s)` : ""}
                  </p>
                  {actionStatus ? (
                    <p className="mt-1 text-[10px] font-semibold text-cyan-700">{actionStatus}</p>
                  ) : null}
                </section>
              ) : null}

              <CommunityMaterialPreview
                kind={preview.kind}
                title={material.title}
                signedUrl={preview.signedUrl}
                htmlContent={preview.htmlContent}
                isSlidePreview={preview.isSlidePreview}
                fileName={material.fileName}
                scrollMode="page"
              />

              <div className="rounded-xl border border-cyan-400/15 bg-white p-3 shadow-sm lg:hidden">
                <div className="space-y-2">
                  {openEditorButton}
                  <div className="flex flex-wrap items-center gap-2">
                  {exportBar}
                  <MaterialLikeButton
                    materialId={material.id}
                    initialCount={likesCount}
                    initialLiked={likedByMe}
                    onChange={(state) => {
                      setLikesCount(state.likesCount);
                      setLikedByMe(state.likedByMe);
                    }}
                  />
                  {moderationActions}
                  </div>
                </div>
              </div>

              <section className="rounded-xl border border-cyan-400/15 bg-white shadow-sm lg:hidden">
                <div className="border-b border-cyan-400/10 px-3 py-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                    Comentários
                  </h2>
                </div>
                <MarketplaceComments
                  materialId={material.id}
                  materialOwnerId={material.userId}
                  viewerUserId={data.viewerUserId}
                  embedded
                />
              </section>
            </div>

            <aside className="hidden space-y-3 lg:sticky lg:top-3 lg:block lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:overscroll-contain">
              <section className="overflow-hidden rounded-xl border border-cyan-400/15 bg-white shadow-sm">
                <div className="space-y-3 px-3 py-3">
                  {openEditorButton}
                  <MaterialLikeButton
                    materialId={material.id}
                    initialCount={likesCount}
                    initialLiked={likedByMe}
                    onChange={(state) => {
                      setLikesCount(state.likesCount);
                      setLikedByMe(state.likedByMe);
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">{exportBar}</div>
                  {isPlanningMaterial && canGoogleExport && !planningPayloadReady ? (
                    <p className="text-[10px] font-medium text-amber-700">{googleDisabledTitle}</p>
                  ) : null}
                  {moderationActions}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-cyan-400/15 bg-white shadow-sm">
                <div className="border-b border-cyan-400/10 px-3 py-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                    Comentários
                  </h2>
                </div>
                <MarketplaceComments
                  materialId={material.id}
                  materialOwnerId={material.userId}
                  viewerUserId={data.viewerUserId}
                  embedded
                />
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </PlanifyWorkspacePane>
  );
}
