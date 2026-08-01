"use client";

import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";

type PlanifyToolRedirectShellProps = {
  message?: string;
};

export function PlanifyToolRedirectShell({
  message = "Abrindo no painel…",
}: PlanifyToolRedirectShellProps) {
  return (
    <main className="planify-hud planify-ui3 flex h-full min-h-[280px] flex-1 items-center justify-center p-6">
      <div className="pl-hud-glass flex flex-col items-center rounded-2xl px-8 py-10 text-center">
        <PlanifyOwlMark size={64} glow />
        <span className="mt-4 inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        <p className="mt-3 text-sm font-semibold text-cyan-700">{message}</p>
      </div>
    </main>
  );
}

export function PlanifyHubPageFallback() {
  return <PlanifyToolRedirectShell message="Carregando…" />;
}
