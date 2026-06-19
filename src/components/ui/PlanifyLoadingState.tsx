type PlanifyLoadingStateProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function PlanifyLoadingState({
  label = "Carregando…",
  className = "",
  size = "md",
}: PlanifyLoadingStateProps) {
  return (
    <div
      className={[
        "pf-loading-state flex flex-col items-center justify-center gap-3 py-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <span
        className={[
          "inline-block animate-spin rounded-full border-2 border-[var(--pl-border-teal)] border-t-[var(--pl-teal)]",
          sizeMap[size],
        ].join(" ")}
      />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
