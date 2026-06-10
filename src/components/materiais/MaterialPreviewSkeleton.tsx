type MaterialPreviewSkeletonProps = {
  className?: string;
};

export function MaterialPreviewSkeleton({
  className = "",
}: MaterialPreviewSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-cyan-400/15 bg-white/80 p-6 ${className}`}
      aria-hidden="true"
    >
      <div className="h-4 w-1/3 rounded-lg bg-slate-200" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-[92%] rounded bg-slate-100" />
        <div className="h-3 w-[78%] rounded bg-slate-100" />
        <div className="h-3 w-[88%] rounded bg-slate-100" />
      </div>
      <div className="mt-6 h-28 rounded-xl bg-slate-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
  );
}
