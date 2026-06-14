export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteEventoDetailClient } from "@/components/community/docente/ComunidadeDocenteEventoDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteEventoDetailClient eventId={id} />
    </PremiumAccessGate>
  );
}
