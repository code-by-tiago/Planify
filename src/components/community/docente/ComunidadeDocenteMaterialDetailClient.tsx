"use client";

import { MarketplaceMaterialViewClient } from "@/components/community/MarketplaceMaterialViewClient";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { comunidadeRoutes, homeWithAba, isComunidadeEmbedded } from "@/lib/community/docente-utils";
import { useSearchParams } from "next/navigation";

export function ComunidadeDocenteMaterialDetailClient({
  materialId,
  forceEmbedded,
}: {
  materialId: string;
  forceEmbedded?: boolean;
}) {
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);
  const homeHref = homeWithAba("materiais", embedded);

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      wide
      activeMenu="materiais"
      breadcrumbs={[{ label: "Materiais", href: homeHref }]}
      title="Material"
      subtitle="Visualize, baixe e interaja com o material."
    >
      <MarketplaceMaterialViewClient materialId={materialId} embeddedInCommunity />
    </ComunidadeDocenteDetailShell>
  );
}
