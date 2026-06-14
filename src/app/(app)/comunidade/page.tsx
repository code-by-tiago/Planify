export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ComunidadeDocenteClient from "@/components/community/docente/ComunidadeDocenteClient";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";

export default function ComunidadePage() {
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <Suspense>
        <ComunidadeDocenteClient />
      </Suspense>
    </PremiumAccessGate>
  );
}
