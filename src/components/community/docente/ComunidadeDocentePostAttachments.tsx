"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { comunidadeRoutes } from "@/lib/community/docente-utils";
import { downloadMarketplaceMaterial, resolveMarketplaceDownloadParams } from "@/lib/marketplace/marketplace-download-client";
import type { DocenteDiscussionAttachment } from "@/lib/community/docente-types";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import { useState } from "react";

function documentVisual(fileType: DocenteDiscussionAttachment["fileType"]) {
  switch (fileType) {
    case "pptx":
      return {
        icon: "presentation" as const,
        tint: "text-orange-500",
        bg: "bg-orange-50",
        label: "Apresentação",
      };
    case "pdf":
      return {
        icon: "fileText" as const,
        tint: "text-rose-500",
        bg: "bg-rose-50",
        label: "PDF",
      };
    case "image":
      return {
        icon: "fileText" as const,
        tint: "text-emerald-500",
        bg: "bg-emerald-50",
        label: "Imagem",
      };
    default:
      return {
        icon: "fileText" as const,
        tint: "text-cyan-600",
        bg: "bg-cyan-50",
        label: "Documento",
      };
  }
}

function displayFileName(attachment: DocenteDiscussionAttachment): string {
  const raw = attachment.fileName || attachment.title || "arquivo";
  // Remove prefixo automático "Título — " gerado no upload do post
  const parts = raw.split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ") : raw;
}

type ComunidadeDocentePostAttachmentsProps = {
  attachments: DocenteDiscussionAttachment[];
  className?: string;
  onError?: (message: string) => void;
};

export function ComunidadeDocentePostAttachments({
  attachments,
  className = "mt-3",
  onError,
}: ComunidadeDocentePostAttachmentsProps) {
  const embedded = useComunidadeEmbedded();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set());

  if (!attachments.length) return null;

  const images = attachments.filter(
    (item) => item.fileType === "image" && item.previewUrl && !brokenImages.has(item.id),
  );
  const documents = attachments.filter(
    (item) =>
      item.fileType !== "image" || !item.previewUrl || brokenImages.has(item.id),
  );

  async function handleDownload(attachment: DocenteDiscussionAttachment) {
    setDownloadingId(attachment.materialId);
    try {
      const params = resolveMarketplaceDownloadParams({
        title: displayFileName(attachment),
        fileType: attachment.fileType,
        fileName: attachment.fileName,
      });
      await downloadMarketplaceMaterial({
        id: attachment.materialId,
        format: params.format,
        fallbackFileName: params.fallbackFileName,
      });
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o anexo.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      {images.length > 0 ? (
        <div
          className={[
            "overflow-hidden rounded-2xl border border-slate-200 bg-slate-50",
            images.length > 1 ? "grid gap-0.5 sm:grid-cols-2" : "",
          ].join(" ")}
        >
          {images.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.previewUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className={[
                "group relative block overflow-hidden bg-slate-100",
                images.length === 1 ? "max-h-[420px]" : "aspect-square max-h-[280px]",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.previewUrl || ""}
                alt={displayFileName(attachment)}
                className="h-full w-full object-cover transition group-hover:scale-[1.01]"
                onError={() =>
                  setBrokenImages((prev) => {
                    const next = new Set(prev);
                    next.add(attachment.id);
                    return next;
                  })
                }
              />
            </a>
          ))}
        </div>
      ) : null}

      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map((attachment) => {
            const visual = documentVisual(attachment.fileType);
            const name = displayFileName(attachment);
            return (
              <li key={attachment.id}>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.bg}`}
                  >
                    <PlanifyIcon name={visual.icon} className={`h-5 w-5 ${visual.tint}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0F172A]">{name}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {visual.label}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={comunidadeRoutes.material(attachment.materialId, embedded)}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                      Abrir
                    </Link>
                    <button
                      type="button"
                      disabled={downloadingId === attachment.materialId}
                      onClick={() => void handleDownload(attachment)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-[11px] font-bold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60"
                    >
                      <PlanifyIcon name="download" className="h-3.5 w-3.5" />
                      {downloadingId === attachment.materialId ? "…" : "Baixar"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
