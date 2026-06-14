export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteMaterialDetailClient } from "@/components/community/docente/ComunidadeDocenteMaterialDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function MaterialDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteMaterialDetailClient materialId={id} />
    </PremiumAccessGate>
  );
}
