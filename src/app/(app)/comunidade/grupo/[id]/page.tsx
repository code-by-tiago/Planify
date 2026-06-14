export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteGrupoDetailClient } from "@/components/community/docente/ComunidadeDocenteGrupoDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function GrupoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteGrupoDetailClient groupId={id} />
    </PremiumAccessGate>
  );
}
