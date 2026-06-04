"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";

type DashboardHubRedirectProps = {
  section: DashboardSectionId;
};

/**
 * Redireciona rotas legadas (/planejamentos, /editor, …) para o painel único.
 */
export default function DashboardHubRedirect({
  section,
}: DashboardHubRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tipo");
    params.set("secao", section);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router, searchParams, section]);

  return (
    <main className="planify-ui3 flex h-full min-h-[280px] flex-1 items-center justify-center p-6">
      <div className="text-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-bold text-indigo-600">Abrindo no painel…</p>
      </div>
    </main>
  );
}
