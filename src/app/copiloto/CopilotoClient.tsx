"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  CopilotoProgress,
  CopilotoWaveform,
} from "@/components/copiloto/CopilotoVoiceUx";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import {
  buildCopilotoGenerationPayload,
  buildCopilotoRefinePayload,
  correctPedagogicalTranscript,
  requestCopilotoInterpretation,
  requestCopilotoTranscription,
} from "@/lib/copiloto/copiloto-client";
import { CopilotoApiError } from "@/lib/copiloto/copiloto-api-contract";
import {
  COPILOTO_SOURCE,
  copilotoQuantityBounds,
  createCopilotoIdempotencyKey,
} from "@/lib/copiloto/copiloto-utils";
import {
  buildCopilotoGapFill,
  COPILOTO_PROGRESS_STAGES,
} from "@/lib/copiloto/gap-fill";
import {
  COPILOTO_MATERIAL_TYPES,
  COPILOTO_TYPE_LABELS,
  capCopilotoQuantity,
  type CopilotoBrief,
  type CopilotoMaterialType,
} from "@/lib/copiloto/types";
import {
  EDUCATION_STAGES,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  normalizeMaterialEducation,
  type EducationStage,
} from "@/lib/educacao/education-options";
import { requestMaterialGeneration } from "@/lib/materiais/elevate-material-client";
import {
  openMaterialInEditor,
  persistGeneratedMaterial,
  type MaterialEditorMeta,
} from "@/lib/materiais/material-editor-flow";
import {
  dispatchCreditsChangedIfNeeded,
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
  type FormattedGenerationError,
} from "@/lib/pro/generation-error-ui";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
  HUD_TOUCH_BTN,
} from "@/lib/pro/hud-form-styles";
import { getPlanifyTool } from "@/lib/pro/planifyTools";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";

type CopilotoClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
  initialTema?: string;
};

type Phase =
  | "idle"
  | "recording"
  | "transcribing"
  | "interpreting"
  | "ready"
  | "generating"
  | "refining";

const tool = getPlanifyTool("copiloto");
const MAX_RECORD_MS = 60_000;

function emptyBrief(transcript = ""): CopilotoBrief {
  return {
    transcript,
    tipoMaterial: "lista",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    areaConhecimento: "Ciências Humanas",
    componenteCurricular: "História",
    tema: "",
    conteudo: transcript,
    quantidade: 10,
    dificuldade: "media",
    inclusao: {
      ativa: false,
      necessidades: [],
      adaptacoesSugeridas: [],
      resumo: "Sem necessidade de inclusão detectada.",
    },
    alinhamento: { habilidades: [], tendencias: [], resumo: "" },
    confianca: {},
    resumoPedido: "",
    remapNotice: null,
    alinhamentoAviso: null,
  };
}

function enrichCopilotoError(
  formatted: FormattedGenerationError,
  error: unknown,
): FormattedGenerationError {
  const status =
    error instanceof CopilotoApiError
      ? error.status
      : error && typeof error === "object" && "status" in error
        ? Number((error as { status?: unknown }).status)
        : undefined;

  if (status === 401) {
    return {
      ...formatted,
      retryable: false,
      cta: (
        <Link href="/login?redirect=/dashboard%3Ftipo%3Dcopiloto" className="font-bold underline">
          Fazer login
        </Link>
      ),
    };
  }

  if (status === 403) {
    return {
      ...formatted,
      retryable: false,
      cta: (
        <Link href="/planos" className="font-bold underline">
          Ver planos
        </Link>
      ),
    };
  }

  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return {
      message: "Operação cancelada.",
      retryable: false,
    };
  }

  return formatted;
}

function canGenerateCopilotoBrief(brief: CopilotoBrief): boolean {
  return Boolean(brief.tema.trim() || brief.conteudo.trim());
}

function confidenceBadge(level?: string) {
  if (!level) return null;
  const color =
    level === "alta"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : level === "media"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${color}`}>
      {level}
    </span>
  );
}

export function CopilotoClient({
  studioMode = false,
  onStudioClose,
  initialTema = "",
}: CopilotoClientProps = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState(initialTema);
  const [brief, setBrief] = useState<CopilotoBrief>(() => emptyBrief(initialTema));
  const [error, setError] = useState("");
  const [errorCta, setErrorCta] = useState<ReactNode>(null);
  const [errorRetryable, setErrorRetryable] = useState(false);
  const [sttNotice, setSttNotice] = useState<string | null>(null);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [resultTitle, setResultTitle] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [lastPayload, setLastPayload] = useState<MaterialEngineInput | null>(null);
  const [lastEditorMeta, setLastEditorMeta] = useState<MaterialEditorMeta | null>(null);
  const [refineText, setRefineText] = useState("");
  const [progressLabel, setProgressLabel] = useState("");
  const [waveLevels, setWaveLevels] = useState<number[]>([]);
  const [assumptionsAccepted, setAssumptionsAccepted] = useState(false);
  const [recordMode, setRecordMode] = useState<"brief" | "refine">("brief");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const liveTranscriptRef = useRef("");
  const recordModeRef = useRef<"brief" | "refine">("brief");
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationIdempotencyRef = useRef<string | null>(null);
  const stopRecordingRef = useRef<() => void>(() => undefined);

  const { runWithRetry, retrying: retryingGeneration } = useRetryableAction();

  const yearOptions = useMemo(() => getYearOptions(brief.etapa), [brief.etapa]);
  const areaOptions = useMemo(() => getAreaOptions(brief.etapa), [brief.etapa]);
  const componentOptions = useMemo(
    () => getComponentOptions(brief.etapa, brief.areaConhecimento),
    [brief.etapa, brief.areaConhecimento],
  );

  const gapFill = useMemo(() => buildCopilotoGapFill(brief), [brief]);
  const needsAssumptionConfirm =
    gapFill.assumptions.length > 0 && !assumptionsAccepted;

  const quantityBounds = useMemo(
    () => copilotoQuantityBounds(brief.tipoMaterial),
    [brief.tipoMaterial],
  );

  const applyCopilotoError = useCallback((err: unknown) => {
    const formatted = enrichCopilotoError(formatGenerationError(err), err);
    setError(formatted.message);
    setErrorCta(formatted.cta ?? null);
    setErrorRetryable(formatted.retryable);
    dispatchCreditsChangedIfNeeded(err);
  }, []);

  const clearCopilotoError = useCallback(() => {
    setError("");
    setErrorCta(null);
    setErrorRetryable(false);
  }, []);

  const buildEditorMeta = useCallback(
    (
      payload: MaterialEngineInput,
      result: {
        pipeline?: string;
        qualityScore?: number;
        qualityIssues?: string[];
        materialId?: string | null;
        estrutura?: unknown;
      },
    ): MaterialEditorMeta => ({
      toolId: brief.tipoMaterial,
      tema: brief.tema,
      componente: brief.componenteCurricular,
      anoSerie: brief.anoSerie,
      etapa: brief.etapa,
      areaConhecimento: brief.areaConhecimento,
      pipeline: result.pipeline,
      qualityScore: result.qualityScore,
      qualityIssues: result.qualityIssues,
      generationPayload: payload,
      generationSource: COPILOTO_SOURCE,
      serverMaterialId: result.materialId ?? null,
      estrutura: result.estrutura as MaterialEditorMeta["estrutura"],
    }),
    [brief],
  );

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    setWaveLevels([]);
  }, []);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current != null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgressLabel("");
  }, []);

  const startProgressCycle = useCallback(
    (key: keyof typeof COPILOTO_PROGRESS_STAGES) => {
      clearProgressTimer();
      const stages = COPILOTO_PROGRESS_STAGES[key];
      let index = 0;
      setProgressLabel(stages[0] || "");
      progressTimerRef.current = window.setInterval(() => {
        index = (index + 1) % stages.length;
        setProgressLabel(stages[index] || stages[0] || "");
      }, 1800);
    },
    [clearProgressTimer],
  );

  useEffect(() => {
    return () => {
      clearTimer();
      clearProgressTimer();
      stopWaveform();
      stopTracks();
      speechRef.current?.stop();
      mediaRecorderRef.current?.stop();
    };
  }, [clearProgressTimer, clearTimer, stopTracks, stopWaveform]);

  function patchBrief(patch: Partial<CopilotoBrief>) {
    if (
      patch.tipoMaterial != null ||
      patch.tema != null ||
      patch.etapa != null ||
      patch.quantidade != null ||
      patch.anoSerie != null ||
      patch.conteudo != null
    ) {
      setAssumptionsAccepted(true);
      generationIdempotencyRef.current = null;
    }
    setBrief((prev) => {
      const next = { ...prev, ...patch };
      if (patch.tipoMaterial != null || patch.quantidade != null) {
        next.quantidade = capCopilotoQuantity(
          next.tipoMaterial,
          next.quantidade,
        );
      }
      if (patch.tipoMaterial != null || patch.tema != null || patch.etapa != null) {
        next.confianca = {
          ...next.confianca,
          ...(patch.tipoMaterial != null ? { tipoMaterial: "alta" as const } : {}),
          ...(patch.tema != null ? { tema: "alta" as const } : {}),
          ...(patch.etapa != null ? { etapa: "alta" as const } : {}),
          ...(patch.anoSerie != null ? { anoSerie: "alta" as const } : {}),
          ...(patch.quantidade != null ? { tipoMaterial: "alta" as const } : {}),
        };
      }
      if (
        patch.etapa != null ||
        patch.anoSerie != null ||
        patch.areaConhecimento != null ||
        patch.componenteCurricular != null
      ) {
        const edu = normalizeMaterialEducation(
          {
            etapa: next.etapa,
            anoSerie: next.anoSerie,
            areaConhecimento: next.areaConhecimento,
            componente: next.componenteCurricular,
          },
          {
            etapa: patch.etapa,
            anoSerie: patch.anoSerie,
            areaConhecimento: patch.areaConhecimento,
            componente: patch.componenteCurricular,
          },
        );
        next.etapa = edu.etapa;
        next.anoSerie = edu.anoSerie;
        next.areaConhecimento = edu.areaConhecimento;
        next.componenteCurricular = edu.componente;
      }
      return next;
    });
  }

  const lowConfidenceCritical =
    brief.confianca.tipoMaterial === "baixa" ||
    brief.confianca.tema === "baixa" ||
    brief.confianca.etapa === "baixa";

  function cancelActiveGeneration() {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    clearProgressTimer();
    setPhase(resultHtml ? "ready" : "idle");
  }

  async function interpretText(text: string) {
    const cleaned = correctPedagogicalTranscript(text);
    if (cleaned.length < 8) {
      setError("Descreva o pedido com um pouco mais de detalhe.");
      setErrorCta(null);
      setErrorRetryable(false);
      return;
    }
    clearCopilotoError();
    setAssumptionsAccepted(false);
    setPhase("interpreting");
    startProgressCycle("interpreting");
    try {
      const next = await requestCopilotoInterpretation(cleaned);
      setBrief(next);
      setTranscript(next.transcript);
      setPhase("ready");
    } catch (err) {
      applyCopilotoError(err);
      setPhase("idle");
    } finally {
      clearProgressTimer();
    }
  }

  async function handleAudioBlob(blob: Blob, liveTranscript: string) {
    setPhase("transcribing");
    startProgressCycle("transcribing");
    clearCopilotoError();
    setSttNotice(null);
    try {
      let text = correctPedagogicalTranscript(liveTranscript.trim());
      let usedBrowserFallback = false;
      try {
        text = await requestCopilotoTranscription(blob);
      } catch {
        if (!text) throw new Error("Não foi possível transcrever o áudio.");
        usedBrowserFallback = true;
      }

      if (usedBrowserFallback) {
        setSttNotice(
          "A transcrição do servidor falhou; usamos o reconhecimento local do navegador. Revise o texto antes de gerar.",
        );
      }

      if (recordModeRef.current === "refine") {
        setRefineText(text);
        setPhase("ready");
        clearProgressTimer();
        return;
      }

      setTranscript(text);
      await interpretText(text);
    } catch (err) {
      applyCopilotoError(err);
      setPhase(resultHtml ? "ready" : "idle");
      clearProgressTimer();
    }
  }

  function startWaveform(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        const node = analyserRef.current;
        if (!node) return;
        node.getByteFrequencyData(data);
        const sample = Array.from({ length: 16 }, (_, i) => {
          const v = data[i] ?? 0;
          return Math.max(0.12, v / 255);
        });
        setWaveLevels(sample);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // fallback CSS waveform
    }
  }

  async function startRecording(mode: "brief" | "refine" = "brief") {
    clearCopilotoError();
    setSttNotice(null);
    setRecordMode(mode);
    recordModeRef.current = mode;
    liveTranscriptRef.current = "";
    if (mode === "brief") setResultHtml(null);
    chunksRef.current = [];
    setSeconds(0);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Seu navegador não permite gravação de áudio. Digite o pedido abaixo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const SpeechAPI =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : undefined;
      if (SpeechAPI) {
        const recognition = new SpeechAPI();
        recognition.lang = "pt-BR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          let interim = "";
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const piece = event.results[i]?.[0]?.transcript || "";
            if (event.results[i]?.isFinal) finalText += piece;
            else interim += piece;
          }
          if (finalText) {
            liveTranscriptRef.current = correctPedagogicalTranscript(
              `${liveTranscriptRef.current} ${finalText}`.trim(),
            );
          }
          const live = correctPedagogicalTranscript(
            `${liveTranscriptRef.current} ${interim}`.trim(),
          );
          if (recordModeRef.current === "refine") setRefineText(live);
          else setTranscript(live);
        };
        recognition.onerror = () => {
          setSttNotice(
            "O reconhecimento de voz local encontrou um problema. Você pode digitar o pedido ou tentar gravar de novo.",
          );
        };
        recognition.onend = () => {
          if (
            mediaRecorderRef.current?.state === "recording" &&
            !liveTranscriptRef.current.trim()
          ) {
            setSttNotice(
              "Não captamos fala clara no microfone local. Revise o texto ou grave novamente.",
            );
          }
        };
        recognition.start();
        speechRef.current = recognition;
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimer();
        stopWaveform();
        speechRef.current?.stop();
        speechRef.current = null;
        stopTracks();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        void handleAudioBlob(blob, liveTranscriptRef.current);
      };

      recorder.start(250);
      setPhase("recording");
      let elapsed = 0;
      timerRef.current = window.setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORD_MS / 1000) {
          stopRecordingRef.current();
        }
      }, 1000);
    } catch {
      applyCopilotoError(
        new Error(
          "Microfone bloqueado. Toque em “Tentar de novo” após liberar o microfone nas configurações do navegador, ou digite o pedido.",
        ),
      );
      stopWaveform();
      stopTracks();
      setPhase(resultHtml ? "ready" : "idle");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    mediaRecorderRef.current = null;
  }

  stopRecordingRef.current = stopRecording;

  async function generateMaterial() {
    if (!canGenerateCopilotoBrief(brief)) {
      setError("Revise o brief: tema ou conteúdo é obrigatório.");
      setErrorCta(null);
      setErrorRetryable(false);
      return;
    }
    if (needsAssumptionConfirm) {
      setError("Confirme as premissas inteligentes abaixo antes de gerar.");
      setErrorCta(null);
      setErrorRetryable(false);
      return;
    }
    clearCopilotoError();
    setPhase("generating");
    startProgressCycle("generating");
    setResultHtml(null);

    generationAbortRef.current?.abort();
    const abortController = new AbortController();
    generationAbortRef.current = abortController;

    if (!generationIdempotencyRef.current) {
      generationIdempotencyRef.current = createCopilotoIdempotencyKey();
    }

    try {
      await runWithRetry(async () => {
        const payload = buildCopilotoGenerationPayload(
          brief,
          generationIdempotencyRef.current || undefined,
        );
        const result = await requestMaterialGeneration(payload, {
          signal: abortController.signal,
        });
        if (!result.html) {
          throw new Error(result.message || "A geração não retornou HTML.");
        }

        const title =
          brief.tema.trim() ||
          `${brief.tipoMaterial} — ${brief.componenteCurricular}`;
        const meta = buildEditorMeta(payload, result);

        persistGeneratedMaterial(result.html, title, meta);
        setLastPayload(payload);
        setLastEditorMeta(meta);
        setResultHtml(result.html);
        setResultTitle(title);
        setRefineText("");
        generationIdempotencyRef.current = null;
        setPhase("ready");
      }, { onError: dispatchCreditsChangedIfNeeded });
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }
      applyCopilotoError(err);
      setPhase("ready");
    } finally {
      generationAbortRef.current = null;
      clearProgressTimer();
    }
  }

  async function refineMaterial() {
    if (!lastPayload || !resultHtml) {
      setError("Gere um material antes de pedir ajustes.");
      setErrorCta(null);
      setErrorRetryable(false);
      return;
    }
    const instruction = correctPedagogicalTranscript(refineText);
    if (instruction.length < 6) {
      setError("Diga o que quer mudar (ex.: mude a questão 3 para dissertativa).");
      setErrorCta(null);
      setErrorRetryable(false);
      return;
    }

    clearCopilotoError();
    setPhase("refining");
    startProgressCycle("refining");

    generationAbortRef.current?.abort();
    const abortController = new AbortController();
    generationAbortRef.current = abortController;

    try {
      await runWithRetry(async () => {
        const payload = buildCopilotoRefinePayload(
          lastPayload,
          instruction,
          resultTitle || brief.tema,
        );
        const result = await requestMaterialGeneration(payload, {
          signal: abortController.signal,
        });
        if (!result.html) {
          throw new Error(result.message || "Não foi possível aplicar o ajuste.");
        }

        const title = resultTitle || brief.tema;
        const meta = buildEditorMeta(payload, result);
        persistGeneratedMaterial(result.html, title, meta);
        setLastPayload(payload);
        setLastEditorMeta(meta);
        setResultHtml(result.html);
        setRefineText("");
        setPhase("ready");
      }, { onError: dispatchCreditsChangedIfNeeded });
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }
      applyCopilotoError(err);
      setPhase("ready");
    } finally {
      generationAbortRef.current = null;
      clearProgressTimer();
    }
  }

  function openEditor() {
    if (!resultHtml) return;
    const meta =
      lastEditorMeta ||
      buildEditorMeta(
        lastPayload || buildCopilotoGenerationPayload(brief),
        {},
      );
    openMaterialInEditor(
      resultHtml,
      resultTitle || brief.tema,
      meta,
      { from: "copiloto" },
    );
  }

  const busy =
    phase === "recording" ||
    phase === "transcribing" ||
    phase === "interpreting" ||
    phase === "generating" ||
    phase === "refining";

  const form = (
    <div className="flex h-full min-h-0 flex-col gap-5 p-4 max-lg:pb-24 sm:p-5">
      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-50/80 to-white p-5">
        <p className="text-sm font-bold text-slate-800">Fale o pedido</p>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Ex.: “Preciso de uma atividade lúdica de história para o 6º ano sobre Egito, com dois
          alunos autistas na turma.”
        </p>

        <div className="mt-5 flex flex-col items-center gap-3">
          {phase === "recording" && recordMode === "brief" ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200 transition hover:brightness-105"
              aria-label="Parar gravação"
            >
              <span className="h-6 w-6 rounded-sm bg-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording("brief")}
              disabled={busy}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0A192F] text-white shadow-lg transition hover:bg-[#132844] disabled:opacity-50"
              aria-label="Gravar pedido"
            >
              <PlanifyIcon name="mic" className="h-8 w-8" />
            </button>
          )}
          {(phase === "recording" && recordMode === "brief") || waveLevels.length > 0 ? (
            <CopilotoWaveform
              active={phase === "recording" && recordMode === "brief"}
              levels={waveLevels}
            />
          ) : null}
          <p className="text-xs font-semibold text-slate-500">
            {phase === "recording" && recordMode === "brief"
              ? `Gravando… ${seconds}s (máx. 60s)`
              : phase === "transcribing"
                ? progressLabel || "Transcrevendo áudio…"
                : phase === "interpreting"
                  ? progressLabel || "Estruturando brief e alinhamento…"
                  : "Toque para gravar ou digite abaixo"}
          </p>
        </div>

        <div className="mt-4">
          <CopilotoProgress
            active={phase === "transcribing" || phase === "interpreting"}
            stages={
              phase === "transcribing"
                ? COPILOTO_PROGRESS_STAGES.transcribing
                : COPILOTO_PROGRESS_STAGES.interpreting
            }
            label={progressLabel}
          />
        </div>
      </div>

      <div>
        <label className={HUD_SECTION_LABEL} htmlFor="copiloto-transcript">
          Pedido (editável)
        </label>
        <textarea
          id="copiloto-transcript"
          className={`${HUD_TEXTAREA_CLASS} min-h-[110px]`}
          value={transcript}
          disabled={busy}
          onChange={(e) =>
            setTranscript(correctPedagogicalTranscript(e.target.value))
          }
          placeholder="Digite ou revise a transcrição do pedido…"
        />
        <button
          type="button"
          disabled={busy || transcript.trim().length < 8}
          onClick={() => void interpretText(transcript)}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          Estruturar pedido
        </button>
      </div>

      {sttNotice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {sttNotice}
        </div>
      ) : null}

      {error ? (
        <div className="space-y-2">
          <GenerationErrorBanner
            message={error}
            cta={errorCta}
            retryable={errorRetryable}
            onRetry={() => {
              if (phase === "generating") void generateMaterial();
              else if (phase === "refining") void refineMaterial();
              else if (/interpret/i.test(progressLabel)) void interpretText(transcript);
              else void startRecording("brief");
            }}
            retrying={retryingGeneration || phase === "generating" || phase === "refining"}
          />
          {/microfone|áudio|grav/i.test(error) ? (
            <button
              type="button"
              onClick={() => void startRecording("brief")}
              className={`${HUD_TOUCH_BTN} w-full border border-cyan-300 bg-cyan-50 text-cyan-900`}
            >
              Tentar microfone de novo
            </button>
          ) : null}
        </div>
      ) : null}

      {phase === "ready" || brief.tema ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-slate-900">Brief estruturado</p>
            {brief.resumoPedido ? (
              <p className="text-xs font-medium text-slate-500">{brief.resumoPedido}</p>
            ) : null}
          </div>

          {brief.remapNotice ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {brief.remapNotice}
            </div>
          ) : null}

          {gapFill.assumptions.length > 0 ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-sky-800">
                Premissas inteligentes
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-sky-950">
                {gapFill.assumptions.map((item) => (
                  <li key={item.field}>
                    <span className="font-bold">{item.label}:</span> {item.value}
                    <span className="block text-xs font-medium text-sky-700">
                      {item.reason}
                    </span>
                  </li>
                ))}
              </ul>
              {gapFill.pendingQuestions.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm font-semibold text-sky-900">
                  {gapFill.pendingQuestions.map((q) => (
                    <li key={q.id}>• {q.question}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                onClick={() => setAssumptionsAccepted(true)}
                className="mt-3 rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white"
              >
                {assumptionsAccepted
                  ? "Premissas confirmadas"
                  : "Confirmar premissas e continuar"}
              </button>
            </div>
          ) : null}

          {lowConfidenceCritical ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
              Revise tipo, tema e etapa (confiança baixa) antes de gerar.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={HUD_SECTION_LABEL}>
                Tipo {confidenceBadge(brief.confianca.tipoMaterial)}
              </label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.tipoMaterial}
                onChange={(e) =>
                  patchBrief({ tipoMaterial: e.target.value as CopilotoMaterialType })
                }
              >
                {COPILOTO_MATERIAL_TYPES.map((id) => (
                  <option key={id} value={id}>
                    {COPILOTO_TYPE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>
                Tema {confidenceBadge(brief.confianca.tema)}
              </label>
              <input
                className={HUD_FIELD_CLASS}
                value={brief.tema}
                onChange={(e) => patchBrief({ tema: e.target.value })}
              />
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>
                Etapa {confidenceBadge(brief.confianca.etapa)}
              </label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.etapa}
                onChange={(e) =>
                  patchBrief({ etapa: e.target.value as EducationStage })
                }
              >
                {EDUCATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>
                Ano/série {confidenceBadge(brief.confianca.anoSerie)}
              </label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.anoSerie}
                onChange={(e) => patchBrief({ anoSerie: e.target.value })}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>Área</label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.areaConhecimento}
                onChange={(e) => patchBrief({ areaConhecimento: e.target.value })}
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>
                Componente {confidenceBadge(brief.confianca.componenteCurricular)}
              </label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.componenteCurricular}
                onChange={(e) =>
                  patchBrief({ componenteCurricular: e.target.value })
                }
              >
                {componentOptions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>
                Quantidade ({quantityBounds.min}–{quantityBounds.max})
              </label>
              <input
                type="number"
                min={quantityBounds.min}
                max={quantityBounds.max}
                className={HUD_FIELD_CLASS}
                value={brief.quantidade}
                onChange={(e) =>
                  patchBrief({ quantidade: Number(e.target.value) || quantityBounds.min })
                }
              />
            </div>
            <div>
              <label className={HUD_SECTION_LABEL}>Dificuldade</label>
              <select
                className={HUD_FIELD_CLASS}
                value={brief.dificuldade}
                onChange={(e) =>
                  patchBrief({
                    dificuldade: e.target.value as CopilotoBrief["dificuldade"],
                  })
                }
              >
                <option value="facil">Fácil</option>
                <option value="media">Média</option>
                <option value="avancada">Avançada</option>
              </select>
            </div>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL}>Conteúdo / instruções</label>
            <textarea
              className={`${HUD_TEXTAREA_CLASS} min-h-[100px]`}
              value={brief.conteudo}
              onChange={(e) => patchBrief({ conteudo: e.target.value })}
            />
          </div>

          {brief.inclusao.ativa ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-teal-800">
                Inclusão {confidenceBadge(brief.confianca.inclusao)}
              </p>
              <p className="mt-1 text-sm font-medium text-teal-900">
                {brief.inclusao.resumo}
              </p>
              {brief.inclusao.adaptacoesSugeridas.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-900">
                  {brief.inclusao.adaptacoesSugeridas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {brief.alinhamentoAviso ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {brief.alinhamentoAviso}
            </div>
          ) : null}

          {brief.alinhamento.resumo ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-800">
                Alinhamento dinâmico
              </p>
              <p className="mt-1 text-sm font-medium text-indigo-950">
                {brief.alinhamento.resumo}
              </p>
              {brief.alinhamento.habilidades.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-indigo-900">
                  {brief.alinhamento.habilidades.map((h) => (
                    <li key={h.codigo}>
                      <span className="font-bold">{h.codigo}</span> — {h.descricao}
                    </li>
                  ))}
                </ul>
              ) : null}
              {brief.alinhamento.tendencias.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-indigo-900">
                  {brief.alinhamento.tendencias.map((t) => (
                    <li key={`${t.fonte}-${t.topico}`}>
                      <span className="font-bold uppercase">{t.fonte}</span>: {t.topico}{" "}
                      ({t.evidencias})
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            disabled={
              busy ||
              lowConfidenceCritical ||
              needsAssumptionConfirm ||
              !canGenerateCopilotoBrief(brief)
            }
            onClick={() => void generateMaterial()}
            className={`${HUD_TOUCH_BTN} hidden w-full bg-[#26C6DA] text-[#0A192F] shadow-sm transition hover:brightness-105 disabled:opacity-50 lg:inline-flex`}
          >
            <PlanifyIcon name="spark" className="h-4 w-4" />
            {phase === "generating" ? "Gerando material…" : "Gerar material"}
          </button>

          <MaterialToolMobileSubmitBar>
            <button
              type="button"
              disabled={
                busy ||
                lowConfidenceCritical ||
                needsAssumptionConfirm ||
                !canGenerateCopilotoBrief(brief)
              }
              onClick={() => void generateMaterial()}
              className={`${HUD_TOUCH_BTN} flex-1 bg-[#26C6DA] text-[#0A192F] shadow-sm disabled:opacity-50`}
            >
              <PlanifyIcon name="spark" className="h-4 w-4" />
              {phase === "generating" ? "Gerando…" : "Gerar material"}
            </button>
          </MaterialToolMobileSubmitBar>
        </div>
      ) : null}
    </div>
  );

  const preview = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {phase === "generating" || phase === "refining" ? (
        <div className="flex h-full flex-col gap-4 p-6">
          <PlanifyOwlGenerationCoach
            active
            title={
              progressLabel ||
              (phase === "refining"
                ? "Aplicando seu ajuste…"
                : tool.loadingTitle)
            }
            description={
              phase === "refining"
                ? "Preservando o que já estava bom e reescrevendo o pedido."
                : tool.loadingDescription
            }
            context="material"
            toolId={brief.tipoMaterial || "copiloto"}
            progressSteps={
              phase === "refining"
                ? [...COPILOTO_PROGRESS_STAGES.refining]
                : [...COPILOTO_PROGRESS_STAGES.generating]
            }
          />
          <button
            type="button"
            onClick={cancelActiveGeneration}
            className={`${HUD_TOUCH_BTN} w-full border border-slate-300 bg-white text-slate-800`}
          >
            Cancelar {phase === "refining" ? "ajuste" : "geração"}
          </button>
          <MaterialPreviewSkeleton />
        </div>
      ) : resultHtml ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-slate-800">{resultTitle}</p>
              <button
                type="button"
                onClick={openEditor}
                className="rounded-lg bg-[#0A192F] px-3 py-2 text-xs font-bold text-white"
              >
                Abrir no editor
              </button>
            </div>
            <GoogleDocumentExportBar
              title={resultTitle || "Material Copiloto"}
              getHtml={() => resultHtml}
              documentType={`material:${brief.tipoMaterial}`}
              returnTo="/dashboard?tipo=copiloto"
              compact
              classroomMode="popover"
              disabled={!resultHtml}
              onStatus={setExportStatus}
              onExportError={(error) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Falha na exportação para o Google.";
                setExportStatus(`Falha na exportação — ${message}`);
              }}
              downloadingPdf={downloadingPdf}
              downloadingDocx={downloadingDocx}
              classroomMetadata={{
                disciplina: brief.componenteCurricular,
                anoSerie: brief.anoSerie,
                etapa: brief.etapa,
                tema: brief.tema,
              }}
              onDownloadPdf={() => {
                void (async () => {
                  if (!resultHtml) return;
                  setDownloadingPdf(true);
                  try {
                    await downloadEditorExport({
                      title: resultTitle || "Material Copiloto",
                      html: resultHtml,
                      format: "pdf",
                      documentType: `material:${brief.tipoMaterial}`,
                    });
                    setExportStatus("PDF baixado.");
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Não foi possível baixar o PDF.";
                    setExportStatus(message);
                  } finally {
                    setDownloadingPdf(false);
                  }
                })();
              }}
              onDownloadDocx={() => {
                void (async () => {
                  if (!resultHtml) return;
                  setDownloadingDocx(true);
                  try {
                    await downloadEditorExport({
                      title: resultTitle || "Material Copiloto",
                      html: resultHtml,
                      format: "docx",
                      documentType: `material:${brief.tipoMaterial}`,
                    });
                    setExportStatus("DOCX baixado.");
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Não foi possível baixar o DOCX.";
                    setExportStatus(message);
                  } finally {
                    setDownloadingDocx(false);
                  }
                })();
              }}
            />
            {exportStatus ? (
              <p className="text-[11px] font-semibold text-slate-500">{exportStatus}</p>
            ) : null}
          </div>

          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Refinar com voz ou texto
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Ex.: “Mude a questão 3 para dissertativa e adicione um texto de apoio no início.”
            </p>
            <div className="mt-3 flex items-start gap-2">
              {phase === "recording" && recordMode === "refine" ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex h-12 w-12 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-rose-500 text-white"
                  aria-label="Parar gravação do ajuste"
                >
                  <span className="h-3 w-3 rounded-sm bg-white" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void startRecording("refine")}
                  className="flex h-12 w-12 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-[#0A192F] text-white disabled:opacity-50"
                  aria-label="Gravar ajuste"
                >
                  <PlanifyIcon name="mic" className="h-4 w-4" />
                </button>
              )}
              <textarea
                className={`${HUD_TEXTAREA_CLASS} min-h-[72px] flex-1`}
                value={refineText}
                disabled={busy}
                onChange={(e) =>
                  setRefineText(correctPedagogicalTranscript(e.target.value))
                }
                placeholder="Descreva o ajuste…"
              />
            </div>
            {phase === "recording" && recordMode === "refine" ? (
              <div className="mt-2">
                <CopilotoWaveform active levels={waveLevels} />
              </div>
            ) : null}
            <button
              type="button"
              disabled={busy || refineText.trim().length < 6}
              onClick={() => void refineMaterial()}
              className={`${HUD_TOUCH_BTN} mt-2 bg-cyan-600 text-white disabled:opacity-50`}
            >
              Aplicar ajuste
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <MaterialTypedPreview html={resultHtml} tipoMaterial={brief.tipoMaterial} />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <PlanifyIcon name="mic" className="h-10 w-10 text-cyan-500" />
          <p className="text-sm font-bold text-slate-800">Copiloto por voz</p>
          <p className="max-w-sm text-sm font-medium text-slate-500">
            Grave ou digite o pedido. A IA monta o brief e gera lista, prova, redação, plano
            de aula ou dinâmica — com BNCC e qualidade máxima.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <MaterialToolPageShell
      tool={tool}
      studioMode={studioMode}
      onBack={studioMode ? onStudioClose : undefined}
      backLabel={studioMode ? "Início" : "Voltar"}
      form={form}
      preview={preview}
      previewReady={Boolean(resultHtml)}
      previewLoading={phase === "generating" || phase === "refining"}
    />
  );
}
