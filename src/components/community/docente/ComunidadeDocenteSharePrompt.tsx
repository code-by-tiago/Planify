"use client";

import { useEffect, useState } from "react";
import { IconX } from "@/components/community/docente/docente-icons";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";

const DISMISS_KEY = "planify:community-share-prompt-dismissed";

type ComunidadeDocenteSharePromptProps = {
  onShare: () => void;
  suggestedTitle?: string | null;
};

export function ComunidadeDocenteSharePrompt({
  onShare,
  suggestedTitle,
}: ComunidadeDocenteSharePromptProps) {
  const [dismissed, setDismissed] = useState(true);
  const visual = resolveMaterialCoverVisual(suggestedTitle || "Material");

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
  }

  if (dismissed) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <IconX className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div
          className={`flex h-[72px] w-[56px] shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${visual.accent} text-white shadow-sm`}
        >
          <PlanifyIcon name={visual.icon} className="h-5 w-5" />
          <span className="mt-1 max-w-[48px] truncate px-1 text-center text-[8px] font-bold leading-tight">
            {suggestedTitle || "Material"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-[#0F172A]">
            Compartilhe — outro professor vai agradecer!
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {suggestedTitle
              ? `O que funciona na sua sala pode funcionar na dele também. Compartilhe "${suggestedTitle}" com a comunidade.`
              : "O que funciona na sua sala pode funcionar na dele também. Compartilhe um material com a comunidade."}
          </p>
          <button
            type="button"
            onClick={onShare}
            className="mt-3 w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8] sm:w-auto sm:px-6"
          >
            Compartilhar agora
          </button>
        </div>
      </div>
    </section>
  );
}
