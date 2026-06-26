"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PlanningTrialPaywallModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PlanningTrialPaywallModal({
  open,
  onClose,
}: PlanningTrialPaywallModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planning-trial-paywall-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-cyan-100 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
            Planejamento pronto
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <PlanifyIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="planning-trial-paywall-title"
          className="mt-5 font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight text-slate-900"
        >
          Seu planejamento está pronto!
        </h2>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
          Para baixar em DOCX, editar, salvar no histórico e exportar para Google
          Docs, assine o Planify Pro.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            href="/api/stripe/checkout?plan=professor-monthly"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:brightness-105"
          >
            Assinar Planify Pro — R$ 24,90/mês
          </Link>
          <Link
            href="/planos"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3.5 text-center text-sm font-bold text-cyan-900 transition hover:bg-cyan-100"
          >
            Ver todos os planos
          </Link>
        </div>
      </div>
    </div>
  );
}
