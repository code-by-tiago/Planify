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
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import {
  downloadMarketplaceMaterial,
  type MarketplaceDownloadFormat,
} from "@/lib/marketplace/marketplace-download-client";
import type { MarketplacePreviewKind } from "@/server/marketplace/marketplace-preview";
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

export function MarketplaceMaterialViewClient({ materialId }: MarketplaceMaterialViewClientProps) {
  const router = useRouter();
  const [data, setData] = useState<MaterialPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [hiddenFromFeed, setHiddenFromFeed] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

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

      router.push("/dashboard?secao=marketplace");
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
  const accentClass = material ? tipoAccentClass(material.tipoMaterial) : "from-slate-600 to-cyan-700";
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
    ? "Planejamento publicado sem matriz oficial. Abra no editor e republica na Comunidade para exportar com o modelo da escola."
    : "Exportação Google indisponível para este formato.";

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Comunidade"
          icon="market"
          title={material?.title || "Material da Comunidade"}
          description={
            material
              ? `${material.componente} · ${material.etapa} · ${material.anoSerie}`
              : "Visualize o material antes de curtir ou comentar."
          }
          action={
            <Link
              href="/dashboard?secao=marketplace"
              className="pl-hud-btn-secondary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <PlanifyIcon name="arrowLeft" className="h-3.5 w-3.5" />
              Voltar ao feed
            </Link>
          }
        />
      }
    >
      <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        {loading ? (
          <section className="pl-hud-glass flex items-center justify-center rounded-2xl p-16">
            <span className="text-sm font-semibold text-cyan-700">Carregando material…</span>
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </section>
        ) : material && preview ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0 space-y-4">
              <section className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-white/90 shadow-sm backdrop-blur-sm">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
                  aria-hidden
                />
                <div className={`bg-gradient-to-br ${accentClass} px-5 py-6 text-white`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                        {material.tipoMaterial}
                      </p>
                      <p className="mt-1 text-sm font-bold text-white/95">
                        {material.componente} · {material.etapa}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-white/75">
                        {material.anoSerie}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
                      {formatBytes(material.fileSize)}
                    </span>
                  </div>
                </div>
                <header className="flex items-center gap-3 border-b border-cyan-400/10 px-4 py-3">
                  <CommunityAuthorAvatar
                    userId={material.userId}
                    name={material.authorName}
                    avatarUrl={material.authorAvatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <CommunityAuthorLink userId={material.userId} name={material.authorName} />
                    <p className="truncate text-[11px] font-medium text-slate-500">
                      {material.componente} · {material.etapa} · {formatDate(material.createdAt)}
                    </p>
                  </div>
                </header>

                <div className="px-4 py-4">
                  <h1 className="text-xl font-extrabold leading-snug text-slate-950 sm:text-2xl">
                    {material.title}
                  </h1>
                  {material.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{material.description}</p>
                  ) : null}
                  {material.downloadsCount > 0 ? (
                    <p className="mt-3 text-[11px] font-semibold text-slate-500">
                      {material.downloadsCount} download(s)
                    </p>
                  ) : null}
                  {actionStatus ? (
                    <p className="mt-2 text-xs font-semibold text-cyan-700">{actionStatus}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!isOwnMaterial ? (
                      <button
                        type="button"
                        onClick={handleHideFromFeed}
                        disabled={hiddenFromFeed}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {hiddenFromFeed ? "Oculto do feed" : "Ocultar do feed"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePermanentDelete()}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        Excluir permanentemente
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <CommunityMaterialPreview
                kind={preview.kind}
                title={material.title}
                signedUrl={preview.signedUrl}
                htmlContent={preview.htmlContent}
                isSlidePreview={preview.isSlidePreview}
                fileName={material.fileName}
              />

              <div className="rounded-2xl border border-cyan-400/15 bg-white p-4 shadow-sm lg:hidden">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Exportar
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
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
                </div>
                {isPlanningMaterial && canGoogleExport && !planningPayloadReady ? (
                  <p className="mt-2 text-[10px] font-medium text-amber-700">
                    {googleDisabledTitle}
                  </p>
                ) : null}
                <div className="mt-3">
                  <MaterialLikeButton
                    materialId={material.id}
                    initialCount={likesCount}
                    initialLiked={likedByMe}
                    onChange={(state) => {
                      setLikesCount(state.likesCount);
                      setLikedByMe(state.likedByMe);
                    }}
                  />
                </div>
              </div>

              <section className="rounded-2xl border border-cyan-400/15 bg-white shadow-sm lg:hidden">
                <div className="border-b border-cyan-400/10 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
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

            <aside className="hidden space-y-4 lg:sticky lg:top-4 lg:block">
              <section className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
                <div className="border-b border-cyan-400/10 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
                    Interações
                  </h2>
                </div>
                <div className="space-y-4 px-4 py-4">
                  <MaterialLikeButton
                    materialId={material.id}
                    initialCount={likesCount}
                    initialLiked={likedByMe}
                    onChange={(state) => {
                      setLikesCount(state.likesCount);
                      setLikedByMe(state.likedByMe);
                    }}
                  />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Exportar
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
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
                    </div>
                    {isPlanningMaterial && canGoogleExport && !planningPayloadReady ? (
                      <p className="mt-2 text-[10px] font-medium text-amber-700">
                        {googleDisabledTitle}
                      </p>
                    ) : null}
                  </div>
                  {!isOwnMaterial ? (
                    <button
                      type="button"
                      onClick={handleHideFromFeed}
                      disabled={hiddenFromFeed}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {hiddenFromFeed ? "Oculto do seu feed" : "Ocultar do feed"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handlePermanentDelete()}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      Excluir permanentemente
                    </button>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
                <div className="border-b border-cyan-400/10 px-4 py-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-cyan-700">
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
