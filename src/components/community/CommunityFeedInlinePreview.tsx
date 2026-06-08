"use client";

import { CommunityMaterialPreview } from "@/components/community/CommunityMaterialPreview";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { MarketplacePreviewKind } from "@/server/marketplace/marketplace-preview";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useState } from "react";

type PreviewPayload = {
  kind: MarketplacePreviewKind;
  title: string;
  signedUrl?: string | null;
  htmlContent?: string | null;
  isSlidePreview?: boolean;
  fileName?: string;
};

type CommunityFeedInlinePreviewProps = {
  materialId: string;
  title: string;
};

export function CommunityFeedInlinePreview({ materialId, title }: CommunityFeedInlinePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [error, setError] = useState("");

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    if (preview) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/preview`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        material?: { title?: string; fileName?: string };
        preview?: Omit<PreviewPayload, "title" | "fileName">;
        error?: { message?: string };
      }>(response);

      if (!response.ok || !data?.preview) {
        throw new Error(data?.error?.message || "Pré-visualização indisponível.");
      }

      setPreview({
        ...data.preview,
        title: data.material?.title || title,
        fileName: data.material?.fileName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar prévia.");
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-cyan-400/10">
      <button
        type="button"
        onClick={() => void toggle()}
        className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold text-cyan-700 transition hover:bg-cyan-50/50"
      >
        <PlanifyIcon name="presentation" className="h-3.5 w-3.5" />
        {loading ? "Carregando prévia…" : expanded ? "Ocultar prévia" : "Pré-visualizar material"}
        <PlanifyIcon
          name="chevronDown"
          className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {error ? (
        <p className="px-4 pb-3 text-xs font-semibold text-rose-700">{error}</p>
      ) : null}

      {expanded && preview ? (
        <div className="px-4 pb-4">
          <CommunityMaterialPreview
            kind={preview.kind}
            title={preview.title || title}
            signedUrl={preview.signedUrl}
            htmlContent={preview.htmlContent}
            isSlidePreview={preview.isSlidePreview}
            fileName={preview.fileName}
          />
        </div>
      ) : null}
    </div>
  );
}
