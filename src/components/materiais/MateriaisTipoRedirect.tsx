"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanifyToolRedirectShell } from "@/components/dashboard/PlanifyToolRedirectShell";
import { planifyTools } from "@/lib/pro/planifyTools";

function isValidTipo(value: string | null): boolean {
  return planifyTools.some((tool) => tool.id === value);
}

/**
 * Redireciona /materiais para o painel único (/dashboard).
 */
export default function MateriaisTipoRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");

  useEffect(() => {
    const params = new URLSearchParams();
    if (isValidTipo(tipo) && tipo) {
      params.set("tipo", tipo);
    }
    if (categoria) params.set("categoria", categoria);
    const tema = searchParams.get("tema");
    if (tema) params.set("tema", tema);

    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [tipo, categoria, searchParams, router]);

  return <PlanifyToolRedirectShell />;
}
