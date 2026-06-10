"use client";

import type { ReactNode } from "react";

export type PlanifyMaterialHubCardProps = {
  badge: string;
  title: string;
  description?: string;
  /** Ex.: Matemática · Ensino Fundamental · 5º ano */
  metaPrimary?: string;
  metaSecondary?: string;
  metaTertiary?: string;
  selected?: boolean;
  onSelect?: () => void;
  selectAriaLabel?: string;
  headerSlot?: ReactNode;
  footer: ReactNode;
  className?: string;
  selectionMode?: boolean;
  checked?: boolean;
  onToggleCheck?: () => void;
};

/**
 * Card padrão Planify — mesmo modelo da Biblioteca Premium (pl-hud-hub-app).
 */
export function PlanifyMaterialHubCard({
  badge,
  title,
  description,
  metaPrimary,
  metaSecondary,
  metaTertiary,
  selected = false,
  onSelect,
  selectAriaLabel,
  headerSlot,
  footer,
  className = "",
  selectionMode = false,
  checked = false,
  onToggleCheck,
}: PlanifyMaterialHubCardProps) {
  const body = (
    <>
      {headerSlot ? <div className="mb-2">{headerSlot}</div> : null}
      <span className="inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
        {badge}
      </span>
      <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-950">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
          {description}
        </p>
      ) : null}
      <div className="mt-auto space-y-1 pt-3 text-[11px] font-medium text-slate-500">
        {metaPrimary ? <p>{metaPrimary}</p> : null}
        {metaSecondary ? <p>{metaSecondary}</p> : null}
        {metaTertiary ? <p>{metaTertiary}</p> : null}
      </div>
    </>
  );

  return (
    <article
      className={`pl-hud-hub-app relative flex min-h-[17rem] flex-col rounded-2xl p-4 transition ${
        selectionMode && checked
          ? "border-rose-300/60 ring-1 ring-rose-200"
          : selected
            ? "border-cyan-400/50 shadow-sm"
            : ""
      } ${className}`}
    >
      {selectionMode ? (
        <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 shadow-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleCheck}
            className="h-4 w-4 accent-rose-600"
            aria-label={selectAriaLabel || `Selecionar ${title}`}
          />
          <span className="text-[10px] font-bold text-slate-600">
            {checked ? "Marcado" : "Marcar"}
          </span>
        </label>
      ) : null}

      {onSelect ? (
        <button
          type="button"
          onClick={() => {
            if (selectionMode) {
              onToggleCheck?.();
              return;
            }
            onSelect();
          }}
          className="flex flex-1 flex-col text-left"
          aria-label={selectAriaLabel}
        >
          {body}
        </button>
      ) : (
        <div className="flex flex-1 flex-col">{body}</div>
      )}

      <div className="mt-3 border-t border-cyan-400/10 pt-3">{footer}</div>
    </article>
  );
}
