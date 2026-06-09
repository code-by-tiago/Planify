"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const STEPS = ["Informações", "BNCC", "Conteúdo", "Revisão"] as const;
const BNCC_CHIPS = ["EF08LP01", "EF08LP02", "EF08LP03", "EF08LP04"] as const;

const DISCIPLINA = "Língua Portuguesa";
const ANO = "8º Ano";
const CONTEUDO = "Interpretação de texto";

type Phase = "form" | "bncc" | "generating" | "success";

const PHASE_ANNOUNCEMENTS: Record<Phase, string> = {
  form: "Preenchendo disciplina, ano e conteúdo do planejamento",
  bncc: "IA sugere habilidades da BNCC",
  generating: "Gerando planejamento",
  success: "Documento pronto. Você pode exportar ao Google Docs ou abrir no editor.",
};

const PHASE_STEP_INDEX: Record<Phase, number> = {
  form: 0,
  bncc: 1,
  generating: 2,
  success: 3,
};

const TIMING = {
  charMs: 45,
  formPauseMs: 600,
  chipMs: 380,
  chipPauseMs: 400,
  progressTickMs: 35,
  successMs: 3200,
  resetMs: 500,
} as const;

const REDUCED_PHASE_MS = 2200;

function sliceText(text: string, length: number) {
  return text.slice(0, Math.min(length, text.length));
}

export function LandingHeroLiveDashboard() {
  const reduceMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("form");
  const [disciplinaText, setDisciplinaText] = useState("");
  const [anoText, setAnoText] = useState("");
  const [conteudoText, setConteudoText] = useState("");
  const [visibleChips, setVisibleChips] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [announcement, setAnnouncement] = useState(PHASE_ANNOUNCEMENTS.form);
  const loopRef = useRef(0);

  const resetCycle = useCallback(() => {
    setPhase("form");
    setDisciplinaText("");
    setAnoText("");
    setConteudoText("");
    setVisibleChips(0);
    setProgress(0);
    setShowActions(false);
    setAnnouncement(PHASE_ANNOUNCEMENTS.form);
  }, []);

  useEffect(() => {
    loopRef.current += 1;
    const loopId = loopRef.current;
    let cancelled = false;

    const isActive = () => !cancelled && loopRef.current === loopId;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), ms);
      });

    const announce = (next: Phase) => {
      if (!isActive()) return;
      setAnnouncement(PHASE_ANNOUNCEMENTS[next]);
    };

    const runReduced = async () => {
      const phases: Phase[] = ["form", "bncc", "generating", "success"];
      for (const next of phases) {
        if (!isActive()) return;
        setPhase(next);
        announce(next);

        if (next === "form") {
          setDisciplinaText(DISCIPLINA);
          setAnoText(ANO);
          setConteudoText(CONTEUDO);
        } else if (next === "bncc") {
          setVisibleChips(BNCC_CHIPS.length);
        } else if (next === "generating") {
          setProgress(100);
        } else {
          setShowActions(true);
        }

        await wait(REDUCED_PHASE_MS);
      }

      if (!isActive()) return;
      resetCycle();
      await wait(TIMING.resetMs);
      if (isActive()) runReduced();
    };

    const typeField = async (text: string, setter: (v: string) => void) => {
      for (let i = 1; i <= text.length; i += 1) {
        if (!isActive()) return;
        setter(sliceText(text, i));
        await wait(TIMING.charMs);
      }
      await wait(TIMING.formPauseMs);
    };

    const runAnimated = async () => {
      resetCycle();
      await wait(300);

      while (isActive()) {
        setPhase("form");
        announce("form");
        setDisciplinaText("");
        setAnoText("");
        setConteudoText("");
        setVisibleChips(0);
        setProgress(0);
        setShowActions(false);

        await typeField(DISCIPLINA, setDisciplinaText);
        if (!isActive()) return;
        await typeField(ANO, setAnoText);
        if (!isActive()) return;
        await typeField(CONTEUDO, setConteudoText);
        if (!isActive()) return;

        setPhase("bncc");
        announce("bncc");
        for (let i = 1; i <= BNCC_CHIPS.length; i += 1) {
          if (!isActive()) return;
          setVisibleChips(i);
          await wait(TIMING.chipMs);
        }
        await wait(TIMING.chipPauseMs);
        if (!isActive()) return;

        setPhase("generating");
        announce("generating");
        setProgress(0);
        for (let p = 0; p <= 100; p += 2) {
          if (!isActive()) return;
          setProgress(p);
          await wait(TIMING.progressTickMs);
        }
        if (!isActive()) return;

        setPhase("success");
        announce("success");
        setShowActions(true);
        await wait(TIMING.successMs);
        if (!isActive()) return;

        resetCycle();
        await wait(TIMING.resetMs);
      }
    };

    if (reduceMotion) {
      void runReduced();
    } else {
      void runAnimated();
    }

    return () => {
      cancelled = true;
    };
  }, [reduceMotion, resetCycle]);

  const activeStep = PHASE_STEP_INDEX[phase];

  const handleDecorativeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
      aria-label="Demonstração animada do fluxo de planejamento no Planify"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-6 hidden h-28 w-28 rounded-full bg-slate-900/5 blur-3xl sm:block"
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">
              Planejamento Anual
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {disciplinaText || anoText ? (
                <>
                  {disciplinaText || "…"}
                  {anoText ? ` · ${anoText}` : disciplinaText ? " · …" : ""}
                </>
              ) : (
                <span className="text-slate-400">Novo planejamento</span>
              )}
            </p>
          </div>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">
            IA ativa
          </span>
        </div>

        <div className="mt-5 flex gap-1" aria-hidden>
          {STEPS.map((step, index) => {
            const active = index <= activeStep;
            const current = index === activeStep;
            return (
              <div key={step} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors duration-300 ${
                    active ? "bg-cyan-500" : "bg-slate-200"
                  } ${current && phase === "generating" ? "animate-pulse" : ""}`}
                />
                <p
                  className={`mt-2 text-[10px] font-semibold transition-colors duration-300 ${
                    active ? "text-cyan-700" : "text-slate-400"
                  }`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Disciplina
            </span>
            <div
              className={`mt-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                disciplinaText
                  ? "border-cyan-200 bg-cyan-50/40 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {disciplinaText || "Selecione a disciplina"}
              {phase === "form" && !disciplinaText && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan-500 align-middle" />
              )}
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Ano / Série
            </span>
            <div
              className={`mt-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                anoText
                  ? "border-cyan-200 bg-cyan-50/40 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {anoText || "Selecione o ano"}
              {phase === "form" && disciplinaText && !anoText && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan-500 align-middle" />
              )}
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Conteúdo
            </span>
            <div
              className={`mt-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                conteudoText
                  ? "border-cyan-200 bg-cyan-50/40 text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {conteudoText || "Descreva o conteúdo da aula"}
              {phase === "form" && anoText && !conteudoText && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-cyan-500 align-middle" />
              )}
            </div>
          </label>
        </div>

        <AnimatePresence>
          {(phase === "bncc" || phase === "generating" || phase === "success") && (
            <motion.div
              key="bncc-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Habilidades BNCC
                {phase === "bncc" && visibleChips < BNCC_CHIPS.length && (
                  <span className="ml-2 font-semibold normal-case text-cyan-600">
                    IA sugerindo…
                  </span>
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {BNCC_CHIPS.map((chip, index) => {
                  const visible = index < visibleChips;
                  return (
                    <motion.span
                      key={chip}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      animate={
                        visible
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0, scale: 0.9 }
                      }
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 ${
                        visible
                          ? "bg-white text-slate-700 ring-cyan-200"
                          : "pointer-events-none bg-transparent text-transparent ring-transparent"
                      }`}
                      aria-hidden={!visible}
                    >
                      {chip}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(phase === "generating" || phase === "success") && (
            <motion.div
              key="progress-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              {phase === "generating" && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-cyan-800">Gerando planejamento…</p>
                    <span className="text-[10px] font-bold tabular-nums text-cyan-600">
                      {progress}%
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progresso da geração do planejamento"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width] duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {phase === "success" && (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
                  <PlanifyIcon name="checkCircle" className="h-4 w-4 shrink-0 text-cyan-600" />
                  <p className="text-xs font-bold text-cyan-800">Pronto no Google Docs!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showActions && (
            <motion.div
              key="actions"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.15 }}
              className="mt-5 flex flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={handleDecorativeClick}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50/50"
                tabIndex={-1}
                aria-hidden
              >
                <PlanifyIcon name="download" className="h-3.5 w-3.5 text-cyan-600" />
                Google Docs
              </button>
              <button
                type="button"
                onClick={handleDecorativeClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20"
                tabIndex={-1}
                aria-hidden
              >
                <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
                Abrir no Editor
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
