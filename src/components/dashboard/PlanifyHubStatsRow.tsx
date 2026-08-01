"use client";

import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { useCallback, useEffect, useState } from "react";

type DailyStatus = {
  used: number;
  limit: number;
  remaining: number;
};

export function PlanifyHubStatsRow() {
  const [daily, setDaily] = useState<DailyStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      setDaily(data?.daily ?? null);
    } catch {
      setDaily(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener("planify:credits-changed", handler);
    return () => window.removeEventListener("planify:credits-changed", handler);
  }, [load]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CreditsBalancePill />
      {daily && daily.limit > 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-50/80 px-3 py-1.5 text-xs font-semibold text-cyan-800">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
          {daily.used}/{daily.limit} gerações hoje
        </span>
      ) : null}
    </div>
  );
}
