export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteDesafiosPageClient } from "@/components/community/docente/ComunidadeDocenteDesafiosPageClient";

export default function DesafiosPage() {
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <Suspense>
        <ComunidadeDocenteDesafiosPageClient />
      </Suspense>
    </PremiumAccessGate>
  );
}
