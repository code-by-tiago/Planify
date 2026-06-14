export const dynamic = "force-dynamic";

import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteDesafiosPageClient } from "@/components/community/docente/ComunidadeDocenteDesafiosPageClient";

export default function DesafiosPage() {
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <ComunidadeDocenteDesafiosPageClient />
    </PremiumAccessGate>
  );
}
