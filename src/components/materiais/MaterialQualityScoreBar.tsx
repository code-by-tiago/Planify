"use client";

import {
  describeQualityScore,
  type QualityScoreTone,
} from "@/lib/materiais/material-quality-score";

type MaterialQualityScoreBarProps = {
  score: number;
  issues?: string[];
  onElevate?: () => void;
  elevating?: boolean;
  compact?: boolean;
};

const toneClasses: Record<QualityScoreTone, { bar: string; text: string; track: string }> = {
  emerald: {
    bar: "bg-emerald-500",
    text: "text-emerald-800",
    track: "border-emerald-100 bg-emerald-50/70",
  },
  amber: {
    bar: "bg-amber-500",
    text: "text-amber-900",
    track: "border-amber-100 bg-amber-50/80",
  },
  rose: {
    bar: "bg-rose-500",
    text: "text-rose-800",
    track: "border-rose-100 bg-rose-50/80",
  },
};

export function MaterialQualityScoreBar({
  score,
  issues = [],
  onElevate,
  elevating = false,
  compact = false,
}: MaterialQualityScoreBarProps) {
  const meta = describeQualityScore(score);
  const styles = toneClasses[meta.tone];
  const showElevate = score < 90 && typeof onElevate === "function";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${styles.track} ${
        compact ? "" : "mb-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Qualidade Planify
          </p>
          <p className={`mt-1 text-lg font-black ${styles.text}`}>
            {score}
            <span className="text-sm font-bold text-slate-500"> / 100</span>
            <span className="ml-2 text-sm font-black">· {meta.label}</span>
          </p>
        </div>
        {showElevate ? (
          <button
            type="button"
            onClick={onElevate}
            disabled={elevating}
            className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {elevating ? "Elevando..." : "Elevar qualidade"}
          </button>
        ) : null}
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/80"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Qualidade do material: ${score} de 100`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {!compact ? (
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">
          {meta.hint}
        </p>
      ) : null}

      {!compact && issues.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] font-semibold text-slate-600">
          {issues.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default MaterialQualityScoreBar;
