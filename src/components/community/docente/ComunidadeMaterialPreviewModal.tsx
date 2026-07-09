"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityMaterialPreview } from "@/components/community/CommunityMaterialPreview";
import { MaterialLikeButton } from "@/components/community/MaterialLikeButton";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import {
  downloadMarketplaceMaterial,
  type MarketplaceDownloadFormat,
} from "@/lib/marketplace/marketplace-download-client";
import { cloneAndOpenInEditor } from "@/lib/marketplace/marketplace-clone-client";
import { extractBnccCodesFromText } from "@/lib/community/docente-utils";
import type { MarketplacePreviewKind } from "@/server/marketplace/marketplace-preview";
import { useCallback, useEffect, useState } from "react";

type MaterialPreviewData = {
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
    downloadsCount: number;
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

type ComunidadeMaterialPreviewModalProps = {
  materialId: string;
  open: boolean;
  onClose: () => void;
  onCloned?: (downloadsCount: number) => void;
};

export function ComunidadeMaterialPreviewModal({
  materialId,
  open,
  onClose,
  onCloned,
}: ComunidadeMaterialPreviewModalProps) {
  const [data, setData] = useState<MaterialPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cloning, setCloning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/preview`, {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await parseJsonResponse<
        MaterialPreviewData & { success?: boolean; error?: { message?: string } }
      >(response);

      if (!response.ok || !payload?.material || !payload?.preview) {
        throw new Error(payload?.error?.message || "Não foi possível carregar o material.");
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
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const material = data?.material;
  const preview = data?.preview;
  const canClone = preview?.kind === "html" || preview?.kind === "docx";
  const bnccCodes = material
    ? extractBnccCodesFromText(...(material.tags || []), material.tema, material.title)
    : [];

  async function handleClone() {
    if (!material) return;
    setCloning(true);
    setError("");
    try {
      await cloneAndOpenInEditor(material.id);
      onCloned?.(Number(material.downloadsCount || 0) + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível clonar o material.");
      setCloning(false);
    }
  }

  async function handleDownload() {
    if (!material || !preview) return;
    setDownloading(true);
    setError("");
    try {
      const format = preview.downloadFormats[0] || "docx";
      await downloadMarketplaceMaterial({
        id: material.id,
        format,
        fallbackFileName: material.fileName || `${material.title}.${format}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar material.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar preview"
        onClick={onClose}
      />

      <div className="relative z-[81] flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white sm:h-[min(92dvh,900px)] sm:rounded-2xl sm:shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">
              {material?.title || "Preview do material"}
            </p>
            {material ? (
              <p className="truncate text-xs font-medium text-slate-500">
                {material.componente} · {material.anoSerie} · {material.tipoMaterial}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Fechar"
          >
            <PlanifyIcon name="close" className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-semibold text-cyan-700">
            Carregando material…
          </div>
        ) : error && !material ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : material && preview ? (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-0 overflow-y-auto bg-slate-800/90 p-3 sm:p-5">
              <CommunityMaterialPreview
                kind={preview.kind}
                title={material.title}
                signedUrl={preview.signedUrl}
                htmlContent={preview.htmlContent}
                isSlidePreview={preview.isSlidePreview}
                fileName={material.fileName}
                scrollMode="page"
              />
            </div>

            <aside className="flex min-h-0 flex-col border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
              <div className="space-y-4 overflow-y-auto p-4 pb-28 lg:pb-4">
                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex items-center gap-3">
                  <CommunityAuthorAvatar
                    userId={material.userId}
                    name={material.authorName}
                    avatarUrl={material.authorAvatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{material.authorName}</p>
                    <p className="text-xs text-slate-500">Autor do material</p>
                  </div>
                </div>

                {material.description ? (
                  <p className="text-sm leading-6 text-slate-600">{material.description}</p>
                ) : null}

                {bnccCodes.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      BNCC
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {bnccCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <MaterialLikeButton
                  materialId={material.id}
                  initialCount={likesCount}
                  initialLiked={likedByMe}
                  onChange={(state) => {
                    setLikesCount(state.likesCount);
                    setLikedByMe(state.likedByMe);
                  }}
                />

                <p className="text-xs font-medium text-slate-500">
                  {material.downloadsCount} uso(s) · {likesCount} curtida(s)
                </p>
              </div>

              <div className="sticky bottom-0 space-y-2 border-t border-slate-200 bg-white p-4">
                {canClone ? (
                  <button
                    type="button"
                    disabled={cloning}
                    onClick={() => void handleClone()}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 text-sm font-extrabold text-white shadow-md transition hover:bg-cyan-600 disabled:opacity-60"
                  >
                    <PlanifyIcon name="editor" className="h-4 w-4" />
                    {cloning ? "Clonando…" : "Clonar e Editar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={() => void handleDownload()}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 text-sm font-extrabold text-white shadow-md transition hover:bg-cyan-600 disabled:opacity-60"
                  >
                    {downloading ? "Baixando…" : "Baixar material"}
                  </button>
                )}
                {canClone ? (
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={() => void handleDownload()}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {downloading ? "Baixando…" : "Baixar cópia"}
                  </button>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
