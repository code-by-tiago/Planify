"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type ReferralSummary = {
  code: string;
  signupUrl: string;
  referralCount: number;
};

export function ReferralInvitePanel({ className = "" }: { className?: string }) {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/referral/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Não foi possível carregar seu link.");
      }

      setSummary(data.referral as ReferralSummary);
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar indicações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function copyLink() {
    if (!summary?.signupUrl) return;

    try {
      await navigator.clipboard.writeText(summary.signupUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o link manualmente.");
    }
  }

  return (
    <section
      className={`rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-5 ${className}`}
      aria-labelledby="referral-invite-heading"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <PlanifyIcon name="user" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="referral-invite-heading" className="text-base font-black text-slate-950">
            Indique um colega professor
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            Convide outro professor para o Planify. O link leva ao cadastro com seu código —
            crédito de indicação será aplicado em breve.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">Carregando link…</p>
      ) : error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : summary ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Seu link de indicação
            </span>
            <input
              id="referral-signup-url"
              readOnly
              value={summary.signupUrl}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
              aria-describedby="referral-code-hint"
            />
          </label>
          <p id="referral-code-hint" className="text-xs font-semibold text-slate-500">
            Código: <strong className="text-slate-800">{summary.code}</strong>
            {summary.referralCount > 0
              ? ` · ${summary.referralCount} colega(s) indicado(s)`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              {copied ? "Link copiado!" : "Copiar link"}
            </button>
            <Link
              href="/planos"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300"
            >
              Ver planos
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
