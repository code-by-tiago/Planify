"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { PlanifyBrand } from "@/components/pro/PlanifyBrand";

const PlanejamentosClient = dynamic(
  () =>
    import("@/app/planejamentos/PlanejamentosClient").then(
      (module) => module.PlanejamentosClient,
    ),
  { ssr: false },
);

export function TestarPlanejamentoShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <PlanifyBrand href="/" hideTagline />
          <Link
            href="/planos"
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
          >
            Assinar Planify Pro
          </Link>
        </div>
      </header>

      <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-7xl text-center sm:text-left">
          <p className="text-sm font-bold text-cyan-900">
            Teste gratuito · 1 pacote por dispositivo (anual + trimestres coerentes)
          </p>
          <p className="mt-1 text-xs font-medium text-cyan-800/80">
            Gere o anual e visualize os trimestres extraídos da mesma matriz. Assine
            para baixar DOCX, editar e exportar.
          </p>
        </div>
      </div>

      <main className="pb-16 pt-4">
        <PlanejamentosClient trialMode />
      </main>
    </div>
  );
}
