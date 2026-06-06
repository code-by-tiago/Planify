"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isDeepGenerationType } from "@/lib/ai/material-generation-policy";

type DailyStatus = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
};

type DailyGenerationsBarProps = {
  /** Tipo de material selecionado no formulário — define se a cota se aplica. */
  tipoMaterial?: string;
  compact?: boolean;
};

export function DailyGenerationsBar({
  tipoMaterial = "",
  compact = false,
}: DailyGenerationsBarProps) {
  const [daily, setDaily] = useState<DailyStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const applies = isDeepGenerationType(tipoMaterial);

  const load = useCallback(async () => {
    try {
      const params = tipoMaterial
        ? `?tipo=${encodeURIComponent(tipoMaterial)}`
        : "";
      const res = await fetch(`/api/credits/balance${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      setDaily(data?.daily ?? null);
    } catch {
      setDaily(null);
    } finally {
      setLoaded(true);
    }
  }, [tipoMaterial]);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener("planify:credits-changed", handler);
    return () => window.removeEventListener("planify:credits-changed", handler);
  }, [load]);

  if (!loaded || !daily || daily.limit <= 0) return null;

  const ratio = daily.limit > 0 ? daily.used / daily.limit : 0;
  const exhausted = daily.remaining <= 0;
  const warning = !exhausted && daily.remaining === 1;

  const barColor = exhausted
    ? "bg-rose-500"
    : warning
      ? "bg-amber-500"
      : "bg-emerald-500";

  const trackClass = compact
    ? "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
    : "rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3";

  return (
    <div className={trackClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black text-slate-800">
          Gerações profundas hoje:{" "}
          <span className={exhausted ? "text-rose-700" : "text-indigo-700"}>
            {daily.used} de {daily.limit}
          </span>
        </p>
        {!compact && daily.limit < 5 ? (
          <Link
            href="/planos"
            className="text-[11px] font-black text-indigo-700 underline"
          >
            Premium: até 5/dia
          </Link>
        ) : null}
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-white/80"
        role="progressbar"
        aria-valuenow={daily.used}
        aria-valuemin={0}
        aria-valuemax={daily.limit}
        aria-label={`Gerações profundas: ${daily.used} de ${daily.limit}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>

      {!compact ? (
        <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">
          Usamos IA avançada para materiais profundos, planejamentos anuais e
          trimestrais — cada geração exige processamento intenso. Por isso
          priorizamos <strong>qualidade, não quantidade</strong>.
          {applies ? (
            <>
              {" "}
              Este tipo conta na cota diária. Flashcards e resumos não contam.
            </>
          ) : (
            <>
              {" "}
              Provas, apostilas, listas e planejamentos contam na cota; flashcards,
              resumos e jogos não.
            </>
          )}
        </p>
      ) : null}

      {exhausted ? (
        <p className="mt-2 text-[11px] font-bold text-rose-700">
          Cota esgotada — reinicia à meia-noite (Brasília).{" "}
          <Link href="/planos" className="underline">
            Ver planos
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export default DailyGenerationsBar;
