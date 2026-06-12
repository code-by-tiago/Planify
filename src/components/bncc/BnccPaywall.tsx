"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const benefits = [
  "Veja quantas habilidades BNCC sua turma já cobriu no ano",
  "Identifique lacunas por disciplina e série",
  "Gere aulas com IA já alinhadas às habilidades pendentes",
  "Acompanhe materiais gerados e datas de cobertura",
];

type BnccPaywallProps = {
  redirectPath?: string;
};

export function BnccPaywall({ redirectPath = "/progresso-bncc" }: BnccPaywallProps) {
  const plansHref = `/planos?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <section className="flex min-h-[420px] flex-1 items-center justify-center p-4 sm:p-8">
      <div className="planify-hud w-full max-w-2xl rounded-2xl border border-cyan-400/20 bg-white/90 p-8 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
          <PlanifyIcon name="listChecks" className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-center text-3xl font-black tracking-tight text-slate-950">
          Progresso BNCC
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm font-semibold leading-6 text-slate-600">
          Acompanhe a cobertura curricular da sua turma com clareza. Este recurso
          faz parte do plano Pro — ideal para professoras que querem alinhar
          materiais e planejamentos à BNCC.
        </p>

        <ul className="mx-auto mt-6 max-w-md space-y-3">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-sm font-semibold text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={plansHref}
            className="pl-hud-btn rounded-full px-6 py-3 text-sm font-black text-slate-900"
          >
            Assinar plano Professor
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </section>
  );
}
