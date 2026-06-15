"use client";

import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type Wallet = {
  balance: number;
  monthlyLimit: number;
  planKey: string | null;
  cycleEndsAt: string | null;
};

/**
 * Indicador compacto do saldo de créditos do ciclo.
 * Oculto para assinantes com uso ilimitado (política de lançamento).
 */
export function CreditsBalancePill() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [usageUnlimited, setUsageUnlimited] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/credits/balance", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      setUsageUnlimited(
        Boolean(data?.usageUnlimited ?? data?.unlimitedQuota),
      );
      setWallet(data?.wallet ?? null);
    } catch {
      setWallet(null);
      setUsageUnlimited(false);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener("planify:credits-changed", handler);
    return () => window.removeEventListener("planify:credits-changed", handler);
  }, []);

  if (!loaded || usageUnlimited || !wallet) return null;

  const limit = wallet.monthlyLimit || 0;
  const ratio = limit > 0 ? wallet.balance / limit : 1;
  const low = wallet.balance <= Math.max(5, Math.round(limit * 0.1));

  const tone = low
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${tone}`}
      title={`Créditos do ciclo${limit ? ` (${wallet.balance}/${limit})` : ""}`}
    >
      <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
      <span>
        {wallet.balance}
        {limit ? ` / ${limit}` : ""} créditos
      </span>
      {low ? (
        <a href="/planos" className="underline">
          Upgrade
        </a>
      ) : null}
      <span className="sr-only">{Math.round(ratio * 100)}%</span>
    </div>
  );
}

export default CreditsBalancePill;
