"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { teachyQuickActions } from "@/lib/pro/teachyStudio";

type TeachyToolToolbarProps = {
  onApplyHint: (snippet: string) => void;
  collapsed?: boolean;
};

export function TeachyToolToolbar({
  onApplyHint,
  collapsed = false,
}: TeachyToolToolbarProps) {
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
        {teachyQuickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.hint}
            onClick={() => onApplyHint(action.objetivoSnippet)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
          >
            <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-blue-500" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
