"use client";

import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { useState } from "react";

type ShareMaterialLinkButtonProps = {
  title: string;
  getHtml: () => string;
  toolId?: string | null;
  compact?: boolean;
  onStatus?: (message: string) => void;
  className?: string;
};

export function ShareMaterialLinkButton({
  title,
  getHtml,
  toolId,
  compact = false,
  onStatus,
  className,
}: ShareMaterialLinkButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading) return;
    setLoading(true);
    try {
      const html = getHtml();
      const response = await planifyAuthenticatedFetch("/api/share/materiais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          html,
          toolId: toolId || undefined,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        share?: { url?: string };
        error?: { message?: string };
      };

      if (!response.ok || !data.success || !data.share?.url) {
        throw new Error(data?.error?.message || "Não foi possível gerar o link.");
      }

      await navigator.clipboard.writeText(data.share.url);
      onStatus?.("Link copiado — mande no WhatsApp da escola");
    } catch (error) {
      onStatus?.(
        error instanceof Error ? error.message : "Falha ao gerar link de compartilhamento.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleShare()}
      className={
        className ||
        (compact
          ? "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
          : "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60")
      }
    >
      {loading ? "Gerando…" : compact ? "Link" : "Gerar Link de Compartilhamento"}
    </button>
  );
}
