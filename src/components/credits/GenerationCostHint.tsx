type GenerationCostHintProps = {
  creditCost: number;
  deepSlotConsumed?: boolean;
  label?: string;
  className?: string;
};

export function GenerationCostHint({
  creditCost,
  deepSlotConsumed = false,
  label,
  className = "",
}: GenerationCostHintProps) {
  return (
    <p
      className={`text-xs font-semibold text-slate-600 ${className}`}
      aria-live="polite"
    >
      {label ?? "Custo desta geração:"}{" "}
      <span className="font-extrabold text-cyan-700">
        {creditCost} crédito{creditCost === 1 ? "" : "s"}
      </span>
      {deepSlotConsumed ? (
        <span className="text-slate-500">
          {" "}
          · consome 1 geração profunda do dia
        </span>
      ) : null}
    </p>
  );
}
