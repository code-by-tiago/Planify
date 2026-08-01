"use client";

import {
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type MaterialPreviewChromeProps = {
  label: string;
  children: ReactNode;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect?: (index: number) => void;
  items?: { id: string; title: string }[];
};

const SWIPE_THRESHOLD_PX = 48;

export function MaterialPreviewChrome({
  label,
  children,
  index,
  total,
  onPrev,
  onNext,
  onSelect,
  items,
}: MaterialPreviewChromeProps) {
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null || pointerStartY.current === null) return;
    const deltaX = event.clientX - pointerStartX.current;
    const deltaY = event.clientY - pointerStartY.current;
    pointerStartX.current = null;
    pointerStartY.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0 && canNext) onNext();
    else if (deltaX > 0 && canPrev) onPrev();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 sm:text-[11px] sm:tracking-[0.2em]">
          {label}
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Anterior"
          >
            <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
          </button>
          <span className="min-w-[3.25rem] text-center text-xs font-bold text-slate-600 sm:min-w-[4.5rem]">
            {index + 1}/{total}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Próximo"
          >
            <PlanifyIcon name="arrowRight" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {items && items.length > 1 ? (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(itemIndex)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-bold transition active:scale-[0.98] ${
                itemIndex === index
                  ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300"
              }`}
            >
              <span className="line-clamp-1 max-w-[7.5rem] sm:max-w-[9rem]">{item.title}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="touch-pan-y"
        style={{ touchAction: "pan-y" }}
      >
        {children}
      </div>

      {total > 1 ? (
        <p className="text-center text-[11px] font-medium text-slate-400 lg:hidden">
          Deslize para o lado para navegar
        </p>
      ) : null}
    </div>
  );
}
