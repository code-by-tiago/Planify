"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnPrimary, ppLink } from "@/components/public/landing-professor-primeiro/theme";
import {
  buildCommercialWhatsAppUrl,
  buildPlanInquiryWhatsAppMessage,
} from "@/lib/public/escolasCommercial";

type EscolasPlanActionsProps = {
  planName: string;
  highlighted?: boolean;
};

export function EscolasPlanActions({ planName, highlighted }: EscolasPlanActionsProps) {
  function handleWhatsAppClick() {
    const message = buildPlanInquiryWhatsAppMessage(planName);
    window.open(buildCommercialWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-auto flex flex-col gap-2 pt-6">
      <a
        href="#contato"
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
          highlighted
            ? ppBtnPrimary
            : "border border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:text-cyan-700"
        }`}
      >
        Falar com Consultor
        <PlanifyIcon name="arrowRight" className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={handleWhatsAppClick}
        className={`text-xs font-bold underline-offset-2 hover:underline ${ppLink}`}
      >
        Ou iniciar conversa no WhatsApp
      </button>
    </div>
  );
}
