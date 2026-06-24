"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { getSentryDsn } from "@/lib/ops/sentry-dsn";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    if (getSentryDsn()) {
      Sentry.captureException(error, {
        tags: { boundary: "global-error" },
      });
    }
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <main className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            Algo inesperado aconteceu
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Não foi possível carregar esta página. Tente novamente ou volte ao
            painel.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
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
      </body>
    </html>
  );
}
