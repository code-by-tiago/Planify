"use client";

import { useEffect, useMemo, useState } from "react";
import { LumiMascot } from "@/components/pro/LumiMascot";
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
      <div className="pl-owl-coach__card rounded-[2rem] border border-indigo-100/90 bg-white p-6 shadow-xl shadow-indigo-100/40 sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="pl-owl-coach__mascot shrink-0">
            <LumiMascot size={88} animated withAura />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
              Coruja Planify · quase pronto
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
              {title}
            </h3>
            {description ? (
              <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            ) : null}

            <div className="pl-owl-coach__bubble relative mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3.5 text-left">
              <p
                key={messageIndex}
                className="pl-fade-rise text-sm font-bold leading-6 text-indigo-900"
              >
                {currentMessage}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="pl-owl-coach__bar h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        </div>

        {progressSteps && progressSteps.length > 0 ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {progressSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700"
                  aria-hidden
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default PlanifyOwlGenerationCoach;
