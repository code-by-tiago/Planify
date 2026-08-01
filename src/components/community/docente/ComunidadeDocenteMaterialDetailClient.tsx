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
<<<<<<< HEAD
  const homeHref = homeWithAba("materiais", embedded);
=======
  const homeHref = homeWithAba("inicio", embedded);
>>>>>>> origin/aplicar-melhorias-na-producao

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      wide
<<<<<<< HEAD
      activeMenu="materiais"
      breadcrumbs={[{ label: "Materiais", href: homeHref }]}
=======
      activeMenu="inicio"
      breadcrumbs={[{ label: "Feed", href: homeHref }]}
>>>>>>> origin/aplicar-melhorias-na-producao
      title="Material"
      subtitle="Visualize, baixe e interaja com o material."
    >
      <MarketplaceMaterialViewClient materialId={materialId} embeddedInCommunity />
    </ComunidadeDocenteDetailShell>
  );
}
