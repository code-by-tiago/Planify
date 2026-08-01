"use client";

type CopilotoWaveformProps = {
  active: boolean;
  levels?: number[];
};

/** Barras animadas durante a gravação. */
export function CopilotoWaveform({ active, levels }: CopilotoWaveformProps) {
  const bars = levels?.length
    ? levels
    : Array.from({ length: 16 }, (_, i) =>
        active ? 0.3 + ((i * 7) % 10) / 12 : 0.18,
      );

  return (
    <div className="flex h-10 items-end justify-center gap-1" aria-hidden>
      {bars.map((level, index) => (
        <span
          key={index}
          className={`w-1.5 origin-bottom rounded-full bg-cyan-500 ${
            active ? "animate-pulse opacity-100" : "opacity-30"
          }`}
          style={{
            height: `${Math.max(10, Math.min(40, level * 40))}px`,
            animationDelay: active ? `${index * 45}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

type CopilotoProgressProps = {
  stages: readonly string[];
  active: boolean;
  label?: string;
};

export function CopilotoProgress({
  stages,
  active,
  label,
}: CopilotoProgressProps) {
  if (!active || stages.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 px-3 py-3">
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-cyan-100">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-500" />
      </div>
      <p className="text-xs font-bold text-cyan-800">
        {label || stages[0]}
      </p>
      <ul className="mt-2 space-y-1">
        {stages.map((stage) => (
          <li
            key={stage}
            className={`text-[11px] font-medium ${
              stage === label ? "text-cyan-900" : "text-cyan-700/70"
            }`}
          >
            {stage === label ? "→ " : "· "}
            {stage}
          </li>
        ))}
      </ul>
    </div>
  );
}
