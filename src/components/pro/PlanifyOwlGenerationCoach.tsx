"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
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
  className?: string;
};

const MESSAGE_INTERVAL_MS = 3800;

export function PlanifyOwlGenerationCoach({
  active,
  title,
  description,
  context = "material",
  toolId,
  progressSteps,
  className = "",
}: PlanifyOwlGenerationCoachProps) {
  const messages = useMemo(
    () => getMotivationalMessages(context, toolId),
    [context, toolId],
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!active) {
      setEntered(false);
      setMessageIndex(pickInitialMessageIndex(messages.length, Date.now()));
      return;
    }

    setMessageIndex(pickInitialMessageIndex(messages.length, Date.now()));
    const enterTimer = window.setTimeout(() => setEntered(true), 40);

    const rotateTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, MESSAGE_INTERVAL_MS);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearInterval(rotateTimer);
    };
  }, [active, messages.length]);

  if (!active) {
    return null;
  }

  const currentMessage = messages[messageIndex] ?? messages[0] ?? "";

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
          <div className="pl-owl-coach__mascot shrink-0">
            <PlanifyOwlMark size={96} glow />
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
              <p className="text-sm font-semibold leading-6 text-slate-700">
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
