"use client";

import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { requestInclusaoGeneration } from "@/lib/inclusao/inclusao-client";
import {
  INCLUSAO_NEEDS,
  getInclusaoNeedLabel,
  type InclusaoEducationLevel,
  type InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";
import {
  createLessonExecutionSession,
  fetchTeacherLessonExecutionSession,
  updateLessonExecutionSession,
  type LessonExecutionQuestion,
  type LessonExecutionResults,
  type LessonExecutionSession,
} from "@/lib/lesson-execution/lesson-execution-client";
import { useCallback, useEffect, useMemo, useState } from "react";

type PlanoAulaExecutionPanelProps = {
  title: string;
  html: string;
  etapa: string;
  anoSerie: string;
  componente: string;
  className?: string;
  onStatus?: (message: string) => void;
  onError?: (error: unknown) => void;
};

const POLL_INTERVAL_MS = 2200;

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    return normalizeText(html.replace(/<[^>]+>/g, " "));
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script,style,noscript").forEach((node) => node.remove());
  return normalizeText(document.body.textContent || "");
}

function resolveEducationLevel(
  etapa: string,
  anoSerie: string,
): InclusaoEducationLevel {
  const source = `${etapa} ${anoSerie}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (source.includes("infantil")) return "Educação Infantil";
  if (
    source.includes("medio") ||
    source.includes("1a") ||
    source.includes("2a") ||
    source.includes("3a")
  ) {
    return "Ensino Médio";
  }
  if (/[6-9]/.test(source) || source.includes("fundamental ii")) {
    return "EF II (6º ao 9º ano)";
  }
  return "EF I (1º ao 5º ano)";
}

function buildJoinUrl(code: string): string {
  const path = `/jogar/${encodeURIComponent(code)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function buildQrUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    url,
  )}`;
}

function statusLabel(status: LessonExecutionSession["status"]): string {
  switch (status) {
    case "live":
      return "Ao vivo";
    case "paused":
      return "Pausada";
    case "ended":
      return "Encerrada";
    default:
      return "Pronta";
  }
}

function questionTypeLabel(question: LessonExecutionQuestion): string {
  if (question.type === "short_answer") return "Resposta curta";
  if (question.type === "quick_check") return "Checagem rápida";
  return "Múltipla escolha";
}

function resultForQuestion(
  results: LessonExecutionResults | undefined,
  questionId: string,
) {
  return (
    results?.responsesByQuestion[questionId] ?? {
      total: 0,
      options: {},
      latest: [],
    }
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function QuestionResults({
  question,
  results,
}: {
  question: LessonExecutionQuestion;
  results?: LessonExecutionResults;
}) {
  const bucket = resultForQuestion(results, question.id);
  const max = Math.max(1, ...Object.values(bucket.options));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">
            Resultado em tempo real
          </p>
          <h3 className="mt-1 text-sm font-black text-slate-950">
            {question.title}
          </h3>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
          {bucket.total} respostas
        </span>
      </div>

      {question.options.length ? (
        <div className="mt-4 space-y-3">
          {question.options.map((option) => {
            const count = bucket.options[option] || 0;
            const width = `${Math.max(4, (count / max) * 100)}%`;

            return (
              <div key={option}>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                  <span className="truncate">{option}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : bucket.latest.length ? (
        <div className="mt-4 grid gap-2">
          {bucket.latest.map((item, index) => (
            <div
              key={`${item.createdAt}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs font-black text-slate-900">
                {item.displayName}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">
          Aguardando as primeiras respostas.
        </p>
      )}
    </div>
  );
}

function TeacherLessonModeOverlay({
  session,
  updating,
  onClose,
  onUpdate,
}: {
  session: LessonExecutionSession;
  updating: boolean;
  onClose: () => void;
  onUpdate: (input: {
    activeSlideIndex?: number;
    activeQuestionId?: string | null;
    status?: LessonExecutionSession["status"];
  }) => Promise<void>;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slide = session.slides[session.activeSlideIndex] ?? session.slides[0];
  const slideQuestion = session.questions.find(
    (question) => question.slideIndex === session.activeSlideIndex,
  );
  const activeQuestion =
    session.questions.find((question) => question.id === session.activeQuestionId) ??
    null;

  const goToSlide = useCallback(
    async (nextIndex: number) => {
      await onUpdate({
        activeSlideIndex: Math.min(
          Math.max(0, nextIndex),
          Math.max(0, session.slides.length - 1),
        ),
        activeQuestionId: null,
      });
    },
    [onUpdate, session.slides.length],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void goToSlide(session.activeSlideIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        void goToSlide(session.activeSlideIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToSlide, onClose, session.activeSlideIndex]);

  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 text-white">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
              Aula ao vivo
            </p>
            <p className="truncate text-xs font-semibold text-slate-300">
              {session.activeSlideIndex + 1} / {session.slides.length} · Sala{" "}
              {session.code}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((current) => !current)}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              {isFullscreen ? "Mostrar painel" : "Foco"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Fechar modo aula"
              title="Fechar"
            >
              <PlanifyIcon name="close" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main
          className={`grid min-h-0 flex-1 gap-4 px-4 py-6 sm:px-8 ${
            isFullscreen ? "place-items-center" : "lg:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          <section className="flex min-h-0 w-full items-center justify-center">
            <div className="w-full max-w-5xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                {slide.sequenceLabel || slide.layout || "Roteiro"}
              </p>
              <h2 className="mt-4 max-w-5xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                {slide.title}
              </h2>
              {slide.subtitle ? (
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-slate-300">
                  {slide.subtitle}
                </p>
              ) : null}
              {slide.bullets?.length ? (
                <ul className="mt-8 grid gap-4 text-lg font-semibold leading-8 text-slate-100 sm:text-2xl sm:leading-10">
                  {slide.bullets.slice(0, 5).map((bullet) => (
                    <li key={bullet} className="flex gap-4">
                      <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-300" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {slide.callout?.text ? (
                <div className="mt-8 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5">
                  {slide.callout.title ? (
                    <p className="text-xs font-black uppercase tracking-wide text-cyan-200">
                      {slide.callout.title}
                    </p>
                  ) : null}
                  <p className="mt-1 text-lg font-bold leading-8 text-white">
                    {slide.callout.text}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {!isFullscreen ? (
            <aside className="min-h-0 overflow-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                    Celulares
                  </p>
                  <p className="text-sm font-black text-white">
                    {statusLabel(session.status)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">
                  {session.results?.participantCount || 0} alunos
                </span>
              </div>

              {activeQuestion ? (
                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-200">
                    Pergunta aberta
                  </p>
                  <p className="mt-2 text-lg font-black leading-6 text-white">
                    {activeQuestion.prompt}
                  </p>
                  <QuestionResults
                    question={activeQuestion}
                    results={session.results}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold text-slate-200">
                    Nenhuma pergunta aberta agora.
                  </p>
                  {slideQuestion ? (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate({
                          activeQuestionId: slideQuestion.id,
                          activeSlideIndex: slideQuestion.slideIndex,
                          status: "live",
                        })
                      }
                      disabled={updating}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
                    >
                      <PlanifyIcon name="spark" className="h-4 w-4" />
                      Abrir pergunta deste slide
                    </button>
                  ) : null}
                </div>
              )}
            </aside>
          ) : null}
        </main>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => void goToSlide(session.activeSlideIndex - 1)}
            disabled={updating || session.activeSlideIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
            Anterior
          </button>
          <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all"
                style={{
                  width: `${((session.activeSlideIndex + 1) / session.slides.length) * 100}%`,
                }}
              />
            </div>
            {slideQuestion ? (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    activeQuestionId:
                      session.activeQuestionId === slideQuestion.id
                        ? null
                        : slideQuestion.id,
                    activeSlideIndex: slideQuestion.slideIndex,
                    status: "live",
                  })
                }
                disabled={updating}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
              >
                {session.activeQuestionId === slideQuestion.id
                  ? "Fechar pergunta"
                  : "Abrir pergunta"}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void goToSlide(session.activeSlideIndex + 1)}
            disabled={updating || session.activeSlideIndex === session.slides.length - 1}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}

export function PlanoAulaExecutionPanel({
  title,
  html,
  etapa,
  anoSerie,
  componente,
  className = "",
  onStatus,
  onError,
}: PlanoAulaExecutionPanelProps) {
  const [need, setNeed] = useState<InclusaoNeedId>("tdah");
  const [adapting, setAdapting] = useState(false);
  const [adaptedHtml, setAdaptedHtml] = useState("");
  const [session, setSession] = useState<LessonExecutionSession | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState("");

  const educationLevel = useMemo(
    () => resolveEducationLevel(etapa, anoSerie),
    [anoSerie, etapa],
  );
  const joinUrl = useMemo(() => (session ? buildJoinUrl(session.code) : ""), [session]);
  const qrUrl = useMemo(() => (joinUrl ? buildQrUrl(joinUrl) : ""), [joinUrl]);
  const activeQuestion = useMemo(
    () =>
      session?.questions.find((question) => question.id === session.activeQuestionId) ??
      null,
    [session],
  );

  const refreshSession = useCallback(
    async (sessionId: string, silent = false) => {
      try {
        const fresh = await fetchTeacherLessonExecutionSession(sessionId);
        setSession(fresh);
      } catch (error) {
        if (!silent) {
          setLocalError(
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar a aula ao vivo.",
          );
          onError?.(error);
        }
      }
    },
    [onError],
  );

  useEffect(() => {
    if (!session?.id || session.status === "ended") return;

    const intervalId = window.setInterval(() => {
      void refreshSession(session.id, true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshSession, session?.id, session?.status]);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function adaptLesson() {
    setAdapting(true);
    setLocalError("");

    try {
      const text = stripHtml(html).slice(0, 12_000);
      const result = await requestInclusaoGeneration({
        modo: "adaptacao",
        necessidade: need,
        etapaEnsino: educationLevel,
        conteudo: text,
        observacoes:
          "Adapte este plano de aula para execução em sala. Preserve objetivo, conteúdo, avaliação e tempo; torne comandos, mediações e evidências adequados ao perfil selecionado.",
        discipline: componente,
        disciplina: componente,
      });

      setAdaptedHtml(result.html);
      onStatus?.(`Adaptação para ${getInclusaoNeedLabel(need)} criada.`);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Não foi possível adaptar este plano de aula.",
      );
      onError?.(error);
    } finally {
      setAdapting(false);
    }
  }

  async function startSession() {
    setCreatingSession(true);
    setLocalError("");

    try {
      const created = await createLessonExecutionSession({
        title,
        html,
        documentType: "material:plano-aula",
      });
      setSession(created);
      onStatus?.(`Sala ${created.code} criada para esta aula.`);
      void refreshSession(created.id, true);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a sala ao vivo.",
      );
      onError?.(error);
    } finally {
      setCreatingSession(false);
    }
  }

  async function applySessionUpdate(input: {
    activeSlideIndex?: number;
    activeQuestionId?: string | null;
    status?: LessonExecutionSession["status"];
  }) {
    if (!session) return;
    setUpdatingSession(true);
    setLocalError("");

    try {
      const updated = await updateLessonExecutionSession({
        sessionId: session.id,
        ...input,
      });
      setSession((current) => ({
        ...updated,
        results: updated.results ?? current?.results,
      }));
      void refreshSession(session.id, true);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : "Não foi possível controlar a aula ao vivo.",
      );
      onError?.(error);
    } finally {
      setUpdatingSession(false);
    }
  }

  async function copyJoinUrl() {
    if (!joinUrl) return;

    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      onStatus?.("Link da aula copiado.");
    } catch (error) {
      setLocalError("Não foi possível copiar o link. Copie pelo campo exibido.");
      onError?.(error);
    }
  }

  return (
    <section
      className={`mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-4 py-4 text-white sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Aula executável
            </p>
            <h2 className="mt-1 text-base font-black tracking-tight sm:text-lg">
              Plano pronto para apresentar, adaptar e conduzir ao vivo
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {session ? (
              <button
                type="button"
                onClick={() => setModeOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-50"
              >
                <PlanifyIcon name="presentation" className="h-4 w-4" />
                Apresentar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startSession()}
                disabled={creatingSession}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlanifyIcon name="spark" className="h-4 w-4" />
                {creatingSession ? "Criando..." : "Criar sala ao vivo"}
              </button>
            )}
            <GoogleSlidesExportButton
              title={title}
              getHtml={() => html}
              documentType="material:plano-aula"
              returnTo="/dashboard"
              iconOnly={false}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-200 disabled:opacity-60"
              onStatus={onStatus}
              onExportError={onError}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Sala ao vivo
                </p>
                <h3 className="mt-1 text-base font-black text-slate-950">
                  {session ? `Código ${session.code}` : "Crie uma sala para os alunos"}
                </h3>
              </div>
              {session ? (
                <span className="inline-flex w-fit items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {statusLabel(session.status)}
                </span>
              ) : null}
            </div>

            {session ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="aspect-square overflow-hidden rounded-xl border border-slate-100 bg-white p-3">
                    <img
                      src={qrUrl}
                      alt={`QR Code da sala ${session.code}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 text-center text-3xl font-black tracking-[0.18em] text-slate-950">
                    {session.code}
                  </p>
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <MetricTile
                      label="Alunos"
                      value={session.results?.participantCount || 0}
                    />
                    <MetricTile label="Slides" value={session.slides.length} />
                    <MetricTile label="Perguntas" value={session.questions.length} />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Link da turma
                    </p>
                    <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                      <input
                        readOnly
                        value={joinUrl}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <button
                        type="button"
                        onClick={() => void copyJoinUrl()}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                      >
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => void applySessionUpdate({ status: "live" })}
                      disabled={updatingSession || session.status === "live"}
                      className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Iniciar
                    </button>
                    <button
                      type="button"
                      onClick={() => void applySessionUpdate({ status: "paused" })}
                      disabled={updatingSession || session.status !== "live"}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Pausar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void applySessionUpdate({
                          status: "ended",
                          activeQuestionId: null,
                        })
                      }
                      disabled={updatingSession || session.status === "ended"}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Encerrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                <p className="text-sm font-bold leading-6 text-slate-700">
                  A sala transforma este plano em apresentação com celular dos alunos:
                  código, QR, perguntas abertas pelo professor e resultados ao vivo.
                </p>
                <button
                  type="button"
                  onClick={() => void startSession()}
                  disabled={creatingSession}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                  {creatingSession ? "Criando sala..." : "Criar sala ao vivo"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Inclusão
                </span>
                <select
                  value={need}
                  onChange={(event) => setNeed(event.target.value as InclusaoNeedId)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                >
                  {INCLUSAO_NEEDS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} - {item.description}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void adaptLesson()}
                disabled={adapting}
                className="pl-hud-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlanifyIcon name="spark" className="h-4 w-4" />
                {adapting ? "Adaptando..." : "Adaptar aula"}
              </button>
            </div>

            {adaptedHtml ? (
              <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-cyan-100 bg-white p-4 text-sm leading-6 text-slate-700">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: adaptedHtml }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Perguntas interativas
                </p>
                <h3 className="mt-1 text-base font-black text-slate-950">
                  Controle de participação
                </h3>
              </div>
              {activeQuestion ? (
                <button
                  type="button"
                  onClick={() => void applySessionUpdate({ activeQuestionId: null })}
                  disabled={updatingSession}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Fechar
                </button>
              ) : null}
            </div>

            {session ? (
              <div className="mt-4 space-y-2">
                {session.questions.map((question) => {
                  const bucket = resultForQuestion(session.results, question.id);
                  const isActive = question.id === session.activeQuestionId;

                  return (
                    <article
                      key={question.id}
                      className={`rounded-xl border p-3 transition ${
                        isActive
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wide text-cyan-700">
                            {questionTypeLabel(question)}
                          </p>
                          <p className="mt-1 text-sm font-black leading-5 text-slate-950">
                            {question.prompt}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700">
                          {bucket.total}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void applySessionUpdate({
                              activeQuestionId: isActive ? null : question.id,
                              activeSlideIndex: question.slideIndex,
                              status: "live",
                            })
                          }
                          disabled={updatingSession || session.status === "ended"}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "bg-slate-950 text-white hover:bg-slate-800"
                              : "bg-white text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {isActive ? "Fechar pergunta" : "Abrir no celular"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void applySessionUpdate({
                              activeSlideIndex: question.slideIndex,
                            })
                          }
                          disabled={updatingSession}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          Ir para slide
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-500">
                Crie a sala para liberar as perguntas no celular dos alunos.
              </p>
            )}
          </div>

          {activeQuestion ? (
            <QuestionResults question={activeQuestion} results={session?.results} />
          ) : null}
        </div>
      </div>

      {localError ? (
        <div className="mx-4 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 sm:mx-5">
          {localError}
        </div>
      ) : null}

      {modeOpen && session ? (
        <TeacherLessonModeOverlay
          session={session}
          updating={updatingSession}
          onClose={() => setModeOpen(false)}
          onUpdate={applySessionUpdate}
        />
      ) : null}
    </section>
  );
}
