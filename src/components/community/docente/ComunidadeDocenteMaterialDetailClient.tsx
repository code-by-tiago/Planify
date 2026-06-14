"use client";

import { MarketplaceMaterialViewClient } from "@/components/community/MarketplaceMaterialViewClient";
import Link from "next/link";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { comunidadeRoutes } from "@/lib/community/docente-utils";

export function ComunidadeDocenteMaterialDetailClient({ materialId }: { materialId: string }) {
  return (
    <ComunidadeDocenteDetailShell
      activeMenu="materiais"
      breadcrumbs={[{ label: "Materiais", href: comunidadeRoutes.home }]}
      title="Material"
      subtitle="Visualize, baixe e interaja com o material."
    >
      <div className="mb-4">
        <Link
          href={comunidadeRoutes.home}
          className="text-xs font-bold text-cyan-600 hover:underline"
        >
          ← Voltar à comunidade
        </Link>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <MarketplaceMaterialViewClient materialId={materialId} />
      </div>
    </ComunidadeDocenteDetailShell>
  );
}
