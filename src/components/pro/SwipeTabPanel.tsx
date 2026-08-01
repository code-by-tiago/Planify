"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  HUD_FILTER_CHIP_ACTIVE,
  HUD_FILTER_CHIP_INACTIVE,
} from "@/lib/pro/hud-form-styles";

export type SwipeTab = {
  id: string;
  label: string;
  content: ReactNode;
  actions?: ReactNode;
};

type SwipeTabPanelProps = {
  tabs: SwipeTab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

const SWIPE_THRESHOLD_PX = 50;

export function SwipeTabPanel({
  tabs,
  activeId,
  onChange,
  className = "",
}: SwipeTabPanelProps) {
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeTab = tabs[safeIndex] ?? tabs[0];

  const goToIndex = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) onChange(tab.id);
    },
    [onChange, tabs],
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" && safeIndex > 0) {
      event.preventDefault();
      goToIndex(safeIndex - 1);
    }
    if (event.key === "ArrowRight" && safeIndex < tabs.length - 1) {
      event.preventDefault();
      goToIndex(safeIndex + 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === "mouse") return;
    pointerStartX.current = event.clientX;
    pointerStartY.current = event.clientY;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (
      reducedMotion ||
      pointerStartX.current === null ||
      pointerStartY.current === null
    ) {
      pointerStartX.current = null;
      pointerStartY.current = null;
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    const deltaY = event.clientY - pointerStartY.current;

    pointerStartX.current = null;
    pointerStartY.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0 && safeIndex < tabs.length - 1) {
      goToIndex(safeIndex + 1);
    } else if (deltaX > 0 && safeIndex > 0) {
      goToIndex(safeIndex - 1);
    }
  }

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeId) && tabs[0]) {
      onChange(tabs[0].id);
    }
  }, [activeId, onChange, tabs]);

  if (!tabs.length || !activeTab) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className="hidden flex-wrap gap-2 lg:flex"
        role="tablist"
        aria-label="Materiais do pacote"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            aria-controls={`swipe-panel-${tab.id}`}
            id={`swipe-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={
              tab.id === activeId
                ? `${HUD_FILTER_CHIP_ACTIVE} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2`
                : `${HUD_FILTER_CHIP_INACTIVE} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2`
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Materiais do pacote"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              aria-controls={`swipe-panel-${tab.id}`}
              id={`swipe-tab-mobile-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={
                tab.id === activeId
                  ? `${HUD_FILTER_CHIP_ACTIVE} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2`
                  : `${HUD_FILTER_CHIP_INACTIVE} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2`
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="mt-3 flex justify-center gap-1.5"
          aria-hidden="true"
        >
          {tabs.map((tab, index) => (
            <span
              key={tab.id}
              className={`h-1.5 rounded-full transition-all ${
                index === safeIndex ? "w-4 bg-cyan-600" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        id={`swipe-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`swipe-tab-${activeTab.id}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="touch-pan-y outline-none max-lg:snap-y max-lg:snap-mandatory focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        style={{ touchAction: "pan-y" }}
      >
        {activeTab.actions ? (
          <div className="mb-3 flex flex-wrap gap-2">{activeTab.actions}</div>
        ) : null}
        {activeTab.content}
      </div>
    </div>
  );
}
