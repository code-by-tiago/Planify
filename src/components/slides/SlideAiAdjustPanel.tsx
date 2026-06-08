"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  buildSlideAdjustPayload,
  requestMaterialGeneration,
  type MaterialGenerationApiResult,
} from "@/lib/materiais/elevate-material-client";
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

  const canSubmit = Boolean(generationPayload && instruction.trim() && !busy && !disabled);

  async function handleSubmit() {
    if (!generationPayload || !instruction.trim()) return;

    setBusy(true);
    onAdjusting?.(true);

    try {
      const payload = buildSlideAdjustPayload(generationPayload, instruction.trim());
      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "1b39d8",
        },
        body: JSON.stringify({
          sessionId: "1b39d8",
          runId: "runtime",
          hypothesisId: "H4",
          location: "SlideAiAdjustPanel.tsx:handleSubmit",
          message: "slide ai adjust submitted",
          data: {
            hasObservacoes: Boolean(payload.observacoes?.includes("AJUSTE SOLICITADO")),
            instructionLen: instruction.trim().length,
            tipoMaterial: payload.tipoMaterial,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : "Não foi possível aplicar o ajuste com IA.",
      );
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
          ? "rounded-xl border border-violet-200/80 bg-violet-50/50 p-3"
          : "mb-4 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/50 px-4 py-3"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-violet-900">
            Ajustar slides com IA
          </p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-violet-800/90">
            Peça alterações ou acréscimos antes de salvar — sem voltar ao formulário.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={disabled || busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-900 transition hover:border-violet-400 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          aria-expanded={open}
          title="Pedir ajustes ou acréscimos com IA"
        >
          <PlanifyIcon name="spark" className="h-4 w-4" />
          {open ? "Fechar" : "Pedir ajuste"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            rows={3}
            placeholder="Ex.: inclua um slide sobre curiosidades; simplifique os bullets; troque a imagem do slide 3…"
            className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400"
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlanifyIcon name="spark" className="h-4 w-4" />
              {busy ? "Aplicando…" : "Aplicar com IA"}
            </button>
            <span className="text-[11px] font-semibold text-violet-800/80">
              Consome créditos como uma nova geração.
            </span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
