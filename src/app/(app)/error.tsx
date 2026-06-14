"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <main className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">
          Não foi possível carregar esta seção
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ocorreu um erro inesperado. Tente novamente ou volte ao painel principal.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Ir ao painel
          </a>
        </div>
      </main>
    </div>
  );
}
