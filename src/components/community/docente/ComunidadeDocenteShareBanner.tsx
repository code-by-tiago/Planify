"use client";

import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { IconX } from "@/components/community/docente/docente-icons";

const STORAGE_KEY = "planify:community-share-banner-dismissed";

type ComunidadeDocenteShareBannerProps = {
  onShare: () => void;
};

export function ComunidadeDocenteShareBanner({ onShare }: ComunidadeDocenteShareBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-white p-4 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Fechar aviso"
      >
        <IconX className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md sm:flex">
          <PlanifyIcon name="fileText" className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <h2 className="text-sm font-extrabold text-[#0F172A]">
            Compartilhe — outro professor vai agradecer!
          </h2>
          <p className="mt-1 text-xs leading-snug text-slate-500">
            O que funciona na sua sala pode funcionar na dele também. Compartilhe seus
            materiais e atividades com a comunidade.
          </p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="shrink-0 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-200/50 transition hover:bg-cyan-600"
        >
          Compartilhar agora
        </button>
      </div>
    </section>
  );
}
