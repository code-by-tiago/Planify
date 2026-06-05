"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  return (
    <main className="planify-ui3 flex h-full min-h-[280px] flex-1 items-center justify-center p-6">
      <div className="text-center">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-bold text-indigo-600">
          Abrindo no painel…
        </p>
      </div>
    </main>
  );
}
