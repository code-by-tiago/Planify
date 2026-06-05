"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { teachyQuickActions } from "@/lib/pro/teachyStudio";
import { useEffect, useState } from "react";

const OBJETIVO_UPDATED_EVENT = "planify-objetivo-updated";

type TeachyToolToolbarProps = {
  onApplyHint: (snippet: string, actionId: string) => void;
  collapsed?: boolean;
};

export function TeachyToolToolbar({
  onApplyHint,
  collapsed = false,
}: TeachyToolToolbarProps) {
  const [objetivoText, setObjetivoText] = useState("");

  useEffect(() => {
    function onObjetivoUpdated(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setObjetivoText(detail);
      }
    }

    window.addEventListener(OBJETIVO_UPDATED_EVENT, onObjetivoUpdated);
    return () =>
      window.removeEventListener(OBJETIVO_UPDATED_EVENT, onObjetivoUpdated);
  }, []);

  return (
    <div
      className={`sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm transition-[padding] duration-200 ${
        collapsed ? "px-4 py-1.5 sm:px-5" : "px-4 py-2.5 sm:px-5"
      }`}
    >
      <p
        className={`overflow-hidden font-black uppercase tracking-[0.18em] text-slate-400 transition-[max-height,opacity,margin] duration-200 ${
          collapsed ? "max-h-0 opacity-0" : "max-h-6 text-[10px] opacity-100"
        }`}
      >
        Personalizar com IA
      </p>
      <div
        className={`flex gap-2 overflow-x-auto overscroll-contain pb-0.5 transition-[margin] duration-200 ${
          collapsed ? "mt-0" : "mt-2"
        }`}
      >
        {teachyQuickActions.map((action) => {
          const active = objetivoText.includes(action.objetivoSnippet);
          return (
            <button
              key={action.id}
              type="button"
              title={action.hint}
              aria-pressed={active}
              onClick={() => onApplyHint(action.objetivoSnippet, action.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm transition ${
                active
                  ? "border-blue-300 bg-blue-600 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
              }`}
            >
              <PlanifyIcon
                name="spark"
                className={`h-3.5 w-3.5 ${active ? "text-white" : "text-blue-500"}`}
              />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
