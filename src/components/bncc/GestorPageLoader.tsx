"use client";

import { Suspense } from "react";
import { DirectorPanelClient } from "@/components/bncc/DirectorPanelClient";

function GestorLoading() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center">
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
    </div>
  );
}

export function GestorPageLoader() {
  return (
    <Suspense fallback={<GestorLoading />}>
      <DirectorPanelClient />
    </Suspense>
  );
}
