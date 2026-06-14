export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import { ComunidadeDocenteBuscaClient } from "@/components/community/docente/ComunidadeDocenteBuscaClient";

export default function BuscaProfessoresPage() {
  return (
    <PremiumAccessGate featureName="a Comunidade Docente">
      <Suspense>
        <ComunidadeDocenteBuscaClient />
      </Suspense>
    </PremiumAccessGate>
  );
}
