"use client";

import {
  buildMaterialWhatsAppShareMessage,
  copyMaterialShareText,
  openMaterialWhatsAppShare,
} from "@/lib/share/material-whatsapp";

type MaterialWhatsAppShareButtonProps = {
  title: string;
  tipoLabel?: string;
  componente?: string;
  anoSerie?: string;
  turma?: string;
  disabled?: boolean;
  onStatus?: (message: string) => void;
  className?: string;
};

export function MaterialWhatsAppShareButton({
  title,
  tipoLabel,
  componente,
  anoSerie,
  turma,
  disabled = false,
  onStatus,
  className = "",
}: MaterialWhatsAppShareButtonProps) {
  const message = buildMaterialWhatsAppShareMessage({
    title,
    tipoLabel,
    componente,
    anoSerie,
    turma,
  });

  function handleWhatsAppShare() {
    openMaterialWhatsAppShare(message);
    onStatus?.("Abrindo WhatsApp para compartilhar com sua turma.");
  }

  async function handleCopy() {
    const copied = await copyMaterialShareText(message);
    onStatus?.(
      copied
        ? "Resumo copiado — cole no WhatsApp ou outro canal."
        : "Não foi possível copiar. Use o botão WhatsApp.",
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleWhatsAppShare}
        className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        title="Compartilhar resumo do material via WhatsApp (você envia para a turma)"
      >
        <span aria-hidden className="text-base leading-none">
          💬
        </span>
        WhatsApp
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handleCopy()}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        title="Copiar resumo para colar onde preferir"
      >
        Copiar
      </button>
    </div>
  );
}
