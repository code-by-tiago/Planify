"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { teachyQuickActions } from "@/lib/pro/teachyStudio";

type TeachyToolToolbarProps = {
  onApplyHint: (snippet: string) => void;
};

export function TeachyToolToolbar({ onApplyHint }: TeachyToolToolbarProps) {
  return (
    <div className="shrink-0 border-b border-slate-100 bg-slate-50/90 px-4 py-2.5 sm:px-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        Personalizar com IA
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 overscroll-contain">
        {teachyQuickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            title={action.hint}
            onClick={() => onApplyHint(action.objetivoSnippet)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md"
          >
            <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-indigo-500" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
