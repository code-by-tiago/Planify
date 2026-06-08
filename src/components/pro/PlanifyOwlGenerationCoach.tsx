"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import {
  computeGenerationProgressPercent,
  formatRemainingTime,
  getGenerationDurationEstimateMs,
} from "@/lib/pro/generation-progress";
import {
  getMotivationalMessages,
  pickInitialMessageIndex,
  type LumiCoachContext,
} from "@/lib/pro/lumiMotivationalMessages";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

type PlanifyOwlGenerationCoachProps = {
  active: boolean;
  title: string;
  description?: string;
  context?: LumiCoachContext;
  toolId?: PlanifyToolId | string;
  /** Etapas opcionais (ex.: planejamentos) */
  progressSteps?: string[];
  /** Duração estimada em ms (sobrescreve contexto/ferramenta) */
  estimatedDurationMs?: number;
  className?: string;
};

const MESSAGE_INTERVAL_MS = 3800;
const PROGRESS_TICK_MS = 400;

export function PlanifyOwlGenerationCoach({
  active,
  title,
  description,
  context = "material",
  toolId,
  progressSteps,
  estimatedDurationMs,
  className = "",
}: PlanifyOwlGenerationCoachProps) {
  const messages = useMemo(
    () => getMotivationalMessages(context, toolId),
    [context, toolId],
  );

  const durationMs = useMemo(
    () =>
      getGenerationDurationEstimateMs({
        context,
        toolId,
        overrideMs: estimatedDurationMs,
      }),
    [context, toolId, estimatedDurationMs],
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setEntered(false);
      setElapsedMs(0);
      setMessageIndex(pickInitialMessageIndex(messages.length, Date.now()));
      return;
    }

    const startedAt = Date.now();
    setMessageIndex(pickInitialMessageIndex(messages.length, Date.now()));
    const enterTimer = window.setTimeout(() => setEntered(true), 40);

    const rotateTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, MESSAGE_INTERVAL_MS);

    const progressTimer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearInterval(rotateTimer);
      window.clearInterval(progressTimer);
    };
  }, [active, messages.length, durationMs]);

  if (!active) {
    return null;
  }

  const currentMessage = messages[messageIndex] ?? messages[0] ?? "";
  const progressPercent = computeGenerationProgressPercent(elapsedMs, durationMs);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const remainingLabel = formatRemainingTime(remainingMs);

  return (
    <div
      className={[
        "pl-owl-coach w-full",
        entered ? "pl-owl-coach--visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pl-hud-glass pl-owl-coach__card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="pl-owl-coach__mascot">
              <PlanifyOwlMark size={96} glow />
            </div>
            <div className="w-[7.5rem] sm:w-[6.5rem]" aria-hidden="true">
              <div className="h-2 overflow-hidden rounded-full bg-cyan-100/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-center text-[10px] font-bold tabular-nums text-cyan-700">
                {progressPercent}%
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-600">
              Coruja Planify · quase pronto
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-950 sm:text-2xl">
              {title}
            </h3>
            {description ? (
              <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            ) : null}

            <div className="relative mt-4 rounded-xl border border-cyan-400/20 bg-cyan-50/50 px-4 py-3.5 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                {remainingLabel}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {currentMessage}
              </p>
            </div>

            {progressSteps && progressSteps.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-left">
                {progressSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
