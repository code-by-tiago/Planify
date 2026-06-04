"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { planifyTools } from "@/lib/pro/planifyTools";

const sectionToTool: Record<string, string> = {
  planejamentos: "plano-aula",
};

function isValidTipo(value: string | null): boolean {
  return planifyTools.some((tool) => tool.id === value);
}

type DashboardHubRedirectProps = {
  /** Rota legada → abre ferramenta ou painel */
  legacy?: "planejamentos" | "editor" | "historico" | "biblioteca" | "marketplace" | "materiais";
};

/**
 * Redireciona rotas legadas para o painel único (/dashboard).
 */
export default function DashboardHubRedirect({
  legacy,
}: DashboardHubRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("secao");

    const tipoFromUrl = params.get("tipo");
    if (isValidTipo(tipoFromUrl) && tipoFromUrl) {
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
      return;
    }

    if (legacy && sectionToTool[legacy]) {
      params.set("tipo", sectionToTool[legacy]);
    } else {
      params.delete("tipo");
    }

    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [router, searchParams, legacy]);

  return (
    <main className="planify-ui3 flex h-full min-h-[280px] flex-1 items-center justify-center p-6">
      <div className="text-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-bold text-indigo-600">Abrindo no painel…</p>
      </div>
    </main>
  );
}
