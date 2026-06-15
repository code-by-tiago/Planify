"use client";

import { useEffect, useState } from "react";

type GenerationCostHintProps = {
  creditCost: number;
  deepSlotConsumed?: boolean;
  label?: string;
  className?: string;
};

/** Oculto para assinantes com uso ilimitado. */
export function GenerationCostHint({
  creditCost,
  deepSlotConsumed = false,
  label,
  className = "",
}: GenerationCostHintProps) {
  const [usageUnlimited, setUsageUnlimited] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/credits/balance", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setUsageUnlimited(
            Boolean(data?.usageUnlimited ?? data?.unlimitedQuota),
          );
        }
      } catch {
        if (!cancelled) setUsageUnlimited(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (usageUnlimited === null || usageUnlimited) return null;

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
