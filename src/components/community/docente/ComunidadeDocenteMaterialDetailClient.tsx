"use client";

import { MarketplaceMaterialViewClient } from "@/components/community/MarketplaceMaterialViewClient";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { comunidadeRoutes, readEmbedded } from "@/lib/community/docente-utils";
import { useSearchParams } from "next/navigation";

export function ComunidadeDocenteMaterialDetailClient({ materialId }: { materialId: string }) {
  const searchParams = useSearchParams();
  const embedded = readEmbedded(searchParams);
  const homeHref = embedded ? comunidadeRoutes.homeEmbedded : comunidadeRoutes.home;

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      activeMenu="materiais"
      breadcrumbs={[{ label: "Materiais", href: homeHref }]}
      title="Material"
      subtitle="Visualize, baixe e interaja com o material."
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <MarketplaceMaterialViewClient materialId={materialId} embeddedInCommunity />
      </div>
    </ComunidadeDocenteDetailShell>
  );
}
