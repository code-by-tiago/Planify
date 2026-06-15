"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  buildSlideAdjustPayload,
  requestMaterialGeneration,
  type MaterialGenerationApiResult,
} from "@/lib/materiais/elevate-material-client";
import { formatGenerationError, useRetryableAction } from "@/lib/pro/generation-error-ui";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { useState } from "react";

type SlideAiAdjustPanelProps = {
  generationPayload: MaterialEngineInput | null | undefined;
  disabled?: boolean;
  compact?: boolean;
  onAdjusting?: (busy: boolean) => void;
  onResult: (result: {
    html: string;
    estrutura: MaterialEngineResponse | null;
    payload: MaterialEngineInput;
    qualityScore?: number | null;
    qualityIssues?: string[];
    alertas?: string[];
    pipeline?: string | null;
  }) => void;
  onError?: (message: string) => void;
};

function extractEstrutura(
  data: MaterialGenerationApiResult,
): MaterialEngineResponse | null {
  if (!data.estrutura || typeof data.estrutura !== "object") return null;
  return data.estrutura as MaterialEngineResponse;
}

export function SlideAiAdjustPanel({
  generationPayload,
  disabled = false,
  compact = false,
  onAdjusting,
  onResult,
  onError,
}: SlideAiAdjustPanelProps) {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const { runWithRetry, retrying } = useRetryableAction();

  const canSubmit = Boolean(generationPayload && instruction.trim() && !busy && !disabled);

  async function handleSubmit() {
    if (!generationPayload || !instruction.trim()) return;

    setBusy(true);
    onAdjusting?.(true);

    try {
      await runWithRetry(async () => {
        const payload = buildSlideAdjustPayload(generationPayload, instruction.trim());
        const data = await requestMaterialGeneration(payload);

        if (!data.html?.trim()) {
          throw new Error("A IA não retornou slides atualizados.");
        }

        onResult({
          html: data.html,
          estrutura: extractEstrutura(data),
          payload,
          qualityScore:
            typeof data.qualityScore === "number" ? data.qualityScore : null,
          qualityIssues: Array.isArray(data.qualityIssues)
            ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
            : [],
          alertas: Array.isArray(data.alertas)
            ? data.alertas.map((item) => String(item)).filter(Boolean)
            : [],
          pipeline: typeof data.pipeline === "string" ? data.pipeline : null,
        });
        setInstruction("");
        setOpen(false);
      });
    } catch (error) {
      const formatted = formatGenerationError(error);
      onError?.(formatted.message);
    } finally {
      setBusy(false);
      onAdjusting?.(false);
    }
  }

  if (!generationPayload) return null;

  return (
    <aside
      className={
        compact
          ? "rounded-lg border border-violet-200/80 bg-violet-50/50 px-2 py-1.5"
          : "mb-2 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/50 px-3 py-2"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <PlanifyIcon
            name="spark"
            className={`shrink-0 text-violet-700 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
          />
          <p
            className={`font-black text-violet-900 ${compact ? "text-xs" : "text-sm"}`}
          >
            Ajustar slides com IA
          </p>
          {!compact && !open ? (
            <p className="hidden text-xs font-semibold text-violet-800/80 sm:inline">
              — peça alterações antes de salvar
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={disabled || busy}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-white font-black text-violet-900 transition hover:border-violet-400 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 ${
            compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"
          }`}
          aria-expanded={open}
          title="Pedir ajustes ou acréscimos com IA"
        >
          {!compact ? <PlanifyIcon name="spark" className="h-3.5 w-3.5" /> : null}
          {open ? "Fechar" : "Pedir ajuste"}
        </button>
      </div>

      {open ? (
        <div className={`space-y-1.5 ${compact ? "mt-1.5" : "mt-2"}`}>
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={compact ? 2 : 3}
            placeholder="Ex.: inclua um slide sobre curiosidades; simplifique os bullets; troque a imagem do slide 3…"
            className={`w-full rounded-lg border border-violet-200 bg-white font-semibold text-slate-900 outline-none transition focus:border-violet-400 ${
              compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
            }`}
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className={`inline-flex items-center gap-1 rounded-lg bg-violet-700 font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"
              }`}
            >
              <PlanifyIcon name="spark" className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              {busy ? "Aplicando…" : retrying ? "Tentando novamente…" : "Aplicar com IA"}
            </button>
            <span className="text-[10px] font-semibold text-violet-800/80">
              Gera uma nova versão do slide com IA.
            </span>
          </div>
          {busy || retrying ? <MaterialPreviewSkeleton /> : null}
        </div>
      ) : null}
    </aside>
  );
}
