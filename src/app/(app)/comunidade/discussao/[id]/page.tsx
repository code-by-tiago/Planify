export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteDiscussaoDetailClient } from "@/components/community/docente/ComunidadeDocenteDiscussaoDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export default async function DiscussaoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteDiscussaoDetailClient postId={id} />
    </PremiumAccessGate>
  );
}
