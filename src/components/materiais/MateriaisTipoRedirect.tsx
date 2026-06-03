"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { planifyTools } from "@/lib/pro/planifyTools";

function isValidTipo(value: string | null): boolean {
  return planifyTools.some((tool) => tool.id === value);
}

type MateriaisTipoRedirectProps = {
  children: ReactNode;
};

/**
 * Redireciona /materiais?tipo=… para o painel (/dashboard?tipo=…).
 */
export default function MateriaisTipoRedirect({
  children,
}: MateriaisTipoRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const shouldRedirect = isValidTipo(tipo);

  useEffect(() => {
    if (!shouldRedirect || !tipo) return;

    const params = new URLSearchParams();
    params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    const tema = searchParams.get("tema");
    if (tema) params.set("tema", tema);

    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }, [shouldRedirect, tipo, categoria, searchParams, router]);

  if (shouldRedirect) {
    return (
      <main className="planify-ui3 flex h-full min-h-[280px] flex-1 items-center justify-center p-6">
        <div className="text-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-fuchsia-500" />
          <p className="mt-4 text-sm font-bold text-violet-500">
            Abrindo no painel…
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
