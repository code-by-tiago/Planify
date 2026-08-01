"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";
import { isActivePlanifyToolId } from "@/lib/pro/planifyTools";

function isValidTipo(value: string | null): boolean {
  return isActivePlanifyToolId(value);
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

    if (legacy) {
      params.set("secao", legacy);
    } else {
      params.delete("tipo");
    }

    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [router, searchParams, legacy]);

  return <PlanifyToolRedirectShell />;
}
