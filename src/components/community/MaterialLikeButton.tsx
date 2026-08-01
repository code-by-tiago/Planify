"use client";

import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useState } from "react";

type MaterialLikeButtonProps = {
  materialId: string;
  initialCount: number;
  initialLiked: boolean;
  onChange?: (state: { likesCount: number; likedByMe: boolean }) => void;
  compact?: boolean;
};

export function MaterialLikeButton({
  materialId,
  initialCount,
  initialLiked,
  onChange,
  compact,
}: MaterialLikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialCount);
  const [likedByMe, setLikedByMe] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    if (busy) return;

    setBusy(true);

    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/likes`, {
        method: likedByMe ? "DELETE" : "POST",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        likesCount?: number;
        likedByMe?: boolean;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível curtir.");
      }

      const next = {
        likesCount: data?.likesCount ?? likesCount,
        likedByMe: data?.likedByMe ?? !likedByMe,
      };

      setLikesCount(next.likesCount);
      setLikedByMe(next.likedByMe);
      onChange?.(next);
    } catch {
      // silencioso — mantém estado anterior
    } finally {
      setBusy(false);
    }
  }

  const btnClass = compact
    ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
    : "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggleLike()}
      className={`${btnClass} border transition disabled:opacity-60 ${
        likedByMe
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-cyan-400/20 bg-white/80 text-slate-700 hover:border-rose-200 hover:bg-rose-50/60 hover:text-rose-700"
      }`}
      aria-pressed={likedByMe}
    >
      <span aria-hidden className={likedByMe ? "text-rose-600" : "text-slate-400"}>
        {likedByMe ? "♥" : "♡"}
      </span>
      {likesCount > 0 ? likesCount : "Curtir"}
    </button>
  );
}
