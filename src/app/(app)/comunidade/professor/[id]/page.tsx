export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteProfessorDetailClient } from "@/components/community/docente/ComunidadeDocenteProfessorDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProfessorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteProfessorDetailClient userId={id} />
    </PremiumAccessGate>
  );
}
