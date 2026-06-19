"use client";

import { HUD_CHIP_ACTIVE, HUD_CHIP_INACTIVE } from "@/lib/pro/hud-form-styles";

type MinhaTurmaChipProps = {
  configured: boolean;
  applied: boolean;
  loading?: boolean;
  turmaLabel?: string | null;
  onApply: () => void;
  onSave?: () => void;
  className?: string;
};

export function MinhaTurmaChip({
  configured,
  applied,
  loading = false,
  turmaLabel,
  onApply,
  onSave,
  className = "",
}: MinhaTurmaChipProps) {
  const label = turmaLabel?.trim()
    ? `Minha turma · ${turmaLabel.trim()}`
    : "Minha turma";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        disabled={loading || !configured}
        onClick={onApply}
        title={
          configured
            ? "Aplicar série, disciplina e turma salvos"
            : "Salve seu contexto docente na primeira geração"
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          applied ? HUD_CHIP_ACTIVE : HUD_CHIP_INACTIVE
        }`}
        aria-pressed={applied}
      >
        <span aria-hidden>👥</span>
        {loading ? "Carregando…" : label}
      </button>
      {onSave && configured ? (
        <button
          type="button"
          disabled={loading}
          onClick={onSave}
          className="text-[11px] font-bold text-cyan-700 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Atualizar padrão
        </button>
      ) : null}
      {!configured && !loading ? (
        <span className="text-[11px] font-semibold text-slate-500">
          Preencha e gere uma vez — o Planify lembra para a próxima.
        </span>
      ) : null}
    </div>
  );
}
