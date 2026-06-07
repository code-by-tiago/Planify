"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import PlanifyAppFrame from "@/components/pro/PlanifyAppFrame";

type AppLayoutClientProps = {
  children: ReactNode;
};

function AppFrameFallback() {
  return (
    <main className="planify-hud planify-ui3 flex h-[100dvh] w-full items-center justify-center bg-white">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
    </main>
  );
}

/**
 * Dashboard usa shell próprio (sidebar + quadrante). Demais rotas usam PlanifyAppFrame.
 */
export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<AppFrameFallback />}>
      <PlanifyAppFrame compact>{children}</PlanifyAppFrame>
    </Suspense>
  );
}
